import { TFElement } from "./elements";

export interface BufferState {
  buffer: string;
  status: BufferStatus[];
  currentElement: TFElement | null;
}

export enum BufferStatus {
  START = "START",
  TAG_OPEN = "TAG_OPEN",
  TAG_CLOSE = "TAG_CLOSE",
  TAG_COMPLETE = "TAG_COMPLETE",
  INNER_HTML = "INNER_HTML",
  COMMENT = "COMMENT",
  DOCTYPE = "DOCTYPE",
  HEADER = "HEADER",
  PLACEHOLDER = "PLACEHOLDER",
  SINGLE_QUOTE = "SINGLE_QUOTE",
  DOUBLE_QUOTE = "DOUBLE_QUOTE",
}
