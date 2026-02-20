import { FlowBuilder } from "../src/flowBuilder";
import { TFLogger } from "../src/logger";

describe("flow builder", () => {
  beforeAll(() => {
    const logger = TFLogger.getInstance();
    logger.disable();
  });
  const testHTML1 =
    '<!DOCTYPE html><h1 id="greeting">Good Day!</h1><div><h2 class="lead">Hello</h2> World</div><!-- my comment -->';
  it("should build the correct HTML structure", () => {
    const flowBuilder = new FlowBuilder();
    flowBuilder
      .docType("html")
      .tag({ name: "h1", attributes: { id: "greeting" } }, (b) =>
        b.text("Good Day!"),
      )
      .tag({ name: "div" }, (b) =>
        b
          .tag({ name: "h2", attributes: { class: "lead" } }, (b) =>
            b.text("Hello"),
          )
          .text(" World"),
      )
      .comment("my comment");

    const raw = flowBuilder.html;
    expect(raw).toBe(testHTML1);
  });

  it("should add raw HTML correctly", () => {
    const flowBuilder = new FlowBuilder();
    flowBuilder
      .tag({ name: "div" }, (b) => b.raw("<span>Raw HTML</span>"))
      .raw("<p>More raw HTML</p>");

    const raw = flowBuilder.html;
    expect(raw).toBe("<div><span>Raw HTML</span></div><p>More raw HTML</p>");
  });

  it("should add partial raw HTML correctly", () => {
    const flowBuilder = new FlowBuilder();
    flowBuilder
      .tag({ name: "div" }, (b) => b.raw("<span>Raw HTML</span>"))
      .raw("My name is One <p>More raw HTML</p>");

    const raw = flowBuilder.html;
    expect(raw).toBe(
      "<div><span>Raw HTML</span></div>My name is One <p>More raw HTML</p>",
    );
  });
});
