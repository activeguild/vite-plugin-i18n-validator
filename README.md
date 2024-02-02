<p align="left">
  <a href="https://github.com/actions/setup-node"><img alt="GitHub Actions status" src="https://github.com/activeguild/vite-plugin-i18n-validator/workflows/release/badge.svg" style="max-width:100%;"></a>
</p>

# vite-plugin-i18n-validator

A Vite plugin validates Json files with internationalization support in worker thread.

- Compare with the base language file to verify the presence of key and value.
- _Optional:_ Use [textlint](https://github.com/textlint/textlint) to proofread values.

## Motivation

- We want to reduce obstacles caused by forgotten key settings by supporting multiple languages.
- We want to reduce obstacles such as shaky notation.
- I want to use correct grammar to provide easier-to-understand text to users.

## Install

```bash
npm i -D vite-plugin-i18n-validator
```

## Options

- You can set an object or an array.

| Parameter          | Type                                                | Description                                   |
| ------------------ | --------------------------------------------------- | --------------------------------------------- |
| enabledBuild       | boolean                                             | Enable checks at build time. (default: false) |
| baseLocaleFilePath | string                                              | Set the path of the file to be compared.      |
| include            | string \| RegExp \| Array<string \| RegExp>         | Set the target path.                          |
| exclude            | string \| RegExp \| Array<string \| RegExp>         | Set the paths you want to exclude.            |
| ignoreKeys         | RegExp \| Array<RegExp>                             | Set key not to validate.                      |
| prohibitedKeys     | string[]                                            | Set prohibited keys.                          |
| prohibitedValues   | string[]                                            | Set prohibited values.                        |
| textlint           | true \| {CreateLinterOptions,LoadTextlintrcOptions} | https://github.com/textlint/textlint          |

## Usage

[vite.config.ts]

```ts
import { defineConfig } from "vite";
import i18nValidator from "vite-plugin-i18n-validator";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    i18nValidator([
      {
        enabledBuild: true,
        include: ["src/locales/*.json"],
        baseLocaleFilePath: path.resolve(__dirname, "src/locales/ja.json"),
        prohibitedValues: ["public"],
        textlint: true,
      },
      {
        include: ["src/locales2/*.json"],
        baseLocaleFilePath: path.resolve(__dirname, "src/locales/ja.json"),
        ignoreKeys: /(foo\.todo2)+/i,
      },
    ]),
  ],
});
```

- Compare files in `baseLocaleFilePath` when files set to `include` are saved.

```bash
npm run dev
```

- Compare all files set in `include` with those in `baseLocaleFilePath`.

```base
npm run build
```

- When a file is updated or built, the following messages are output.

```bash
2:05:34 [vite] src/locales/ja.json:5:14: Found TODO: 'todo:hoge"'
2:05:34 [vite] src/locales/ja.json:7:15: Found TODO: 'todo:hoge"'
2:05:49 [vite] src/locales/en.json: Not found: 'foo.zoo'
2:05:49 [vite] src/locales/en.json: Not found: 'foo.todo'
2:05:49 [vite] src/locales/en.json: Not found: 'foo.todo2'
2:05:49 [vite] src/locales/en.json: Not found: 'foo.todo3'
```

- If proofreading is required, install the `textlint` library.

## Principles of conduct

Please see [the principles of conduct](https://github.com/activeguild/vite-plugin-i18n-validator/blob/master/.github/CONTRIBUTING.md) when building a site.

## License

This library is licensed under the [MIT license](https://github.com/activeguild/vite-plugin-i18n-validator/blob/master/LICENSE).
