import {
  TFComment,
  TFDocType,
  TFElement,
  TFElementType,
  TFHeader,
  TFPlaceholder,
  TFTag,
  TFText,
} from "./elements.js";
import { flow } from "./htmlParser.js";
import { addressNodes } from "./locator.js";
import { writeFileSync } from "fs";

export class FlowGuide {
  public constructor(
    private elements: TFElement[],
    private root: FlowGuide | undefined = undefined
  ) {}

  public get docType(): TFDocType | undefined {
    const docType = this.elements.find(
      (element) => element.type === TFElementType.DOCTYPE
    ) as TFDocType;
    return docType;
  }

  public get tags(): TFTag[] {
    const tags = this.elements.filter(
      (element) => element.type === TFElementType.TAG
    ) as TFTag[];
    return tags;
  }

  public get comments(): TFComment[] {
    const comments = this.elements.filter(
      (element) => element.type === TFElementType.COMMENT
    ) as TFComment[];
    return comments;
  }

  public get html(): string {
    const innerHTML = this.elements
      .map((element) => {
        if (element.type === TFElementType.TAG) {
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
        } else if (element.type === TFElementType.COMMENT) {
          const el = element as TFComment;
          return `<!-- ${el.comment} -->`;
        } else if (element.type === TFElementType.DOCTYPE) {
          const el = element as TFDocType;
          return `<!DOCTYPE ${el.docType}>`;
        } else if (element.type === TFElementType.HEADER) {
          const el = element as TFHeader;
          const v = el.version ? ` version="${el.version}"` : "";
          const e = el.encoding ? ` encoding="${el.encoding}"` : "";
          return `<?${el.name}${v}${e}?>`;
        } else if (element.type === TFElementType.TEXT) {
          const el = element as TFText;
          return el.text;
        } else if (element.type === TFElementType.PLACEHOLDER) {
          const el = element as TFPlaceholder;
          if (el.value !== undefined) {
            return `${el.value}`;
          } else {
            return `{{${el.key}}}`;
          }
        }

        return "";
      })
      .join("");
    return innerHTML;
  }

  public get xml(): string {
    return this.html;
  }

  public save(fileName: string, useRoot: boolean = true): FlowGuide {
    const root = useRoot ? this.root ?? this : this;
    writeFileSync(fileName, root.html);
    return this;
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
          element.type === TFElementType.TAG &&
          (element as TFTag).attributes.id === id
        );
      } else if (query.startsWith(".")) {
        const className = query.slice(1);
        return (
          element.type === TFElementType.TAG &&
          (element as TFTag).attributes.class?.split(" ")?.includes(className)
        );
      } else if (query.startsWith("*")) {
        const text = query.slice(1);
        return (
          element.type === TFElementType.TEXT &&
          (element as TFText).text.toLowerCase().indexOf(text.toLowerCase()) !==
            -1
        );
      } else {
        return (
          element.type === TFElementType.TAG &&
          (element as TFTag).name === query
        );
      }
    });

    // Nested Elements
    const nestedElements = this.elements.flatMap((element, i) => {
      if (element.type === TFElementType.TAG) {
        const innerGuide = new FlowGuide((element as TFTag).innerTags);
        const innerFoundElements = innerGuide.q(query).elements;
        // If inner element is Text, return this element and remove the text element
        const textElements = innerFoundElements.filter(
          (el) => el.type === TFElementType.TEXT
        ) as TFText[];
        if (textElements.length > 0) {
          const textlessElements = innerFoundElements.filter(
            (el) => el.type !== TFElementType.TEXT
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
    return new FlowGuide(uniqueElements, this.root ?? this);
  }

  private relocate() {
    const root = this.root ?? this;
    addressNodes(root.elements);
  }

  public addElement(
    element: TFElement,
    index: number | undefined = undefined
  ): FlowGuide {
    this.elements.forEach((el, i) => {
      if (el.type === TFElementType.TAG) {
        // create copy of element
        const elementCopy = { ...element, address: [] } as TFElement;
        const innerTags = (el as TFTag).innerTags;
        if (index !== undefined) {
          innerTags.splice(index, 0, elementCopy);
        } else {
          innerTags.push(elementCopy);
        }
      }
    });
    this.relocate();
    return this;
  }

  public remove(index: number | undefined = undefined): FlowGuide {
    if (index === undefined) {
      // remove all elements
      const root = this.root ?? this;
      this.elements.forEach((el) => {
        let els = root.elements;
        el.address.forEach((n, i) => {
          if (i === el.address.length - 1) {
            els.splice(n, 1);
            this.relocate();
          } else if (els[n].type === TFElementType.TAG) {
            els = (els[n] as TFTag).innerTags;
          }
        });
      });
      this.elements = [];
    } else {
      // remove elements at index for each selected tag
      this.elements.forEach((el) => {
        if (el.type === TFElementType.TAG) {
          const innerTags = (el as TFTag).innerTags;
          innerTags.splice(index, 1);
        }
      });
    }
    this.relocate();
    return index === undefined ? this.root ?? this : this;
  }

  public removeChildren(): FlowGuide {
    const maxChildCount = Math.max(
      ...this.elements.map((el) => {
        if (el.type === TFElementType.TAG) {
          return (el as TFTag).innerTags.length;
        }
        return 0;
      })
    );
    for (let i = maxChildCount - 1; i >= 0; i--) {
      this.remove(i);
    }
    return this;
  }

  public attr(name: string, value: string): FlowGuide {
    this.elements.forEach((el) => {
      if (el.type === TFElementType.TAG) {
        (el as TFTag).attributes[name] = value;
      }
    });
    return this;
  }

  public delAttr(name: string): FlowGuide {
    this.elements.forEach((el) => {
      if (el.type === TFElementType.TAG) {
        delete (el as TFTag).attributes[name];
      }
    });
    return this;
  }

  public get innerHTML(): string[] {
    return this.elements.map((element) => {
      if (element.type === TFElementType.TAG) {
        const el = element as TFTag;
        const innerGuide = new FlowGuide(el.innerTags);
        return innerGuide.html;
      } else if (element.type === TFElementType.TEXT) {
        const el = element as TFText;
        return el.text;
      }
      return "";
    });
  }
  public set innerHTML(v: string) {
    this.elements.forEach((el) => {
      if (el.type === TFElementType.TAG) {
        (el as TFTag).innerTags = flow(v).elements;
      } else if (el.type === TFElementType.TEXT) {
        (el as TFText).text = v;
      }
    });
    this.relocate();
  }
  public setInnerHTML(v: string): FlowGuide {
    this.innerHTML = v;
    return this;
  }

  public set name(v: string) {
    this.elements.forEach((el) => {
      if (el.type === TFElementType.TAG) {
        (el as TFTag).name = v;
      }
    });
    this.relocate();
  }
  public setName(v: string): FlowGuide {
    this.name = v;
    return this;
  }

  public populatePlaceholder(key: string, value: string): FlowGuide {
    // search whole tree for placeholder with key
    this.elements.forEach((el) => {
      if (el.type === TFElementType.PLACEHOLDER) {
        const placeholder = el as TFPlaceholder;
        if (placeholder.key === key) {
          placeholder.value = value;
        }
      } else if (el.type === TFElementType.TAG) {
        const innerGuide = new FlowGuide(
          (el as TFTag).innerTags,
          this.root ?? this
        );
        innerGuide.populatePlaceholder(key, value);
      }
    });
    return this;
  }
}
