import { flowRaw, flowFile } from "../src/htmlParser";
import {
  TFElementType,
  TFTag,
  TFDocType,
  TFText,
  TFComment,
} from "../src/elements";
import { addressNodes } from "../src/locator";

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
  it("should parse void tags with arguments", () => {
    const html = '<br class="test" id="testId" disable><meta charset="utf-8">';
    const result = flowRaw(html);
    expect(result.elements).toHaveLength(2);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("br");
    expect((result.elements[0] as TFTag).isVoidTag).toBe(true);
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
  it("should parse nested void tags", () => {
    const html = `<head><meta charset="utf-8">
    <meta name="theme-color" content="#FBFBFB">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jacob K Lewis</title>
</head>`;
    const result = flowRaw(html);
    expect((result.elements as TFTag[])[0].innerTags).toHaveLength(4);
    expect((result.elements as TFTag[])[0].name).toBe("head");
    expect((result.elements as TFTag[])[0].isVoidTag).toBe(false);
    const innerTags = (result.elements[0] as TFTag).innerTags;
    expect(innerTags[0].type).toBe(TFElementType.TAG);
    expect((innerTags[0] as TFTag).name).toBe("meta");
    expect((innerTags[0] as TFTag).isVoidTag).toBe(true);
    const attributes = (innerTags[0] as TFTag).attributes;
    const keys = Object.keys(attributes);
    const values = Object.values(attributes);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe("charset");
    expect(values[0]).toBe("utf-8");
    expect(innerTags[1].type).toBe(TFElementType.TAG);
    expect((innerTags[1] as TFTag).name).toBe("meta");
    expect((innerTags[1] as TFTag).isVoidTag).toBe(true);
    const attributes2 = (innerTags[1] as TFTag).attributes;
    const keys2 = Object.keys(attributes2);
    const values2 = Object.values(attributes2);
    expect(keys2).toHaveLength(2);
    expect(keys2[0]).toBe("name");
    expect(values2[0]).toBe("theme-color");
    expect(keys2[1]).toBe("content");
    expect(values2[1]).toBe("#FBFBFB");
    expect(innerTags[2].type).toBe(TFElementType.TAG);
    expect((innerTags[2] as TFTag).name).toBe("meta");
    expect((innerTags[2] as TFTag).isVoidTag).toBe(true);
    const attributes3 = (innerTags[2] as TFTag).attributes;
    const keys3 = Object.keys(attributes3);
    const values3 = Object.values(attributes3);
    expect(keys3).toHaveLength(2);
    expect(keys3[0]).toBe("name");
    expect(values3[0]).toBe("viewport");
    expect(keys3[1]).toBe("content");
    expect(values3[1]).toBe("width=device-width, initial-scale=1.0");
    expect(innerTags[3].type).toBe(TFElementType.TAG);
    expect((innerTags[3] as TFTag).name).toBe("title");
    expect((innerTags[3] as TFTag).isVoidTag).toBe(false);
    const attributes4 = (innerTags[3] as TFTag).attributes;
    const keys4 = Object.keys(attributes4);
    expect(keys4).toHaveLength(0);
    expect((innerTags[3] as TFTag).innerTags).toHaveLength(1);
    expect((innerTags[3] as TFTag).innerTags[0].type).toBe(TFElementType.TEXT);
    expect(((innerTags[3] as TFTag).innerTags[0] as TFText).text).toBe(
      "Jacob K Lewis"
    );
  });
  it("should parse an html file", () => {
    const result = flowFile("tests/testfiles/a.html");
    const head = result.q("head");
    expect(head.tags[0].innerTags).toHaveLength(5);
  });
  it("should parse an html file with inline styles", () => {
    const result = flowFile("tests/testfiles/b.html");
    const styleTags = result.q("style");
    expect(styleTags.tags).toHaveLength(1);
    expect(styleTags.tags[0].innerTags).toHaveLength(1);
  });
  it("should parse an html file with inline script", () => {
    const result = flowFile("tests/testfiles/c.html");
    const styleTags = result.q("script");
    expect(styleTags.tags).toHaveLength(1);
    expect(styleTags.tags[0].innerTags).toHaveLength(1);
  });
  it("should parse an html file with nested malformed <a></b> tags", () => {
    const result = flowFile("tests/testfiles/d.html");
    const divTags = result.q("body");
    expect(divTags.tags).toHaveLength(1);
    expect(divTags.tags[0].innerTags).toHaveLength(3);
    const flour = result.q("*Flour");
    expect(flour.tags).toHaveLength(1);
    expect(flour.tags[0].name).toBe("h3"); // the h3 tag is the parent of the text "Flour" with a closing tag of </h2>
  });
  it("should parse html with many whitespace characters", () => {
    const html = `<div><div>    <p></p></div><div></div></div>`;
    const result = flowRaw(html);
    console.log(
      ((result.elements[0] as TFTag).innerTags[0] as TFTag).innerTags
    );
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
    const innerTags = (result.elements[0] as TFTag).innerTags;
    console.log(innerTags);
    expect(innerTags).toHaveLength(2);
    expect(innerTags[0].type).toBe(TFElementType.TAG);
    expect((innerTags[0] as TFTag).name).toBe("div");
    expect(innerTags[1].type).toBe(TFElementType.TAG);
    expect((innerTags[1] as TFTag).name).toBe("div");
  });
  it("should verify addresses", () => {
    const html = "<div><span>Hello</span> World</div>";
    const elements = flowRaw(html).elements;
    addressNodes(elements);
    expect(elements[0].address).toEqual([0]);
    expect((elements[0] as TFTag).innerTags[0].address).toEqual([0, 0]);
    expect((elements[0] as TFTag).innerTags[1].address).toEqual([0, 1]);
    expect(((elements[0] as TFTag).innerTags[1] as TFText).text).toEqual(
      " World"
    );
    expect(
      ((elements[0] as TFTag).innerTags[0] as TFTag).innerTags[0].address
    ).toEqual([0, 0, 0]);
  });
});
