import { defineConfig } from "vite";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        tsconfigPaths(),

    ],
    build: {
        lib: {
            entry: [resolve(__dirname, "src/index.ts")],
            name: "docx",
            fileName: "index",
            formats: ["iife", "es", "cjs", "umd"],
        },
        outDir: resolve(__dirname, "dist"),
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
});
