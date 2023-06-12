import { defineConfig } from "vitest/config";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        dts(),
        nodePolyfills({
            exclude: ["fs"],
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
        lib: {
            entry: [resolve(__dirname, "src/index.ts")],
            name: "docx",
            fileName: "index",
            formats: ["iife", "es", "cjs", "umd"],
        },
        outDir: resolve(__dirname, "build"),
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    test: {
        environment: "jsdom",
        coverage: {
            provider: "c8",
            reporter: ["text", "json", "html"],
            statements: 99.93,
            branches: 98.85,
            functions: 100,
            lines: 99.93,
        },
    },
});
