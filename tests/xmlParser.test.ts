import { flowRaw, flowFile } from "../src/htmlParser";
import { TFElementType, TFTag, TFDocType, TFHeader } from "../src/elements";
import { exray, sxray, TFLogger, xray } from "../src/logger";

describe("parseXML", () => {
  beforeAll(() => {
    const logger = TFLogger.getInstance();
    logger.disable();
  });
  it("should parse the header", () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>';
    const result = flowRaw(xml);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe(TFElementType.HEADER);
    expect((result.elements[0] as TFHeader).name).toBe("xml");
    expect((result.elements[0] as TFHeader).version).toBe("1.0");
    expect((result.elements[0] as TFHeader).encoding).toBe("UTF-8");
  });
  it("should parse general XML", () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?><packages><package id="AutoMapper" version="2.2.1" targetFramework="net462" /><package id="EntityFramework" version="6.4.0" targetFramework="net462" /></packages>';
    // sxray();
    const result = flowRaw(xml);
    // exray();
    expect(result.elements).toHaveLength(2);
    expect(result.elements[1].type).toBe(TFElementType.TAG);
    expect((result.elements[1] as TFTag).name).toBe("packages");
    expect((result.elements[1] as TFTag).attributes).toEqual({});
    const firstPackage = (result.elements[1] as TFTag).innerTags[0] as TFTag;
    expect(firstPackage.name).toBe("package");
    expect(firstPackage.attributes).toEqual({
      id: "AutoMapper",
      version: "2.2.1",
      targetFramework: "net462",
    });
  });
});
