import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import dts from "vite-plugin-dts";
import type { Plugin, ResolvedConfig } from "vite";

/** Emit one shared model declaration and small public platform facades. */
export const platformTypes = (): Plugin => {
    const facades = new Map<string, string>();
    let modelNames: string[] = [];
    let output: string;
    const plugin = dts({
        include: ["src/file/**", "src/util/**", "src/export/**", "src/patcher/**", "src/index.shared.ts", "src/platform/shared.ts"],
        exclude: ["src/**/*.spec.ts"],
        entryRoot: "src",
        compilerOptions: { removeComments: false, declarationMap: false, sourceMap: false },
        bundleTypes: {
            invokeOptions: { typescriptCompilerFolder: undefined },
            extractorConfig: {
                compiler: { overrideTsconfig: { include: ["dist"] } },
                dtsRollup: { publicTrimmedFilePath: "", untrimmedFilePath: "<projectFolder>/dist/index.d.ts" },
                messages: { compilerMessageReporting: { default: { logLevel: "error" } } },
            },
        },
        afterDiagnostic(diagnostics) {
            if (diagnostics.length) throw new Error("Platform declarations have TypeScript errors");
        },
        afterBootstrap(runtime) {
            const program = runtime.getProgram();
            const checker = program.getTypeChecker();
            const source = program.getSourceFiles().find((file) => file.fileName.endsWith("/src/index.shared.ts"))!;
            modelNames = checker
                .getExportsOfModule(checker.getSymbolAtLocation(source)!)
                .map((symbol) => symbol.name)
                .sort();
        },
        beforeWriteFile(path, content) {
            const entry = /\/export\/packer\/(packer(?:-browser)?)\.d.ts$/.exec(path)?.[1];
            if (entry) facades.set(entry, content);
        },
        afterBuild() {
            copyFileSync(resolve(output, "index.d.ts"), resolve(output, "_model.d.ts"));
            copyFileSync(resolve(output, "_model.d.ts"), resolve(output, "_model.d.cts"));
            for (const [entry, name] of [
                ["packer", "index"],
                ["packer-browser", "index.browser"],
            ]) {
                const declaration = facades
                    .get(entry)!
                    .replace(/from (["'])(?:\.\.\/\.\.\/file\/file|\.\/(?:next-compiler|packer-core))\1/g, 'from "./_model.js"')
                    .replace(/Packer as CorePacker/g, "PackerCore as CorePacker");
                const names =
                    name === "index.browser" ? modelNames.filter((name) => name !== "OutputByType" && name !== "OutputType") : modelNames;
                const combined = `export { ${names.join(", ")} } from "./_model.js";\n` + declaration;
                writeFileSync(resolve(output, `${name}.d.ts`), combined);
                writeFileSync(resolve(output, `${name}.d.cts`), combined.replaceAll("./_model.js", "./_model.cjs"));
            }
        },
    }) as Plugin;
    const configure = plugin.configResolved as (config: ResolvedConfig) => void;
    return {
        ...plugin,
        configResolved(config) {
            output = resolve(config.root, config.build.outDir);
            return configure.call(this, {
                ...config,
                build: { ...config.build, lib: { ...config.build.lib, entry: resolve(config.root, "src/platform/shared.ts") } },
            });
        },
    };
};
