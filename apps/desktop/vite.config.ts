import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const external = ["electron", "koffi"];
const bundled = (id: string): boolean => !external.includes(id);

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
      external,
    },
    {
      entry: { preload: "main/preload.ts" },
      outDir: "dist/main",
      clean: false,
      format: "cjs",
      platform: "node",
      target: "node24",
      noExternal: bundled,
      external,
    },
  ],
});
