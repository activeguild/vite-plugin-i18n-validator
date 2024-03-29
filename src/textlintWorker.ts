import { parentPort } from "worker_threads";
import type { Textlint, TextlintOption } from "./types";

const lintFilesFnHash: Map<number, Textlint["lintFiles"]> = new Map();

parentPort?.on(
  "message",
  async (msg: {
    index: number;
    textlintOption: TextlintOption;
    file: string;
  }) => {
    const { textlintOption, file } = msg;

    let lintFilesFn = lintFilesFnHash.get(msg.index);
    if (!lintFilesFnHash.has(msg.index)) {
      const { createLinter, loadTextlintrc } = await import("textlint");
      const descriptor = await loadTextlintrc(
        textlintOption!.loadTextlintrcOptions
      );
      const baseDescriptor = await loadTextlintrc({
        configFilePath: textlintOption.baseConfigFilePath,
      });

      const finalDescriptor = descriptor.concat(baseDescriptor);
      lintFilesFn = createLinter({
        ...textlintOption!.createLinterOptions,
        descriptor: finalDescriptor,
      }).lintFiles;

      lintFilesFnHash.set(msg.index, lintFilesFn);
    }

    const results = await lintFilesFn!([file]);

    parentPort?.postMessage({ results });
  }
);
