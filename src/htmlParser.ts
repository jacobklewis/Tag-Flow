import { BufferState, BufferStatus } from "./buffer.js";
import {
  ExtensionTags,
  TFComment,
  TFDocType,
  TFElement,
  TFElementType,
  TFHeader,
  TFPlaceholder,
  TFTag,
  TFText,
  VoidTags,
} from "./elements.js";
import { readFileSync } from "fs";
import { FlowGuide } from "./flowGuide.js";
import { addressNodes } from "./locator.js";
import { TFLogger } from "./logger.js";

const tfl = TFLogger.getInstance();

export const flowFile = (src: string): FlowGuide => {
  tfl.log(`\n--- FlowFile ---`);
  tfl.log(`Parsing file: ${src}`);
  const html = readFileSync(src, "utf-8");
  const result = flow(html);
  return result;
};

export const flow = (content: string): FlowGuide => {
  tfl.log(`\n--- Flow ---`);
  const elements = flowRaw(content).elements;
  addressNodes(elements);

  return new FlowGuide(elements);
};

export const flowRaw = (
  content: string,
  ext: string | undefined = undefined
): ParsingResponse => {
  const html = content;
  tfl.log(`\n--- FlowRaw ---`);
  tfl.log(`Parsing string of length: ${html.length}`);
  tfl.log(`Extension: ${ext ?? "None"}`);
  // parse the string and return an array of HTMLTag objects
  if (html.trim() === "") {
    tfl.log("Empty HTML string, returning empty elements.");
    return { elements: [], endingIndex: 0 };
  }
  const elements: TFElement[] = [];
  const buffer: BufferState = {
    buffer: "",
    status: [BufferStatus.START],
    currentElement: null,
  };
  let endingIndex = 0;
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    let res: HandlerResponse = { endingIndex: undefined, i };
    if (tfl.enabled && char === tfl.getBreakpointKey()) {
      tfl.log(
        `==================\nBreakpoint ${char} hit at index ${i}, pausing execution.`
      );
      tfl.log(`Current buffer: "${buffer.buffer}"`);
      tfl.log(`Current status: ${buffer.status}`);
      tfl.log(`Current elements count: ${elements.length}`);
      tfl.log(`Current body being processed: ${html}\n==================`);
    }
    if (char === "<") {
      res = handleOpenCaret({ buffer, char, i, html, elements, ext });
    } else if (char === ">") {
      res = handleCloseCaret({ buffer, char, i, html, elements, ext });
    } else if (char === "/") {
      res = handleForwardSlash({ buffer, char, i, html, elements, ext });
    } else if (char === '"') {
      res = handleDoubleQuote({ buffer, char, i, html, elements, ext });
    } else if (char === "'") {
      res = handleSingleQuote({ buffer, char, i, html, elements, ext });
    } else if (char === "{") {
      res = handlePlaceholderOpen({ buffer, char, i, html, elements, ext });
    } else if (char === "}") {
      res = handlePlaceholderClose({ buffer, char, i, html, elements, ext });
    } else {
      addingCharacterToBuffer(buffer, char, i);
    }
    if (res.endingIndex !== undefined) {
      endingIndex = res.endingIndex;
      break;
    }
    i = res.i;
  }
  if (buffer.buffer.trim() !== "") {
    // create a text element
    elements.push({
      type: TFElementType.TEXT,
      address: [] as number[],
      text: buffer.buffer,
    } as TFText);
    buffer.buffer = "";
  }
  return { elements, endingIndex };
};

function handleOpenCaret(req: HandlerRequest): HandlerResponse {
  let i = req.i;
  const { char, buffer, elements, html } = req;
  if (req.ext && req.html.indexOf(`</${req.ext}>`, i) !== i) {
    tfl.log(
      `Extension tag <${req.ext}> not found at index ${i}, treating as text.`
    );
    buffer.buffer += char;
  } else if (buffer.status[0] === BufferStatus.START) {
    tfl.log(`Handling open caret at index ${i}`);
    createTextElement(buffer, elements, i);
    const nextChar = html[i + 1];
    const nextX2Char = html[i + 2];
    const nextX3Char = html[i + 3];
    if (nextChar === "/") {
      tfl.log(`Found closing tag at index ${i}`);
      // Complete
      return {
        endingIndex: i,
        i,
      } as HandlerResponse;
    }
    if (nextChar === "!" && nextX2Char === "-" && nextX3Char === "-") {
      tfl.log(`Found comment at index ${i}`);
      // Comment
      buffer.status = [BufferStatus.COMMENT];
      buffer.buffer = "";
      i += 3; // Skip the <!--
      return { i } as HandlerResponse;
    }
    if (nextChar === "!" && nextX2Char === "D" && nextX3Char === "O") {
      tfl.log(`Found doctype at index ${i}`);
      // Doctype
      buffer.status = [BufferStatus.DOCTYPE];
      buffer.buffer = "";
      i += 8; // Skip the <!DOCTYPE
      return { i } as HandlerResponse;
    }
    if (nextChar === "?") {
      tfl.log(`Found XML header at index ${i}`);
      // XML Header
      buffer.status = [BufferStatus.HEADER];
      buffer.buffer = "";
      i += 1; // Skip the <?
      return { i } as HandlerResponse;
    }
    buffer.status = [BufferStatus.TAG_OPEN];
    buffer.buffer = "";
  } else if (
    buffer.status[0] === BufferStatus.TAG_OPEN ||
    buffer.status[0] === BufferStatus.TAG_CLOSE
  ) {
    tfl.log(`Unexpected < character at index ${i}`, true);
    throw new Error(`Unexpected < character: ${buffer.status}`);
  } else if (buffer.status[0] === BufferStatus.INNER_HTML) {
    tfl.log(`Ending inner HTML at index ${i}`);
    buffer.status = [BufferStatus.TAG_CLOSE];
    buffer.buffer = "";
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i };
}
function handleCloseCaret(req: HandlerRequest): HandlerResponse {
  let i = req.i;
  const { char, buffer, elements, html } = req;
  if (buffer.status[0] === BufferStatus.DOCTYPE) {
    buffer.status = [BufferStatus.START];
    const doctype = buffer.buffer.trim();
    tfl.log(`Creating doctype at index ${i} with value: "${doctype}"`);
    if (doctype !== "") {
      elements.push({
        type: TFElementType.DOCTYPE,
        address: [],
        docType: doctype,
      } as TFDocType);
    }
    buffer.buffer = "";
  } else if (buffer.status[0] === BufferStatus.TAG_OPEN) {
    buffer.status = [BufferStatus.INNER_HTML];
    const res = parseNameAndAttr(buffer.buffer.trim());
    let innerElements: TFElement[] = [];
    if (!VoidTags.includes(res.name.toLowerCase())) {
      let nExt = undefined;
      if (ExtensionTags.includes(res.name.toLowerCase())) {
        tfl.log(`Found extension tag: ${res.name}`);
        nExt = res.name;
      }
      const remainingString = html.slice(i + 1);
      tfl.log(
        `Parsing inner HTML for tag: ${res.name}, remaining string length: ${remainingString.length}`
      );
      const innerResult = flowRaw(remainingString, nExt);
      // console.log("Inner result:", innerResult);
      i = innerResult.endingIndex + i;
      innerElements = innerResult.elements;
      tfl.log(
        `Parsed inner tags for ${res.name}: ${JSON.stringify(innerElements)}.`
      );
    }
    tfl.log(`Creating tag element: ${res.name} ending at index ${i}`);
    buffer.currentElement = {
      type: TFElementType.TAG,
      address: [] as number[],
      name: res.name,
      attributes: res.attributes,
      innerTags: innerElements,
    } as TFTag;
    buffer.buffer = "";
    // Check for void tags
    if (VoidTags.includes(res.name.toLowerCase())) {
      tfl.log(`Found void tag: ${res.name}, marking as void.`);
      (buffer.currentElement as TFTag).isVoidTag = true;
      elements.push(buffer.currentElement);
      buffer.currentElement = null;
      buffer.status = [BufferStatus.START];
    }
  } else if (buffer.status[0] === BufferStatus.TAG_COMPLETE) {
    tfl.log(`Handling tag complete at index ${i}`);
    buffer.status = [BufferStatus.START];
    if (buffer.currentElement) {
      if (
        buffer.currentElement.type === TFElementType.TAG &&
        (buffer.currentElement as TFTag).isVoidTag !== true
      ) {
        (buffer.currentElement as TFTag).isVoidTag = false;
      }
      tfl.log(`Adding ${buffer.currentElement.type} to elements.`);
      elements.push(buffer.currentElement);
    }
    buffer.currentElement = null;
    buffer.buffer = "";
  } else if (buffer.status[0] === BufferStatus.COMMENT) {
    const lastChar = html[i - 1];
    const lastX2Char = html[i - 2];
    if (lastChar === "-" && lastX2Char === "-") {
      const bufferLenth = buffer.buffer.length;
      const comment = buffer.buffer.slice(0, bufferLenth - 2).trim();
      if (comment !== "") {
        tfl.log(`Creating comment element: "${comment}" at index ${i}`);
        elements.push({
          type: TFElementType.COMMENT,
          comment: comment,
        } as TFComment);
      }
      buffer.status = [BufferStatus.START];
      buffer.buffer = "";
    } else {
      addingCharacterToBuffer(buffer, char, i);
    }
  } else if (buffer.status[0] === BufferStatus.HEADER) {
    const lastChar = html[i - 1];
    if (lastChar === "?") {
      tfl.log(`Creating XML header element at index ${i}`);
      // XML Header
      // remove `?` from end
      const headerParsed = parseHeader(buffer.buffer.slice(0, -1).trim());
      if (headerParsed) {
        elements.push(headerParsed);
      }
      buffer.status = [BufferStatus.START];
      buffer.buffer = "";
    } else {
      addingCharacterToBuffer(buffer, char, i);
    }
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i };
}
function handleForwardSlash(req: HandlerRequest): HandlerResponse {
  const { char, buffer, i } = req;
  if (buffer.status[0] === BufferStatus.TAG_OPEN) {
    tfl.log(`Handling explicit void tag at index ${i}`);
    buffer.status = [BufferStatus.TAG_COMPLETE];
    const res = parseNameAndAttr(buffer.buffer.trim());
    buffer.currentElement = {
      type: TFElementType.TAG,
      address: [],
      name: res.name,
      attributes: res.attributes,
      innerTags: [],
      isVoidTag: true,
    } as TFTag;
    buffer.buffer = "";
  } else if (buffer.status[0] === BufferStatus.TAG_CLOSE) {
    tfl.log(`Handling closing tag at index ${i}`);
    buffer.status = [BufferStatus.TAG_COMPLETE];
    buffer.buffer = "";
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i: req.i };
}
function handleDoubleQuote(req: HandlerRequest): HandlerResponse {
  const { char, buffer, i } = req;
  if (buffer.status[0] === BufferStatus.TAG_OPEN) {
    tfl.log(`Starting double quote at index ${i}`);
    buffer.status.unshift(BufferStatus.DOUBLE_QUOTE);
    buffer.buffer += char;
  } else if (buffer.status[0] === BufferStatus.DOUBLE_QUOTE) {
    tfl.log(`Ending double quote at index ${i}`);
    buffer.status.shift();
    buffer.buffer += char;
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i: req.i };
}
function handleSingleQuote(req: HandlerRequest): HandlerResponse {
  const { char, buffer, i } = req;
  if (buffer.status[0] === BufferStatus.TAG_OPEN) {
    tfl.log(`Starting single quote at index ${i}`);
    buffer.status.unshift(BufferStatus.SINGLE_QUOTE);
    buffer.buffer += char;
  } else if (buffer.status[0] === BufferStatus.SINGLE_QUOTE) {
    tfl.log(`Ending single quote at index ${i}`);
    buffer.status.shift();
    buffer.buffer += char;
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i: req.i };
}
function handlePlaceholderOpen(req: HandlerRequest): HandlerResponse {
  const { char, buffer, html } = req;
  let i = req.i;
  const nextChar = html[i + 1];
  if (buffer.status[0] === BufferStatus.START && nextChar === "{") {
    createTextElement(buffer, req.elements, i);
    tfl.log(`Handling placeholder open at index ${i}`);
    buffer.status.unshift(BufferStatus.PLACEHOLDER);
    i += 1; // Skip the {
    buffer.buffer = ""; // Clear the buffer for placeholder content
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i };
}

function handlePlaceholderClose(req: HandlerRequest): HandlerResponse {
  const { char, buffer, html } = req;
  let i = req.i;
  const nextChar = html[i + 1];
  if (buffer.status[0] === BufferStatus.PLACEHOLDER && nextChar === "}") {
    tfl.log(`Handling placeholder close at index ${i}`);
    buffer.status.shift(); // Remove PLACEHOLDER status
    const placeholder = buffer.buffer.trim();
    if (placeholder !== "") {
      tfl.log(`Creating placeholder element: "${placeholder}" at index ${i}`);
      const placeholderElement: TFPlaceholder = {
        type: TFElementType.PLACEHOLDER,
        address: [],
        key: placeholder,
        value: undefined, // Placeholder value can be set later
      };
      // Add the placeholder element to the elements array
      req.elements.push(placeholderElement);
    }
    i += 1; // Skip the }
    buffer.buffer = ""; // Clear the buffer after creating the placeholder
  } else {
    addingCharacterToBuffer(buffer, char, i);
  }
  return { endingIndex: undefined, i };
}

function createTextElement(
  buffer: BufferState,
  elements: TFElement[],
  i: number
): void {
  if (buffer.buffer.trim() !== "") {
    tfl.log(`Buffer not empty, creating text element: "${buffer.buffer}"`);
    elements.push({
      type: TFElementType.TEXT,
      address: [] as number[],
      text: buffer.buffer,
    } as TFText);
    buffer.buffer = "";
  }
}

function parseNameAndAttr(buffer: string): {
  name: string;
  attributes: { [key: string]: string };
} {
  const nameAndAttr = buffer.split(" ");
  const name = nameAndAttr[0];
  const attrsString = nameAndAttr.slice(1).join(" ");
  const attributes: { [key: string]: string } = {};
  const attrRegex = /(\w+)(?:(?:\s*=\s*"([^"]*)")|(?:\s*=\s*'([^']*)'))?/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
    attributes[attrMatch[1]] = attrMatch[2] ?? attrMatch[3] ?? "";
  }
  tfl.log(
    `Parsed tag name: "${name}" with attributes: ${JSON.stringify(attributes)}`
  );
  return { name, attributes };
}

function parseHeader(header: string): TFHeader | undefined {
  const match = header.match(
    /^(.*?)\s+version="([^"]+)"(?:\s+encoding="([^"]+)")?$|^(.*)$/
  );
  if (match) {
    if (match[1]) {
      tfl.log(
        `Parsed header: name="${match[1]} version="${match[2]}", encoding="${match[3]}"`
      );
      return {
        type: TFElementType.HEADER,
        name: match[1],
        version: match[2],
        encoding: match[3],
        address: [],
      };
    } else {
      tfl.log(`Parsed header: name="${match[4]}"`);
      return {
        type: TFElementType.HEADER,
        name: match[4],
        version: undefined,
        encoding: undefined,
        address: [],
      };
    }
  }
  return undefined;
}

function addingCharacterToBuffer(
  buffer: BufferState,
  char: string,
  i: number
): BufferState {
  let charToLog = char;
  if (charToLog === "\n") {
    charToLog = "\\n"; // Log newline as \n for clarity
  } else if (charToLog === "\t") {
    charToLog = "\\t"; // Log tab as \t for clarity
  }
  tfl.log(`Adding character to buffer: "${charToLog}" at index ${i}`);
  buffer.buffer += char;
  return buffer;
}

export interface ParsingResponse {
  elements: TFElement[];
  endingIndex: number;
}
interface HandlerRequest {
  buffer: BufferState;
  char: string;
  i: number;
  html: string;
  elements: TFElement[];
  ext?: string | undefined;
}
interface HandlerResponse {
  endingIndex: number | undefined;
  i: number;
}
