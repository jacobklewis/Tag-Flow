import { TFLogger } from "../src/logger";
import { FlowBuilder } from "../src/flowBuilder";

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
        b.text("Good Day!")
      )
      .tag({ name: "div" }, (b) =>
        b
          .tag({ name: "h2", attributes: { class: "lead" } }, (b) =>
            b.text("Hello")
          )
          .text(" World")
      )
      .comment("my comment");

    const raw = flowBuilder.html;
    expect(raw).toBe(testHTML1);
  });
});
