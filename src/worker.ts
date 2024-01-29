import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";

parentPort?.on(
  "message",
  (msg: {
    json: any;
    cachedBaseFile: string[];
    prohibitedValues?: string[];
    prohibitedKeys?: string[];
    file: string;
  }) => {
    const { json, cachedBaseFile, prohibitedValues, prohibitedKeys, file } =
      msg;

    const errors = compareWithBaseFile(
      json,
      cachedBaseFile,
      prohibitedKeys,
      prohibitedValues
    );
    parentPort?.postMessage({ errors, file });
  }
);
