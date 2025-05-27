import { flowRaw, flowFile } from "../src/htmlParser";
import { TFLogger } from "../src/logger.js";
import { readFileSync, rm, rmSync } from "fs";

describe("logger", () => {
  it("should enable and disable logger", () => {
    const logger = TFLogger.getInstance();
    logger.enable();
    logger.setMode("memory");
    logger.log("Test log message");
    expect(logger.getLogs()).toContain("Test log message");
    logger.disable();
    logger.log("This should not be logged");
    expect(logger.getLogs()).toHaveLength(0);
    logger.enable();
    logger.log("Logging after re-enabling");
    expect(logger.getLogs()).toHaveLength(2);
    expect(logger.getLogs()).toContain("Test log message");
    expect(logger.getLogs()).toContain("Logging after re-enabling");
    // Clean up the file after test
    logger.clearLogs();
  });
  it("should log messages as error", () => {
    const logger = TFLogger.getInstance();
    logger.enable();
    logger.setMode("memory");
    logger.log("This is a normal log message");
    logger.log("This is an error message", true);
    expect(logger.getLogs()).toContain("This is a normal log message");
    expect(logger.getLogs()).toContain("ERROR: This is an error message");
    // Clean up the file after test
    logger.clearLogs();
  });
  it("should log to console", () => {
    const logger = TFLogger.getInstance();
    logger.enable();
    logger.setMode("console");
    console.log = jest.fn();
    console.error = jest.fn();

    logger.log("Console log message");
    expect(console.log).toHaveBeenCalledWith("Console log message");

    logger.log("Console error message", true);
    expect(console.error).toHaveBeenCalledWith("Console error message");
    // Clean up the file after test
    logger.clearLogs();
  });
  it("should log to file", () => {
    const logger = TFLogger.getInstance();
    logger.enable();
    logger.setMode("file");
    logger.log("File log message");
    logger.log("File error message", true);
    // Verify that the logs are stored in memory
    expect(logger.getLogs()).toContain("File log message");
    expect(logger.getLogs()).toContain("ERROR: File error message");
    // Check if the logs are written to the file
    const logs = readFileSync("tagflow.log", "utf8");
    expect(logs).toEqual("File log message\nERROR: File error message");
    // Clean up the file after test
    logger.clearLogs();
    rmSync("tagflow.log", { force: true, recursive: true });
  });
});
