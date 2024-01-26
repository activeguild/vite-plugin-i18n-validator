import { parentPort } from "worker_threads";
import type { TextlintOption } from "./types";
import { createLinter } from "textlint";

let textlint: ReturnType<typeof createLinter> | null = null;

parentPort?.on(
  "message",
  async (msg: { textlintOption: TextlintOption; id: string }) => {
    if (!textlint) {
      const { createLinter, loadTextlintrc } = await import("textlint");
      const descriptor = await loadTextlintrc(
        msg.textlintOption!.loadTextlintrcOptions
      );

      textlint = createLinter({
        ...msg.textlintOption!.createLinterOptions,
        descriptor,
      });
    }

    const results = await textlint.lintFiles([msg.id]);

    parentPort?.postMessage({ results, id: msg.id });
  }
);
