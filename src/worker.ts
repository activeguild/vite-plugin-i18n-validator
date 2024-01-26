import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";
import type { Option } from "./types";

parentPort?.on(
  "message",
  async (msg: {
    json: any;
    cachedBaseLocale: string[];
    option: Option;
    file: string;
  }) => {
    const { json, cachedBaseLocale, option, file } = msg;

    const errors = compareWithBaseFile(json, cachedBaseLocale, option);
    parentPort?.postMessage({ errors, file });
  }
);
