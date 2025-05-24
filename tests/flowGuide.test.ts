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
});
