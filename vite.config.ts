import { resolve } from "path";

import { nodePolyfills } from "vite-plugin-node-polyfills";
import { configDefaults, defineConfig } from "vitest/config";

import { platformTypes } from "./scripts/build-platform-types";

export default defineConfig(({ mode }) => ({
    plugins: [
        // Native Node adapters use node: imports, which stay external. Only the compatibility facade uses shims.
        nodePolyfills({ globals: { Buffer: false }, protocolImports: false }),
        ...(mode !== "legacy" ? [platformTypes()] : []),
    ],
    assetsInclude: ["**/*.docx", "**/*.dotx"],
    resolve: {
        tsconfigPaths: true,
        alias: {
            "@util/": `${resolve(__dirname, "src/util")}/`,
            "@export/": `${resolve(__dirname, "src/export")}/`,
            "@file/": `${resolve(__dirname, "src/file")}/`,
            "@shared": `${resolve(__dirname, "src/shared")}`,
        },
    },
    build: {
        emptyOutDir: mode !== "legacy",
        minify: false,
        target: "es2015",
        lib: {
            entry:
                mode === "legacy"
                    ? resolve(__dirname, "src/index.compat.ts")
                    : {
                          index: resolve(__dirname, "src/index.compat.ts"),
                          "index.node": resolve(__dirname, "src/index.ts"),
                          "index.browser": resolve(__dirname, "src/index.browser.ts"),
                          _model: resolve(__dirname, "src/platform/shared.ts"),
                      },
            name: "docx",
            formats: mode === "legacy" ? ["iife", "umd"] : ["es", "cjs"],
            fileName: (format, name) => {
                if (format === "iife") return "index.iife.js";
                if (format === "umd") return "index.umd.cjs";
                if (format === "cjs") return `${name}.cjs`;
                return name === "_model" ? "_model.js" : `${name}.mjs`;
            },
        },
        rolldownOptions: { external: [/^node:/] },
        outDir: resolve(__dirname, "dist"),
        commonjsOptions: { include: [/node_modules/] },
    },
    test: {
        environment: "jsdom",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
            exclude: [
                ...configDefaults.exclude,
                "**/dist/**",
                "**/demo/**",
                "**/docs/**",
                "**/scripts/**",
                "**/src/**/index.ts",
                "**/src/index.shared.ts",
                "**/src/index.browser.ts",
                "**/src/index.compat.ts",
                "**/src/platform/shared.ts",
                "**/src/**/types.ts",
                "**/src/util/output-type.ts",
                "**/*.spec.ts",
            ],
        },
        include: ["**/src/**/*.spec.ts", "**/packages/**/*.spec.ts"],
        exclude: [...configDefaults.exclude, "**/build/**", "**/demo/**", "**/docs/**", "**/scripts/**", ".claude/**"],
    },
}));
