import { Logger, createFilter } from "vite";
import { Plugin as VitePlugin } from "vite";
import fs, { readFileSync } from "node:fs";
import pc from "picocolors";
import { Worker } from "worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Option, FinalOption, TextlintResults } from "./types";

export default async function Plugin(
  options: Option | Option[]
): Promise<VitePlugin> {
  let checkedFiles: string[] = [];

  let worker: Worker | null = null;
  let textlintWorker: Worker | null = null;
  let logger: Logger | null = null;
  const finalOptions: FinalOption[] = Array.isArray(options)
    ? options
    : [options];

  const traverse = (
    json: Record<string, any>,
    parentKey?: string
  ): string[] => {
    const keys = Object.keys(json);
    const arr: string[] = [];

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

  for (let i = 0; i < finalOptions.length; i++) {
    const finalOption = finalOptions[i];
    finalOption.filter = createFilter(finalOption.include, finalOption.exclude);

    if (!finalOption.baseLocaleFilePath) {
      throw new Error("baseLocaleFilePath is required.");
    }

    try {
      const fileText = fs.readFileSync(finalOption.baseLocaleFilePath, "utf-8");
      const json = JSON.parse(fileText);

      finalOption.cachedBaseFile = traverse(json, "");
    } catch (error) {
      console.log("error :>> ", error);
      throw new Error("baseLocaleFilePath is invalid.");
    }
  }

  return {
    name: "vite-plugin-i18n-validator",
    enforce: "pre",

    configResolved(config) {
      for (let i = 0; i < finalOptions.length; i++) {
        const finalOption = finalOptions[i];
        finalOption.baseLocaleFilePath = path.isAbsolute(
          finalOption.baseLocaleFilePath
        )
          ? finalOption.baseLocaleFilePath
          : path.resolve(config.root, finalOption.baseLocaleFilePath);
      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      logger = config.logger;
      worker = new Worker(`${path.resolve(__dirname, "worker.js")}`);
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

      for (let i = 0; i < finalOptions.length; i++) {
        const finalOption = finalOptions[i];
        if (finalOption.textlint) {
          const textlintConfigFilepath = path.resolve(
            config.root,
            ".textlintrc"
          );
          const nodeModulesDir = path.resolve(config.root, "node_modules");

          if (finalOption.textlint === true) {
            finalOption.textlintOption = {
              createLinterOptions: {},
              loadTextlintrcOptions: {
                configFilePath: textlintConfigFilepath,
                node_modulesDir: nodeModulesDir,
              },
            };
          } else if (
            !finalOption.textlint.loadTextlintrcOptions.configFilePath
          ) {
            finalOption.textlint.loadTextlintrcOptions.configFilePath =
              textlintConfigFilepath;
            finalOption.textlint.loadTextlintrcOptions.node_modulesDir =
              nodeModulesDir;
            finalOption.textlintOption = {
              ...finalOption.textlint,
            };
          }
        }

        textlintWorker = new Worker(
          `${path.resolve(__dirname, "textlintWorker.js")}`
        );
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
      const text = await context.read();
      const json = JSON.parse(text);

      for (let i = 0; i < finalOptions.length; i++) {
        const finalOption = finalOptions[i];
        if (!finalOption.cachedBaseFile) {
          return;
        }

        if (!finalOption.filter!(context.file)) {
          continue;
        }

        if (context.file === finalOption.baseLocaleFilePath) {
          finalOption.cachedBaseFile = traverse(json);
        }

        try {
          worker?.postMessage({
            json,
            cachedBaseFile: finalOption.cachedBaseFile,
            prohibitedValues: finalOption.prohibitedValues,
            prohibitedKey: finalOption.prohibitedKeys,
            file: context.file,
          });
          textlintWorker?.postMessage({
            textlintOption: finalOption.textlintOption,
            file: context.file,
          });
        } catch (error) {
          console.log("error :>> ", error);
        }
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
      if (checkedFiles.includes(id)) {
        return;
      }

      for (let i = 0; i < finalOptions.length; i++) {
        const finalOption = finalOptions[i];
        if (!finalOption.cachedBaseFile) {
          continue;
        }
        if (!finalOption.filter!(id)) {
          continue;
        }

        const json = JSON.parse(_code);
        worker?.postMessage({
          json,
          cachedBaseFile: finalOption.cachedBaseFile,
          prohibitedValues: finalOption.prohibitedValues,
          prohibitedKey: finalOption.prohibitedKeys,
          file: id,
        });
        textlintWorker?.postMessage({
          textlintOption: finalOption.textlintOption,
          file: id,
        });
      }
      checkedFiles.push(id);
    },
  };
}
