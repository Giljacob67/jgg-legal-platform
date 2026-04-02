export type DataMode = "mock" | "real";

export function getDataMode(): DataMode {
  return process.env.DATA_MODE === "real" ? "real" : "mock";
}
