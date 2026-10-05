import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const bundled = (id: string): boolean => id !== "electron";

export default defineConfig({
  base: "./",
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
  build: { outDir: "dist/renderer", emptyOutDir: true },
  pack: [
    {
      entry: { index: "main/index.ts" },
      outDir: "dist/main",
      format: "esm",
      platform: "node",
      target: "node24",
      noExternal: bundled,
      external: ["electron"],
    },
    {
      entry: { preload: "main/preload.ts" },
      outDir: "dist/main",
      clean: false,
      format: "cjs",
      platform: "node",
      target: "node24",
      noExternal: bundled,
      external: ["electron"],
    },
  ],
});
