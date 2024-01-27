import { parentPort } from "worker_threads";
import type { Textlint, TextlintOption } from "./types";

let lintFilesFn: Textlint["lintFiles"] | null = null;

parentPort?.on(
  "message",
  async (msg: { textlintOption: TextlintOption; file: string }) => {
    const { textlintOption, file } = msg;

    if (!lintFilesFn) {
      const { createLinter, loadTextlintrc } = await import("textlint");
      const descriptor = await loadTextlintrc(
        textlintOption!.loadTextlintrcOptions
      );

      lintFilesFn = createLinter({
        ...textlintOption!.createLinterOptions,
        descriptor,
      }).lintFiles;
    }

    const results = await lintFilesFn([file]);

    console.log("results :>> ", results);
    parentPort?.postMessage({ results });
  }
);
