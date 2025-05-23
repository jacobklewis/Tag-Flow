export { flow, flowFile, ParsingResponse } from "./htmlParser.js";
export {
  TFElement,
  TFElementType,
  TFTag,
  TFText,
  TFComment,
  TFDocType,
} from "./elements.js";
export { FlowGuide } from "./flowGuide.js";

import { flow } from "./htmlParser.js";

const htmlContent = "<div><h1>Hello</h1> World!</div>";
const parsed = flow(htmlContent);
console.log(parsed.q("h1").html);
