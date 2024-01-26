<h1 align="center">vite-plugin-i18n-validator ⚡ Welcome 🐷</h1>

<p align="left">
  <a href="https://github.com/actions/setup-node"><img alt="GitHub Actions status" src="https://github.com/activeguild/vite-plugin-i18n-validator/workflows/release/badge.svg" style="max-width:100%;"></a>
</p>

# vite-plugin-i18n-validator

A plugin validates Json files with internationalization support.

- Compare with the base language file to verify the presence of key and value.
- _Optional:_ Use [textlint](https://github.com/textlint/textlint) to proofread values.

## Install

```bash
npm i -D vite-plugin-i18n-validator
```

## Options

| Parameter          | Type                                        | Description                              |
| ------------------ | ------------------------------------------- | ---------------------------------------- |
| baseLocaleFilePath | string                                      | Set the path of the file to be compared. |
| include            | string \| RegExp \| Array<string \| RegExp> | Set the target path.                     |
| exclude            | string \| RegExp \| Array<string \| RegExp> | Set the paths you want to exclude.       |
| prohibitedKeys     | string[]                                    | Set prohibited keys.                     |
| prohibitedValues   | string[]                                    | Set prohibited values.                   |
| textlint           | {CreateLinterOptions,LoadTextlintrcOptions} | https://github.com/textlint/textlint     |

## Usage

[vite.config.ts]

```ts
import { defineConfig } from "vite";
import i18nValidator from "vite-plugin-i18n-validator";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    i18nValidator({
      include: ["src/locales/*.json"],
      baseLocaleFilePath: path.resolve(__dirname, "src/locales/ja.json"),
      prohibitedValues: ["public"],
    }),
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

- If you want to use `textlint`, you need to add `textlint` and `textlint-plugin-json` and add the following settings to `.textlintrc`.

```
{
  "plugins": [
    "json".
  ],.
}
```

## Principles of conduct

Please see [the principles of conduct](https://github.com/activeguild/vite-plugin-i18n-validator/blob/master/.github/CONTRIBUTING.md) when building a site.

## License

This library is licensed under the [MIT license](https://github.com/activeguild/vite-plugin-i18n-validator/blob/master/LICENSE).
