import { TFComment, TFDocType, TFElement, TFTag, TFText } from "./elements";
import { ParsingResponse } from "./htmlParser";

export class FlowGuide {
  public constructor(private elements: TFElement[]) {}

  public get docType(): TFDocType | undefined {
    const docType = this.elements.find(
      (element) => element.type === "doctype"
    ) as TFDocType;
    return docType;
  }

  public get tags(): TFTag[] {
    const tags = this.elements.filter(
      (element) => element.type === "tag"
    ) as TFTag[];
    return tags;
  }

  public get comments(): TFComment[] {
    const comments = this.elements.filter(
      (element) => element.type === "comment"
    ) as TFComment[];
    return comments;
  }

  public get html(): string {
    const innerHTML = this.elements
      .map((element) => {
        if (element.type === "tag") {
          const el = element as TFTag;
          let attrStr = Object.entries(el.attributes)
            .map(([key, value]) => {
              if (value === "") {
                return `${key}`;
              } else {
                return `${key}="${value}"`;
              }
            })
            .join(" ");
          if (attrStr !== "") {
            attrStr = " " + attrStr;
          }
          const innerGuide = new FlowGuide(el.innerTags);
          if (el.isVoidTag) {
            return `<${el.name}${attrStr}/>`;
          }
          const innerHTML = innerGuide.html;
          return `<${el.name}${attrStr}>${innerHTML}</${el.name}>`;
        } else if (element.type === "comment") {
          const el = element as TFComment;
          return `<!-- ${el.comment} -->`;
        } else if (element.type === "doctype") {
          const el = element as TFDocType;
          return `<!DOCTYPE ${el.docType}>`;
        } else if (element.type === "text") {
          const el = element as TFText;
          return el.text;
        }
        return "";
      })
      .join("");
    return innerHTML;
  }

  /**
   * Deep Query the elements by name, class, id, or text
   * @param query a string to query the elements:
   * - "" to query by name: "div"
   * - "." to query by class: ".className"
   * - "#" to query by id: "#idName"
   * - "*" to query by text: "*Hello World"
   * @returns
   */
  public q(query: string): FlowGuide {
    const elements = this.elements.filter((element) => {
      if (query.startsWith("#")) {
        const id = query.slice(1);
        return (
          element.type === "tag" && (element as TFTag).attributes.id === id
        );
      } else if (query.startsWith(".")) {
        const className = query.slice(1);
        return (
          element.type === "tag" &&
          (element as TFTag).attributes.class?.split(" ")?.includes(className)
        );
      } else if (query.startsWith("*")) {
        const text = query.slice(1);
        return (
          element.type === "text" &&
          (element as TFText).text.toLowerCase().indexOf(text.toLowerCase()) !==
            -1
        );
      } else {
        return element.type === "tag" && (element as TFTag).name === query;
      }
    });

    // Nested Elements
    const nestedElements = this.elements.flatMap((element) => {
      if (element.type === "tag") {
        const innerGuide = new FlowGuide((element as TFTag).innerTags);
        const innerFoundElements = innerGuide.q(query).elements;
        // If inner element is Text, return this element and remove the text element
        const textElements = innerFoundElements.filter(
          (el) => el.type === "text"
        ) as TFText[];
        if (textElements.length > 0) {
          const textlessElements = innerFoundElements.filter(
            (el) => el.type !== "text"
          ) as TFElement[];
          return [element, ...textlessElements];
        }
        return innerFoundElements;
      }
      return [];
    });
    // Combine the elements and nested elements
    elements.push(...nestedElements);
    // Remove duplicates
    const uniqueElements = elements.filter(
      (element, index, self) => index === self.findIndex((el) => el === element)
    );
    return new FlowGuide(uniqueElements);
  }
}
