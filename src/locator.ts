import { TFElement, TFTag } from "./elements.js";

export const addressNodes = (elements: TFElement[], address: number[] = []) => {
  elements.forEach((element, i) => {
    if (element.type === "tag") {
      const el = element as TFTag;
      const newAddress = [...address, i];
      addressNodes(el.innerTags, newAddress);
    }
    element.address = [...address, i];
  });
};
