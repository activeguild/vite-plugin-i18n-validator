import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import i18nValidator from "vite-plugin-i18n-validator";
import path from "path";
import inspect from "vite-plugin-inspect";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    inspect(),
    i18nValidator({
      include: ["src/locales/*.json"],
      baseLocaleFilePath: path.resolve(__dirname, "src/locales/ja.json"),
      prohibitedValues: ["public"],
    }),
  ],
});
