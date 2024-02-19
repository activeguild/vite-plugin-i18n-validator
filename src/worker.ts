import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";
import { createFilter } from "vite";

parentPort?.on(
  "message",
  (msg: {
    json: any;
    cachedBaseFile: string[];
    prohibitedValues?: string[];
    prohibitedKeys?: string[];
    ignoreKeys?: RegExp | RegExp[];
    file: string;
  }) => {
    const {
      json,
      cachedBaseFile,
      prohibitedValues,
      prohibitedKeys,
      file,
      ignoreKeys,
    } = msg;
    const ignoreKeysFilter = createFilter(ignoreKeys);

    const errors = compareWithBaseFile(
      json,
      cachedBaseFile,
      prohibitedKeys,
      prohibitedValues,
      ignoreKeysFilter,
      ignoreKeys
    );
    parentPort?.postMessage({ errors, file });
  }
);
