import { parentPort } from "worker_threads";
import { Option } from "./index";
import { createLinter } from "textlint";

let textlint: ReturnType<typeof createLinter> | null = null;

parentPort?.on(
  "message",
  async (msg: { textlintOptions: Option["textlint"]; id: string }) => {
    if (!textlint) {
      const { createLinter, loadTextlintrc } = await import("textlint");
      const descriptor = await loadTextlintrc(
        msg.textlintOptions!.loadTextlintrcOptions
      );
      textlint = createLinter({
        ...msg.textlintOptions!.createLinterOptions,
        descriptor,
      });
    }

    const test = await textlint.lintFiles([msg.id]);
    console.log("test :>> ", test);

    parentPort?.postMessage({ id: msg.id });
  }
);
