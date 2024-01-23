import { parentPort } from "worker_threads";
import { compareWithBaseFile } from "./checker";
import { Option } from "./index";

parentPort?.on(
  "message",
  async (msg: {
    json: any;
    cachedBaseLocale: string[];
    option: Option;
    id: string;
  }) => {
    const errors = compareWithBaseFile(
      msg.json,
      msg.cachedBaseLocale,
      msg.option
    );
    parentPort?.postMessage({ errors, id: msg.id });
  }
);
