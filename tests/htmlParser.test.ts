import { flow } from "../src/htmlParser";
import { TFElementType, TFTag, TFDocType, TFText } from "../src/elements";

describe("parseHTML", () => {
  it("should parse the doctype", () => {
    const html = "<!DOCTYPE html>";
    const result = flow(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.DOCTYPE);
    expect((result.elements[0] as TFDocType).docType).toBe("html");
  });
  it("should parse a simple HTML string", () => {
    const html = "<div>Hello World</div>";
    const result = flow(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    expect((result.elements[0] as TFTag).name).toBe("div");
  });
  it("should parse arguments single quote", () => {
    const html = "<div class='test' id='testId' disable>Hello World</div>";
    const result = flow(html);
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
    const result = flow(html);
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
    const result = flow(html);
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
    const result = flow(html);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.TAG);
    const innerTags = (result.elements[0] as TFTag).innerTags;
    expect(innerTags).toHaveLength(2);
    expect(innerTags[0].type).toBe(TFElementType.TAG);
    expect((innerTags[0] as TFTag).name).toBe("span");
    expect((innerTags[0] as TFTag).innerTags).toHaveLength(1);
    expect((innerTags[1] as TFText).text).toBe(" World");
  });
});
