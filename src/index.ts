import { Logger, createFilter } from "vite";
import { Plugin as VitePlugin } from "vite";
import fs, { readFileSync } from "node:fs";
import pc from "picocolors";
import { Worker } from "worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Option, TextlintOption, TextlintResults } from "./types";

export default async function Plugin(option: Option): Promise<VitePlugin> {
  let cachedBaseLocale: string[] | null = null;
  let checkedFiles: string[] = [];
  let worker: Worker | null = null;
  let textlintWorker: Worker | null = null;
  let textlintOption: TextlintOption | null = null;
  let logger: Logger | null = null;

  const filter = createFilter(option.include, option.exclude);

  if (!option.baseLocaleFilePath) {
    throw new Error("baseLocaleFilePath is required.");
  }

  const traverse = (json: Record<string, any>, parentKey: string): string[] => {
    const keys = Object.keys(json);
    let arr: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = json[key];

      if (typeof value === "object") {
        if (parentKey) {
          arr.push(...traverse(value, `${parentKey}.${key}`));
        } else {
          arr.push(...traverse(value, key));
        }
      } else {
        if (parentKey) {
          arr.push(`${parentKey}.${key}`);
        } else {
          arr.push(`${key}`);
        }
      }
    }

    return arr;
  };

  try {
    const fileText = fs.readFileSync(option.baseLocaleFilePath, "utf-8");
    const json = JSON.parse(fileText);

    cachedBaseLocale = traverse(json, "");
  } catch (error) {
    throw new Error("baseLocaleFilePath is invalid.");
  }

  return {
    name: "vite-plugin-i18n-validator",
    enforce: "pre",

    configResolved(config) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      logger = config.logger;
      worker = new Worker(`${__dirname}/worker.js`);
      worker.on("message", ({ errors, file }) => {
        if (errors.length > 0) {
          const relativePath = path.relative(config.root, file);
          for (let i = 0; i < errors.length; i++) {
            logger?.info(`${pc.yellow(`${relativePath}`)}: ${errors[i]}`, {
              timestamp: true,
            });
          }
        }
      });

      if (option.textlint) {
        const textlintConfigFilepath = `${config.root}/.textlintrc`;
        const nodeModulesDir = `${config.root}/node_modules`;

        if (option.textlint === true) {
          textlintOption = {
            createLinterOptions: {},
            loadTextlintrcOptions: {
              configFilePath: textlintConfigFilepath,
              node_modulesDir: nodeModulesDir,
            },
          };
        } else if (!option.textlint.loadTextlintrcOptions.configFilePath) {
          option.textlint.loadTextlintrcOptions.configFilePath =
            textlintConfigFilepath;
          option.textlint.loadTextlintrcOptions.node_modulesDir =
            nodeModulesDir;
          textlintOption = {
            ...option.textlint,
          };
        }

        textlintWorker = new Worker(`${__dirname}/textlintWorker.js`);
        textlintWorker.on("message", (msg: { results: TextlintResults }) => {
          if (msg.results.length === 0) {
            return;
          }
          for (let i = 0; i < msg.results.length; i++) {
            const result = msg.results[i];
            if (result.messages.length === 0) {
              continue;
            }
            const relativePath = path.relative(config.root, result.filePath);
            for (let j = 0; j < result.messages.length; j++) {
              const message = result.messages[j];
              logger?.info(
                `${pc.yellow(`${relativePath}`)}:${message.loc.start.line}:${message.loc.start.column}: ${message.message}`,
                { timestamp: true }
              );
            }
          }
        });
        return;
      }
    },
    async handleHotUpdate(context) {
      if (!cachedBaseLocale) {
        return;
      }

      if (!filter(context.file)) {
        return;
      }

      const text = await context.read();

      try {
        const json = JSON.parse(text);

        if (context.file === option.baseLocaleFilePath) {
          cachedBaseLocale = traverse(json, "");
        }

        if (!cachedBaseLocale) {
          return;
        }

        worker?.postMessage({
          json,
          cachedBaseLocale,
          option,
          file: context.file,
        });
        textlintWorker?.postMessage({
          textlintOption,
          file: context.file,
        });
      } catch (error) {
        throw error;
      }
    },
    buildStart() {
      checkedFiles = [];
    },
    buildEnd() {
      worker?.terminate();
      textlintWorker?.terminate();
    },
    transform(_code, id) {
      if (!cachedBaseLocale) {
        return;
      }

      if (checkedFiles.includes(id)) {
        return;
      }

      if (!filter(id)) {
        return;
      }

      try {
        const fileText = readFileSync(id, "utf-8");
        const json = JSON.parse(fileText);
        worker?.postMessage({ json, cachedBaseLocale, option, file: id });
        textlintWorker?.postMessage({
          textlintOption,
          file: id,
        });

        checkedFiles.push(id);
      } catch (error) {
        throw error;
      }
    },
  };
}
