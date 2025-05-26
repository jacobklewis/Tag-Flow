import { TFElement, TFTag } from "./elements.js";
import { TFLogger } from "./logger.js";

const tfl = TFLogger.getInstance();
export const addressNodes = (elements: TFElement[], address: number[] = []) => {
  tfl.log(`Addressing nodes at address: ${address.join(", ")}`);
  elements.forEach((element, i) => {
    if (element.type === "tag") {
      const el = element as TFTag;
      const newAddress = [...address, i];
      addressNodes(el.innerTags, newAddress);
    } else {
      tfl.log(
        `Addressing ${element.type} node at address: ${[...address, i].join(
          ", "
        )}`
      );
    }
    element.address = [...address, i];
  });
};
