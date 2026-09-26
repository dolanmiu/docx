import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import ts from "typescript";
import { type Plugin, defineConfig } from "vite";

// Builds one of docx's optional entries, such as docx/shapes, into dist, after docx itself (vite.config.ts). The entry
// is chosen by the mode: `vite build --config vite.entries.config.ts --mode shapes`.
//
// An entry imports docx by name, and the build leaves it out, so the package has one copy of each of docx's classes and
// of its id counters. Node and bundlers resolve "docx" to the package itself, the types import it from "docx", and the
// UMD and IIFE files use the `docx` global, so a page loads index.umd.cjs before, say, shapes.umd.cjs.

type Entry = {
    /** The folder in src, and the name of the files in dist */
    readonly name: string;
    /** The global the UMD and IIFE files define */
    readonly global: string;
};

const ENTRIES: Readonly<Record<string, Entry>> = {
    shapes: { name: "shapes", global: "docxShapes" },
    watermarks: { name: "watermarks", global: "docxWatermarks" },
    charts: { name: "charts", global: "docxCharts" },
};

// API Extractor, which bundles the declarations, copies in those of any module that isn't a library, so it would copy
// docx's. TypeScript counts a module as a library when its path has a node_modules folder in it, so while the types are
// built, "docx" resolves to a file there that points to docx's built types
const DOCX_TYPES = resolve(__dirname, "build/types/node_modules/docx/index.d.ts");

const reportDiagnostics = (diagnostics: readonly ts.Diagnostic[]): void => {
    if (diagnostics.length > 0) {
        throw new Error(
            ts.formatDiagnostics(diagnostics, {
                getCanonicalFileName: (fileName) => fileName,
                getCurrentDirectory: () => __dirname,
                getNewLine: () => "\n",
            }),
        );
    }
};

/**
 * Writes the entry's declarations to one file, such as dist/shapes.d.ts, and a copy with .d.cts. They import docx's types
 * from "docx". Every declaration is kept, including those whose JSDoc says @internal, as for docx.
 */
const buildTypes = ({ name }: Entry): Plugin => ({
    name: "docx-entry-types",
    apply: "build",
    closeBundle: () => {
        // Where the declarations are written before they are bundled
        const types = resolve(__dirname, "build/types", name);
        const source = resolve(__dirname, "src", name);
        const output = resolve(__dirname, `dist/${name}.d.ts`);

        rmSync(resolve(__dirname, "build/types"), { recursive: true, force: true });
        mkdirSync(dirname(DOCX_TYPES), { recursive: true });
        writeFileSync(DOCX_TYPES, `export * from "${relative(dirname(DOCX_TYPES), resolve(__dirname, "dist/index"))}";\n`);

        const compilerOptions = {
            noEmit: false,
            declaration: true,
            emitDeclarationOnly: true,
            removeComments: false,
            declarationMap: false,
            sourceMap: false,
            rootDir: source,
            declarationDir: types,
            paths: { docx: [DOCX_TYPES] },
        };
        const config = ts.getParsedCommandLineOfConfigFile(resolve(__dirname, "tsconfig.json"), compilerOptions, {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: (diagnostic) => reportDiagnostics([diagnostic]),
        }) as ts.ParsedCommandLine;
        const fileNames = config.fileNames.filter((fileName) => fileName.startsWith(`${source}/`) && !fileName.endsWith(".spec.ts"));
        const program = ts.createProgram(fileNames, config.options);
        reportDiagnostics(ts.getPreEmitDiagnostics(program));
        reportDiagnostics(program.emit().diagnostics);

        const result = Extractor.invoke(
            ExtractorConfig.prepare({
                configObject: {
                    projectFolder: __dirname,
                    mainEntryPointFilePath: resolve(types, "index.d.ts"),
                    compiler: {
                        overrideTsconfig: {
                            compilerOptions: {
                                ...config.raw.compilerOptions,
                                noEmit: true,
                                paths: compilerOptions.paths,
                                // TypeScript leaves out files in the output folder, which is build
                                outDir: resolve(__dirname, "build/types/unused"),
                            },
                            include: [types],
                        },
                    },
                    apiReport: { enabled: false, reportFileName: "<unscopedPackageName>.api.md" },
                    docModel: { enabled: false },
                    tsdocMetadata: { enabled: false },
                    dtsRollup: { enabled: true, untrimmedFilePath: output },
                    messages: {
                        compilerMessageReporting: { default: { logLevel: "error" } },
                        extractorMessageReporting: { default: { logLevel: "none" } },
                    },
                },
                configObjectFullPath: undefined,
                packageJsonFullPath: resolve(__dirname, "package.json"),
            }),
            { localBuild: true },
        );
        if (!result.succeeded) {
            throw new Error(`Bundling the types of docx/${name} failed with ${result.errorCount} errors`);
        }
        // To pass publint, as for docx
        copyFileSync(output, resolve(__dirname, `dist/${name}.d.cts`));
        rmSync(resolve(__dirname, "build/types"), { recursive: true, force: true });
    },
});

export default defineConfig(({ mode }) => {
    const entry = ENTRIES[mode];
    if (!entry) {
        throw new Error(`Build an optional entry with --mode ${Object.keys(ENTRIES).join(" or --mode ")}`);
    }

    return {
        plugins: [buildTypes(entry)],
        build: {
            // docx is already built into dist
            emptyOutDir: false,
            minify: false,
            target: "es2015",
            lib: {
                entry: resolve(__dirname, "src", entry.name, "index.ts"),
                name: entry.global,
                fileName: (format) => {
                    if (format === "umd") {
                        return `${entry.name}.umd.cjs`;
                    }

                    if (format === "cjs") {
                        return `${entry.name}.cjs`;
                    }

                    if (format === "es") {
                        return `${entry.name}.mjs`;
                    }

                    if (format === "iife") {
                        return `${entry.name}.iife.js`;
                    }

                    return "unknown";
                },
                formats: ["iife", "es", "cjs", "umd"],
            },
            rolldownOptions: {
                external: ["docx"],
                output: { globals: { docx: "docx" } },
            },
            outDir: resolve(__dirname, "dist"),
        },
    };
});
