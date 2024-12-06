import { resolve } from "path";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";
import { copyFileSync } from "node:fs";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        dts({
            rollupTypes: true,
            afterBuild: () => {
                // https://github.com/dolanmiu/docx/pull/2883
                // To pass publint - `npx publint@latest`
                copyFileSync("dist/index.d.ts", "dist/index.d.cts");
            },
        }),
        nodePolyfills({
            exclude: [],
            globals: {
                Buffer: false,
            },
            protocolImports: true,
        }),
    ],
    resolve: {
        alias: {
            "@util/": `${resolve(__dirname, "src/util")}/`,
            "@export/": `${resolve(__dirname, "src/export")}/`,
            "@file/": `${resolve(__dirname, "src/file")}/`,
            "@shared": `${resolve(__dirname, "src/shared")}`,
        },
    },
    build: {
        minify: false,
        target: "es2015",
        lib: {
            entry: [resolve(__dirname, "src/index.ts")],
            name: "docx",
            fileName: (d) => {
                if (d === "umd") {
                    return "index.umd.cjs";
                }

                if (d === "cjs") {
                    return "index.cjs";
                }

                if (d === "es") {
                    return "index.mjs";
                }

                if (d === "iife") {
                    return "index.iife.js";
                }

                return "unknown";
            },
            formats: ["iife", "es", "cjs", "umd"],
        },
        outDir: resolve(__dirname, "dist"),
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    test: {
        environment: "jsdom",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            thresholds: {
                statements: 100,
                branches: 99.68,
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
                "**/src/**/types.ts",
                "**/*.spec.ts",
            ],
        },
        include: ["**/src/**/*.spec.ts", "**/packages/**/*.spec.ts"],
        exclude: [...configDefaults.exclude, "**/build/**", "**/demo/**", "**/docs/**", "**/scripts/**"],
    },
});
