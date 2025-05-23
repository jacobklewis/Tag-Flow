import { flowRaw, flowFile } from "../src/htmlParser";
import {
  TFElementType,
  TFTag,
  TFDocType,
  TFText,
  TFComment,
} from "../src/elements";

describe("parseHTML", () => {
  it("should parse the doctype", () => {
    const html = "<!DOCTYPE html>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.DOCTYPE);
    expect((result.elements[0] as TFDocType).docType).toBe("html");
  });
  it("should parse a simple HTML string", () => {
    const html = "<div>Hello World</div>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
    expect((result.elements[0] as TFTag).isVoidTag).toBe(false);
  });
  it("should parse arguments single quote", () => {
    const html = "<div class='test' id='testId' disable>Hello World</div>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
    const attributes = (result.elements[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    const values = Object.values(attributes);
    expect(keys).toHaveLength(3);
    expect(keys[0]).toBe("class");
    expect(values[0]).toBe("test");
    expect(keys[1]).toBe("id");
    expect(values[1]).toBe("testId");
    expect(keys[2]).toBe("disable");
    expect(values[2]).toBe("");
  });
  it("should parse arguments double quote", () => {
    const html = '<div class="test" id="testId" disable>Hello World</div>';
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
    const attributes = (result.elements[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    const values = Object.values(attributes);
    expect(keys).toHaveLength(3);
    expect(keys[0]).toBe("class");
    expect(values[0]).toBe("test");
    expect(keys[1]).toBe("id");
    expect(values[1]).toBe("testId");
    expect(keys[2]).toBe("disable");
    expect(values[2]).toBe("");
  });
  it("should parse arguments with side carets", () => {
    const html =
      '<div onClick="console.log(2>(9/3));" disable>Hello World</div>';
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
    const attributes = (result.elements[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    const values = Object.values(attributes);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe("onClick");
    expect(values[0]).toBe("console.log(2>(9/3));");
    expect(keys[1]).toBe("disable");
    expect(values[1]).toBe("");
  });
  it("should parse nested tags", () => {
    const html = "<div><span>Hello</span> World</div>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    const innerTags = (result.elements[0] as TFTag).innerTags;
    expect(innerTags).toHaveLength(2);
    expect(innerTags[0].type).toBe(TFElementType.TAG);
    expect((innerTags[0] as TFTag).name).toBe("span");
    expect((innerTags[0] as TFTag).innerTags).toHaveLength(1);
    expect((innerTags[1] as TFText).text).toBe(" World");
  });
  it("should parse comments", () => {
    const html = "<div><!-- Comment --></div>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    const innerTags = (result.elements[0] as TFTag).innerTags;
    expect(innerTags).toHaveLength(1);
    expect(innerTags[0].type).toBe(TFElementType.COMMENT);
    expect((innerTags[0] as TFComment).comment).toBe("Comment");
  });
  it("should parse self closing tags", () => {
    const html = "<img src='test.png' />";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("img");
    expect((result.elements[0] as TFTag).isVoidTag).toBe(true);
    const attributes = (result.elements[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    const values = Object.values(attributes);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe("src");
    expect(values[0]).toBe("test.png");
  });
  it("should parse void tags", () => {
    const html = "<br>";
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("br");
    expect((result.elements[0] as TFTag).isVoidTag).toBe(true);
    const attributes = (result.elements[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    expect(keys).toHaveLength(0);
  });
  it("should parse an html file", () => {
    const result = flowFile("tests/testfiles/a.html");
    console.log(result);
  });
});
