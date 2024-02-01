import type { CreateLinterOptions, LoadTextlintrcOptions } from "textlint";
import { createLinter } from "textlint";

export type Option = {
  baseLocaleFilePath: string;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  prohibitedKeys?: string[];
  prohibitedValues?: string[];
  ignoreKeys?: RegExp | RegExp[];
  textlint?: true | TextlintOption;
};

export type FinalOption = Option & {
  cachedBaseFile?: string[];
  filter?: (id: unknown) => boolean;
  textlintOption?: TextlintOption;
};

export type TextlintOption = {
  baseConfigFilePath: string;
  createLinterOptions: Omit<CreateLinterOptions, "descriptor">;
  loadTextlintrcOptions: LoadTextlintrcOptions;
};

export type CacheValue = [[string], [Cache]];
export type Cache = [[string] | [CacheValue]];
type PromiseType<T extends Promise<any>> =
  T extends Promise<infer P> ? P : never;
export type Textlint = ReturnType<typeof createLinter>;
export type TextlintResults = PromiseType<ReturnType<Textlint["lintFiles"]>>;
