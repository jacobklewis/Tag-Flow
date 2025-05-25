import { BufferState, BufferStatus } from "./buffer.js";
import {
  TFComment,
  TFDocType,
  TFElement,
  TFElementType,
  TFTag,
  TFText,
  VoidTags,
} from "./elements.js";
import { readFileSync } from "fs";
import { FlowGuide } from "./flowGuide.js";
import { addressNodes } from "./locator.js";

export const flowFile = (src: string): FlowGuide => {
  const html = readFileSync(src, "utf-8");
  const result = flow(html);
  return result;
};

export const flow = (html: string): FlowGuide => {
  const elements = flowRaw(html).elements;
  addressNodes(elements);
  return new FlowGuide(elements);
};

export const flowRaw = (html: string): ParsingResponse => {
  //   console.log("Parsing HTML:", html);
  // parse the html string and return an array of HTMLTag objects
  html = html.trim();
  if (html === "") {
    return { elements: [], endingIndex: 0 };
  }
  const elements: TFElement[] = [];
  const buffer: BufferState = {
    buffer: "",
    status: BufferStatus.START,
    currentElement: null,
  };
  let endingIndex = 0;
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    let res: HandlerResponse = { endingIndex: undefined, i };
    if (char === "<") {
      res = handleOpenCaret({ buffer, char, i, html, elements });
    } else if (char === ">") {
      res = handleCloseCaret({ buffer, char, i, html, elements });
    } else if (char === "/") {
      res = handleForwardSlash({ buffer, char, i, html, elements });
    } else if (char === '"') {
      res = handleDoubleQuote({ buffer, char, i, html, elements });
    } else if (char === "'") {
      res = handleSingleQuote({ buffer, char, i, html, elements });
    } else {
      buffer.buffer += char;
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
  if (buffer.status === BufferStatus.START) {
    // console.log("Tag open", html, i);
    if (buffer.buffer.trim() !== "") {
      elements.push({
        type: TFElementType.TEXT,
        address: [] as number[],
        text: buffer.buffer,
      } as TFText);
      buffer.buffer = "";
    }
    const nextChar = html[i + 1];
    const nextX2Char = html[i + 2];
    const nextX3Char = html[i + 3];
    if (nextChar === "/") {
      // Complete
      return {
        endingIndex: i,
        i,
      } as HandlerResponse;
    }
    if (nextChar === "!" && nextX2Char === "-" && nextX3Char === "-") {
      // Comment
      buffer.status = BufferStatus.COMMENT;
      buffer.buffer = "";
      i += 3; // Skip the <!--
      return { i } as HandlerResponse;
    }
    if (nextChar === "!" && nextX2Char === "D" && nextX3Char === "O") {
      // Doctype
      buffer.status = BufferStatus.DOCTYPE;
      buffer.buffer = "";
      i += 8; // Skip the <!DOCTYPE
      return { i } as HandlerResponse;
    }
    buffer.status = BufferStatus.TAG_OPEN;
    buffer.buffer = "";
  } else if (
    buffer.status === BufferStatus.TAG_OPEN ||
    buffer.status === BufferStatus.TAG_CLOSE
  ) {
    throw new Error("Unexpected < character");
  } else if (buffer.status === BufferStatus.INNER_HTML) {
    buffer.status = BufferStatus.TAG_CLOSE;
    // console.log("Tag close");
    buffer.buffer = "";
  } else {
    buffer.buffer += char;
  }
  return { endingIndex: undefined, i };
}
function handleCloseCaret(req: HandlerRequest): HandlerResponse {
  let i = req.i;
  const { char, buffer, elements, html } = req;
  if (buffer.status === BufferStatus.DOCTYPE) {
    buffer.status = BufferStatus.START;
    const doctype = buffer.buffer.trim();
    if (doctype !== "") {
      elements.push({
        type: TFElementType.DOCTYPE,
        address: [],
        docType: doctype,
      } as TFDocType);
    }
    buffer.buffer = "";
  } else if (buffer.status === BufferStatus.TAG_OPEN) {
    buffer.status = BufferStatus.INNER_HTML;
    const res = parseNameAndAttr(buffer.buffer.trim());
    let innerElements: TFElement[] = [];
    if (!VoidTags.includes(res.name.toLowerCase())) {
      const remainingString = html.slice(i + 1);
      const innerResult = flowRaw(remainingString);
      // console.log("Inner result:", innerResult);
      i = innerResult.endingIndex + i;
      innerElements = innerResult.elements;
    }
    // console.log("i:", i);
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
      (buffer.currentElement as TFTag).isVoidTag = true;
      elements.push(buffer.currentElement);
      buffer.currentElement = null;
      buffer.status = BufferStatus.START;
    }
    // console.log("Buffer Status:", buffer.status);
  } else if (buffer.status === BufferStatus.TAG_COMPLETE) {
    buffer.status = BufferStatus.START;
    if (buffer.currentElement) {
      if (
        buffer.currentElement.type === TFElementType.TAG &&
        (buffer.currentElement as TFTag).isVoidTag !== true
      ) {
        (buffer.currentElement as TFTag).isVoidTag = false;
      }
      elements.push(buffer.currentElement);
    }
    buffer.currentElement = null;
    buffer.buffer = "";
  } else if (buffer.status === BufferStatus.COMMENT) {
    const lastChar = html[i - 1];
    const lastX2Char = html[i - 2];
    if (lastChar === "-" && lastX2Char === "-") {
      const bufferLenth = buffer.buffer.length;
      const comment = buffer.buffer.slice(0, bufferLenth - 2).trim();
      if (comment !== "") {
        elements.push({
          type: TFElementType.COMMENT,
          comment: comment,
        } as TFComment);
      }
      buffer.status = BufferStatus.START;
      buffer.buffer = "";
    }
  } else {
    buffer.buffer += char;
  }
  return { endingIndex: undefined, i };
}
function handleForwardSlash(req: HandlerRequest): HandlerResponse {
  const { char, buffer } = req;
  if (buffer.status === BufferStatus.TAG_OPEN) {
    buffer.status = BufferStatus.TAG_COMPLETE;
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
  } else if (buffer.status === BufferStatus.TAG_CLOSE) {
    buffer.status = BufferStatus.TAG_COMPLETE;
    buffer.buffer = "";
  } else {
    buffer.buffer += char;
  }
  return { endingIndex: undefined, i: req.i };
}
function handleDoubleQuote(req: HandlerRequest): HandlerResponse {
  const { char, buffer } = req;
  if (buffer.status === BufferStatus.TAG_OPEN) {
    buffer.status = BufferStatus.TAG_OPEN_DOUBLE_QUOTE;
    buffer.buffer += char;
  } else if (buffer.status === BufferStatus.TAG_OPEN_DOUBLE_QUOTE) {
    buffer.status = BufferStatus.TAG_OPEN;
    buffer.buffer += char;
  } else {
    buffer.buffer += char;
  }
  return { endingIndex: undefined, i: req.i };
}
function handleSingleQuote(req: HandlerRequest): HandlerResponse {
  const { char, buffer } = req;
  if (buffer.status === BufferStatus.TAG_OPEN) {
    buffer.status = BufferStatus.TAG_OPEN_SINGLE_QUOTE;
    buffer.buffer += char;
  } else if (buffer.status === BufferStatus.TAG_OPEN_SINGLE_QUOTE) {
    buffer.status = BufferStatus.TAG_OPEN;
    buffer.buffer += char;
  } else {
    buffer.buffer += char;
  }
  return { endingIndex: undefined, i: req.i };
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
  return { name, attributes };
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
}
interface HandlerResponse {
  endingIndex: number | undefined;
  i: number;
}
