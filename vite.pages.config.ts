import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pagesRoot = fileURLToPath(new URL("./github-pages", import.meta.url));

export default defineConfig({
  root: "github-pages",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(pagesRoot, "index.html"),
        calculator: resolve(pagesRoot, "kalkulator/index.html"),
      },
    },
  },
});
