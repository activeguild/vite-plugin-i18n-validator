import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";
import type { Option } from "./types";

parentPort?.on(
  "message",
  async (msg: {
    json: any;
    cachedBaseFile: string[];
    option: Option;
    file: string;
  }) => {
    const { json, cachedBaseFile, option, file } = msg;

    const errors = compareWithBaseFile(json, cachedBaseFile, option);
    parentPort?.postMessage({ errors, file });
  }
);
