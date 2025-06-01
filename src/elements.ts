export interface TFElement {
  type: string;
  address: number[]; // The address of the element in the HTML string given by a list of indexes: [0,1,5,0,...]
}
export interface TFText extends TFElement {
  text: string;
}
export interface TFTag extends TFElement {
  name: string;
  attributes: { [key: string]: string };
  innerTags: TFElement[];
  isVoidTag: boolean;
}
export interface TFComment extends TFElement {
  comment: string;
}
export interface TFDocType extends TFElement {
  docType: string;
}
export interface TFPlaceholder extends TFElement {
  key: string;
  value: string | undefined;
}

export const TFElementType = {
  TEXT: "text",
  TAG: "tag",
  COMMENT: "comment",
  DOCTYPE: "doctype",
  PLACEHOLDER: "placeholder",
};

export const VoidTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "meta",
  "link",
  "param",
  "source",
  "track",
  "wbr",
];

export const ExtensionTags = ["style", "script"];
