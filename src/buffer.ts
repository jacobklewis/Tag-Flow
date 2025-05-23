import { TFElement } from "./elements";

export interface BufferState {
  buffer: string;
  status: BufferStatus;
  currentElement: TFElement | null;
}

export enum BufferStatus {
  START,
  TAG_OPEN,
  TAG_OPEN_SINGLE_QUOTE,
  TAG_OPEN_DOUBLE_QUOTE,
  TAG_CLOSE,
  TAG_COMPLETE,
  INNER_HTML,
  COMMENT,
  DOCTYPE,
}
