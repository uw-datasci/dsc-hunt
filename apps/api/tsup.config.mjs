import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/server.ts", "src/routes/**/*.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  sourcemap: true,
  bundle: true,
  // Shared modules imported by more than one route entry emit once under dist/chunks/
  splitting: true,
  treeshake: true,
  outDir: "dist",
  dts: false,
  esbuildOptions(options) {
    options.legalComments = "none"
    options.chunkNames = "chunks/[name]-[hash]"
  },
})
