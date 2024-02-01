import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import i18nValidator from "vite-plugin-i18n-validator";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    i18nValidator({
      include: ["src/locales/*.json"],
      baseLocaleFilePath: path.resolve(__dirname, "src/locales/ja.json"),
      prohibitedValues: ["public"],
      textlint: true,
      ignoreKeys: /(foo\.todo)+/i,
    }),
  ],
});
