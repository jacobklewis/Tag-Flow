import { TFTag, TFText } from "../src/elements";
import { flow, flowFile } from "../src/htmlParser";

describe("flow guide", () => {
  const testHTML1 =
    '<!DOCTYPE html><h1 id="greeting">Good Day!</h1><div><h2 class="lead">Hello</h2> World</div><!-- my comment -->';
  it("should get all tags", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.tags;
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe("h1");
    expect(tags[1].name).toBe("div");
  });
  it("should get all comments", () => {
    const flowGuide = flow(testHTML1);
    const comments = flowGuide.comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].comment).toBe("my comment");
  });
  it("should get the doctype", () => {
    const flowGuide = flow(testHTML1);
    const docType = flowGuide.docType;
    expect(docType).toBeDefined();
    expect(docType?.docType).toBe("html");
  });
  it("should get the innerHTML", () => {
    const flowGuide = flow(testHTML1);
    const innerHTML = flowGuide.html;
    expect(innerHTML).toBe(testHTML1);
  });
  it("should parse a text string", () => {
    const flowGuide = flow("Hello World");
    expect(flowGuide.tags).toHaveLength(0);
    expect(flowGuide.comments).toHaveLength(0);
    expect(flowGuide.docType).toBeUndefined();
    expect(flowGuide.html).toBe("Hello World");
  });
  it("should parse a text string before tag", () => {
    const flowGuide = flow("Hello <h3>World</h3>");
    expect(flowGuide.tags).toHaveLength(1);
    expect(flowGuide.comments).toHaveLength(0);
    expect(flowGuide.docType).toBeUndefined();
    expect(flowGuide.html).toBe("Hello <h3>World</h3>");
  });
  it("should parse a text string after tag", () => {
    const flowGuide = flow("<h3>Hello</h3> World");
    expect(flowGuide.tags).toHaveLength(1);
    expect(flowGuide.comments).toHaveLength(0);
    expect(flowGuide.docType).toBeUndefined();
    expect(flowGuide.html).toBe("<h3>Hello</h3> World");
  });
  it("should query by name", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q("h1").tags;
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("h1");
    expect(tags[0].innerTags).toHaveLength(1);
  });
  it("should query by name nested q(a)=>q(b)", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q("div");
    const tags2 = tags.q("h2").tags;
    expect(tags2).toHaveLength(1);
    expect(tags2[0].name).toBe("h2");
  });
  it("should query by name nested q(b)", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q("h2").tags;
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("h2");
  });
  it("should query by class", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q(".lead").tags;
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("h2");
  });
  it("should query by id", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q("#greeting").tags;
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("h1");
  });
  it("should query by text", () => {
    const flowGuide = flow(testHTML1);
    const tags = flowGuide.q("*Hello").tags;
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe("h2");
  });
  it("should search html file for text", () => {
    const flowGuide = flowFile("tests/testfiles/a.html");
    const results = flowGuide.q("*2025");
    const tags = results.tags;
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe("h1");
    expect(tags[1].name).toBe("footer");
    expect(results.html).toBe(
      '<h1>The Year of 2025</h1><footer class="center-text">&copy; 2025 Jacob K Lewis</footer>'
    );
  });
  it("should add a text element to 2 tags after query", () => {
    const flowGuide = flow("<div></div><div></div>");
    const res = flowGuide.q("div");
    expect(res.tags).toHaveLength(2);
    res.addElement({
      type: "text",
      text: "Hello World",
    } as TFText);
    const tags = res.tags;
    expect(tags[0].innerTags).toHaveLength(1);
    expect(tags[1].innerTags).toHaveLength(1);
    expect((tags[0].innerTags[0] as TFText).text).toBe("Hello World");
    expect((tags[1].innerTags[0] as TFText).text).toBe("Hello World");
    expect(tags[0].innerTags[0].address).toEqual([0, 0]);
    expect(tags[1].innerTags[0].address).toEqual([1, 0]);
  });
  it("should remove 2 text elements after query", () => {
    const flowGuide = flow("<div>Hello</div><div>World</div>");
    const res = flowGuide.q("div");
    expect(res.tags).toHaveLength(2);
    expect(res.tags[0].innerTags).toHaveLength(1);
    expect(res.tags[1].innerTags).toHaveLength(1);
    expect((res.tags[0].innerTags[0] as TFText).text).toBe("Hello");
    expect((res.tags[1].innerTags[0] as TFText).text).toBe("World");
    res.remove(0);
    expect(res.tags).toHaveLength(2);
    expect(res.tags[0].innerTags).toHaveLength(0);
    expect(res.tags[1].innerTags).toHaveLength(0);
  });
  it("should remove selected divs from query", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc">World</div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    expect(res.tags[0].innerTags).toHaveLength(1);
    expect(res.tags[1].innerTags).toHaveLength(1);
    expect((res.tags[0].innerTags[0] as TFText).text).toBe("Hello");
    expect((res.tags[1].innerTags[0] as TFText).text).toBe("World");
    res.remove();
    expect(res.tags).toHaveLength(0);
    expect(flowGuide.tags).toHaveLength(1);
    expect(flowGuide.tags[0].innerTags).toHaveLength(0);
    expect(flowGuide.html).toBe("<div></div>");
  });
  it("should remove selected divs' inner tags from query", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc"><b>World</b> again</div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    expect(res.tags[0].innerTags).toHaveLength(1);
    expect(res.tags[1].innerTags).toHaveLength(2);
    expect((res.tags[0].innerTags[0] as TFText).text).toBe("Hello");
    expect((res.tags[1].innerTags[0] as TFTag).name).toBe("b");
    expect((res.tags[1].innerTags[1] as TFText).text).toBe(" again");
    expect((res.tags[1].innerTags[0] as TFTag).innerTags).toHaveLength(1);
    expect(
      ((res.tags[1].innerTags[0] as TFTag).innerTags[0] as TFText).text
    ).toBe("World");
    res.removeChildren();
    expect(res.tags).toHaveLength(2);
    expect(res.tags[0].innerTags).toHaveLength(0);
    expect(res.tags[1].innerTags).toHaveLength(0);
    expect(flowGuide.html).toBe(
      '<div><div class="abc"></div><div class="abc"></div></div>'
    );
  });
  it("should set attribute of selected tags", () => {
    const flowGuide = flow(
      '<div><a class="abc">Hello</a><a class="abc"><b>World</b></a></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    res.attr("href", "https://jacoblewis.me");
    expect(flowGuide.html).toBe(
      '<div><a class="abc" href="https://jacoblewis.me">Hello</a><a class="abc" href="https://jacoblewis.me"><b>World</b></a></div>'
    );
  });
  it("should delete attribute of selected tags", () => {
    const flowGuide = flow(
      '<div><a class="abc" href="https://jacoblewis.me">Hello</a><a class="abc"><b>World</b></a></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    res.delAttr("href");
    expect(flowGuide.html).toBe(
      '<div><a class="abc">Hello</a><a class="abc"><b>World</b></a></div>'
    );
    expect((res.tags[0] as TFTag).attributes.href).toBeUndefined();
    expect((res.tags[1] as TFTag).attributes.href).toBeUndefined();
  });
  it("should get innerHTML of selected tags", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc"><b>World</b></div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    expect(res.innerHTML).toHaveLength(2);
    expect(res.innerHTML[0]).toBe("Hello");
    expect(res.innerHTML[1]).toBe("<b>World</b>");
  });
  it("should set innerHTML of selected tags with string", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc"><b>World</b></div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    res.innerHTML = "space";
    expect(flowGuide.html).toBe(
      '<div><div class="abc">space</div><div class="abc">space</div></div>'
    );
  });
  it("should set innerHTML of selected tags with tags", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc"><b>World</b></div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    res.innerHTML = "<h1>space</h1>";
    expect(flowGuide.html).toBe(
      '<div><div class="abc"><h1>space</h1></div><div class="abc"><h1>space</h1></div></div>'
    );
    expect(res.tags[0].innerTags).toHaveLength(1);
    expect(res.tags[1].innerTags).toHaveLength(1);
    expect(
      ((res.tags[0].innerTags[0] as TFTag).innerTags[0] as TFText).text
    ).toBe("space");
    expect(
      ((res.tags[1].innerTags[0] as TFTag).innerTags[0] as TFText).text
    ).toBe("space");
  });
  it("should set name of selected tags", () => {
    const flowGuide = flow(
      '<div><div class="abc">Hello</div><div class="abc"><b>World</b></div></div>'
    );
    const res = flowGuide.q(".abc");
    expect(res.tags).toHaveLength(2);
    res.name = "h1";
    expect(flowGuide.html).toBe(
      '<div><h1 class="abc">Hello</h1><h1 class="abc"><b>World</b></h1></div>'
    );
  });
});
