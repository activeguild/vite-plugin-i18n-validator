import type { CreateLinterOptions, LoadTextlintrcOptions } from "textlint";
import { createLinter } from "textlint";

export type Option = {
  baseLocaleFilePath: string;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  prohibitedKeys?: string[];
  prohibitedValues?: string[];
  textlint?: true | TextlintOption;
};

export type TextlintOption = {
  createLinterOptions: Omit<CreateLinterOptions, "descriptor">;
  loadTextlintrcOptions: LoadTextlintrcOptions;
};

export type CacheValue = [[string], [Cache]];
export type Cache = [[string] | [CacheValue]];
type PromiseType<T extends Promise<any>> =
  T extends Promise<infer P> ? P : never;
export type TextlintResults = PromiseType<
  ReturnType<ReturnType<typeof createLinter>["lintFiles"]>
>;
