export interface TFElement {
  type: string;
}
export interface TFText extends TFElement {
  text: string;
}
export interface TFTag extends TFElement {
  name: string;
  attributes: { [key: string]: string };
  innerTags: TFElement[];
}
export interface TFComment extends TFElement {
  comment: string;
}
export interface TFDocType extends TFElement {
  docType: string;
}

export const TFElementType = {
  TEXT: "text",
  TAG: "tag",
  COMMENT: "comment",
  DOCTYPE: "doctype",
};
