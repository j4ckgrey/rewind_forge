import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// `@forge/*` mirrors tsconfig so tests import exactly like the source does.
// `node` env because every module under test is server-side only.
export default defineConfig({
  resolve: {
    alias: {
      "@forge": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
    isolate: true,
  },
});
