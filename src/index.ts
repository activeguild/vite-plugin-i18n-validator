import { createFilter } from "vite";
import { Plugin as VitePlugin } from "vite";
import fs, { readFileSync } from "node:fs";
import pc from "picocolors";
import { Worker } from "worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Option = {
  baseLocaleFilePath: string;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  prohibitedKeys?: string[];
  prohibitedValues?: string[];
};

type CacheValue = [[string], [Cache]];
type Cache = [[string] | [CacheValue]];

export default function Plugin(option: Option): VitePlugin {
  let cachedBaseLocale: string[] | null = null;
  let checkedFiles: string[] = [];
  let worker: Worker | null = null;
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
          id: context.file,
        });
      } catch (error) {
        console.error("error :>> ", error);
      }
    },
    configResolved() {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      worker = new Worker(`${__dirname}/worker.js`);

      worker.on("message", ({ errors, id }) => {
        if (errors.length > 0) {
          console.log(pc.yellow(`\n${id}`));
          for (let i = 0; i < errors.length; i++) {
            console.error(`- ${errors[i]}`);
          }
        }
      });
    },
    buildStart() {
      checkedFiles = [];
    },
    buildEnd() {
      if (worker) {
        worker.terminate();
      }
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
        worker?.postMessage({ json, cachedBaseLocale, option, id });
        checkedFiles.push(id);
      } catch (error) {
        console.error("error :>> ", error);
      }
    },
  };
}
