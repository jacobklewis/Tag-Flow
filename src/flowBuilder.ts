import {
  TFComment,
  TFDocType,
  TFElement,
  TFElementType,
  TFPlaceholder,
  TFTag,
  TFText,
} from "./elements.js";
import { FlowGuide } from "./flowGuide.js";
import { flowRaw } from "./htmlParser.js";
export class FlowBuilder {
  private elements: TFElement[] = [];

  public tag(
    tag: Partial<TFTag>,
    block: ((builder: FlowBuilder) => void) | undefined = undefined,
  ): FlowBuilder {
    if (!tag.name) {
      throw new Error("Tag name is required");
    }
    const element: TFTag = {
      type: TFElementType.TAG,
      name: tag.name,
      attributes: tag.attributes ?? {},
      isVoidTag: tag.isVoidTag ?? false,
      innerTags: tag.innerTags ?? [],
      address: [],
    };
    this.elements.push(element);
    const innerBuilder = new FlowBuilder();
    block?.(innerBuilder);
    if (innerBuilder.elements.length > 0) {
      element.innerTags.push(...innerBuilder.elements);
    }
    return this;
  }

  public text(text: string): FlowBuilder {
    const element: TFText = {
      type: TFElementType.TEXT,
      text,
      address: [],
    };
    this.elements.push(element);
    return this;
  }

  public comment(comment: string): FlowBuilder {
    const element: TFComment = {
      type: TFElementType.COMMENT,
      address: [],
      comment,
    };
    this.elements.push(element);
    return this;
  }

  public docType(docType: string): FlowBuilder {
    const element: TFDocType = {
      type: TFElementType.DOCTYPE,
      address: [],
      docType,
    };
    this.elements.push(element);
    return this;
  }

  public placeholder(key: string, value?: string): FlowBuilder {
    const element: TFPlaceholder = {
      type: TFElementType.PLACEHOLDER,
      address: [],
      key,
      value,
    };
    this.elements.push(element);
    return this;
  }

  public raw(html: string): FlowBuilder {
    const parsed = flowRaw(html);
    this.elements.push(...parsed.elements);
    return this;
  }

  public build(): FlowGuide {
    return new FlowGuide(this.elements);
  }

  public get html(): string {
    const guide = new FlowGuide(this.elements);
    return guide.html;
  }

  public get xml(): string {
    const guide = new FlowGuide(this.elements);
    return guide.xml;
  }
}
