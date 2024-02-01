import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";

parentPort?.on(
  "message",
  (msg: {
    json: any;
    cachedBaseFile: string[];
    prohibitedValues?: string[];
    prohibitedKeys?: string[];
    ignoreKeysFilter?: (id: unknown) => boolean;
    file: string;
  }) => {
    const {
      json,
      cachedBaseFile,
      prohibitedValues,
      prohibitedKeys,
      file,
      ignoreKeysFilter,
    } = msg;

    const errors = compareWithBaseFile(
      json,
      cachedBaseFile,
      prohibitedKeys,
      prohibitedValues,
      ignoreKeysFilter
    );
    parentPort?.postMessage({ errors, file });
  }
);
