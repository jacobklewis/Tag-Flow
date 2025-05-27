import { writeFileSync } from "fs";
export class TFLogger {
  private static instance: TFLogger;
  private logs: string[] = [];
  private mode: "file" | "console" | "memory" = "memory";
  private isEnabled: boolean = false;
  private breakpointKey: string = "~";

  private constructor() {}

  public static getInstance(): TFLogger {
    if (!TFLogger.instance) {
      TFLogger.instance = new TFLogger();
    }
    return TFLogger.instance;
  }

  public log(message: string, isError: boolean = false): void {
    if (!this.isEnabled) return;
    this.logs.push(`${isError ? "ERROR: " : ""}${message}`);
    if (this.mode === "file") {
      this.writeToFile();
    } else if (this.mode === "console") {
      if (isError) {
        console.error(message);
      } else {
        console.log(message);
      }
    }
  }

  public getLogs(): string[] {
    if (!this.isEnabled) return [] as string[];
    return this.logs;
  }

  public clearLogs(): void {
    if (!this.isEnabled) return;
    this.logs = [];
  }

  public setMode(mode: "file" | "console" | "memory"): void {
    this.mode = mode;
  }

  public enable(): void {
    this.isEnabled = true;
  }
  public disable(): void {
    this.isEnabled = false;
  }

  public setBreakpointKey(key: string): void {
    this.breakpointKey = key;
  }

  public getBreakpointKey(): string {
    return this.breakpointKey;
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public writeToFile(fileName: string = "tagflow.log"): void {
    writeFileSync(fileName, this.logs.join("\n"), "utf8");
  }
}

export const xray = (block: () => void, filename: string = "tagflow.log") => {
  const logger = TFLogger.getInstance();
  logger.setMode("file");
  logger.enable();
  block();
  logger.writeToFile(filename);
  logger.clearLogs();
  logger.disable();
};
