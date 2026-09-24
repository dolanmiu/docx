/**
 * Checks that the built package is compatible with the last release: nothing it exported has been removed, and what's
 * still there can be used as before.
 *
 * Usage: npm run run-ts -- scripts/check-api.ts [version or unpacked package directory]
 *
 * By default the check compares against the latest version on npm, which it downloads with `npm pack`. Run
 * `npm run build` first. For each entry point the release has in `exports` (such as `docx`), it checks:
 *
 * - **Runtime:** the ES module, CommonJS and UMD files still export every name, as the same kind of value. Objects that
 *   hold constants, such as `AlignmentType`, still have every key, with the same value.
 * - **Types:** every exported declaration is still there. Each function, class and constant in the build can be used
 *   where the release's could (new optional parameters are fine; removed or changed ones aren't). Each type accepts
 *   what the release's accepted (new optional properties and union members are fine; removed or narrowed ones aren't).
 *
 * Types are compared structurally, with private and protected class members left out. Otherwise TypeScript treats
 * every class in the build as different from the same class in the release.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

type Entry = {
    readonly types: string;
    readonly import: string;
    readonly require: string;
};

type PackageJson = {
    readonly name: string;
    readonly version: string;
    readonly main?: string;
    readonly exports: Record<
        string,
        { readonly import: { readonly types: string; readonly default: string }; readonly require: { readonly default: string } }
    >;
};

const ROOT = resolve(import.meta.dirname, "..");
// Inside the repository, so the declarations' imports of jszip, xml-js and Node's types resolve
const WORK = join(ROOT, "build", "api-check");

const readPackage = (directory: string): PackageJson => JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as PackageJson;

const entriesOf = (pkg: PackageJson): ReadonlyMap<string, Entry> =>
    new Map(
        Object.entries(pkg.exports).map(([path, conditions]) => [
            path,
            { types: conditions.import.types, import: conditions.import.default, require: conditions.require.default },
        ]),
    );

const fetchRelease = (versionOrDirectory: string | undefined): string => {
    if (versionOrDirectory && existsSync(join(versionOrDirectory, "package.json"))) {
        return resolve(versionOrDirectory);
    }
    const { name } = readPackage(ROOT);
    const version = versionOrDirectory ?? execFileSync("npm", ["view", name, "version"], { encoding: "utf8" }).trim();
    const directory = mkdtempSync(join(tmpdir(), "docx-api-"));
    const tarball = execFileSync("npm", ["pack", `${name}@${version}`, "--pack-destination", directory, "--silent"], {
        encoding: "utf8",
    }).trim();
    execFileSync("tar", ["-xzf", join(directory, tarball), "-C", directory]);
    return join(directory, "package");
};

// Runtime

const describeValue = (value: unknown): string => (value === null ? "null" : typeof value);

const compareValues = (name: string, released: unknown, built: unknown, depth = 0): readonly string[] => {
    if (describeValue(released) !== describeValue(built)) {
        return [`${name} was a ${describeValue(released)}, and is now a ${describeValue(built)}`];
    }
    if (typeof released !== "object" || released === null || depth > 2) {
        return typeof released === "function" || typeof released === "object" || released === built
            ? []
            : [`${name} was ${JSON.stringify(released)}, and is now ${JSON.stringify(built)}`];
    }
    const builtObject = built as Record<string, unknown>;
    return Object.entries(released).flatMap(([key, value]) =>
        key in builtObject ? compareValues(`${name}.${key}`, value, builtObject[key], depth + 1) : [`${name}.${key} is missing`],
    );
};

const compareModules = (label: string, released: Record<string, unknown>, built: Record<string, unknown>): readonly string[] =>
    Object.keys(released).flatMap((name) =>
        name in built
            ? compareValues(name, released[name], built[name]).map((problem) => `${label}: ${problem}`)
            : [`${label}: ${name} is missing`],
    );

const checkRuntime = async (release: string, releaseEntry: Entry, builtEntry: Entry, path: string): Promise<readonly string[]> => {
    const require = createRequire(import.meta.url);
    const load = async (directory: string, entry: Entry): Promise<readonly Record<string, unknown>[]> => [
        (await import(pathToFileURL(join(directory, entry.import)).href)) as Record<string, unknown>,
        require(join(directory, entry.require)) as Record<string, unknown>,
    ];
    const [releasedModule, releasedCommonJs] = await load(release, releaseEntry);
    const [builtModule, builtCommonJs] = await load(ROOT, builtEntry);
    const umd =
        path === "." && readPackage(release).main
            ? compareModules(
                  "UMD",
                  require(join(release, readPackage(release).main as string)) as Record<string, unknown>,
                  require(join(ROOT, readPackage(ROOT).main as string)) as Record<string, unknown>,
              )
            : [];
    return [
        ...compareModules("ES module", releasedModule, builtModule),
        ...compareModules("CommonJS", releasedCommonJs, builtCommonJs),
        ...umd,
    ];
};

// Types

/**
 * Leaves out private and protected class members, so classes are compared by what users can reach.
 */
const withoutHiddenMembers = (fileName: string, source: string): string => {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const isHidden = (member: ts.ClassElement): boolean =>
        (member.name !== undefined && ts.isPrivateIdentifier(member.name)) ||
        (ts.canHaveModifiers(member) &&
            (ts.getModifiers(member) ?? []).some(
                (modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword,
            ));
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        const visit = (node: ts.Node): ts.Node => {
            if (ts.isClassDeclaration(node)) {
                return context.factory.updateClassDeclaration(
                    node,
                    node.modifiers,
                    node.name,
                    node.typeParameters,
                    node.heritageClauses,
                    node.members.filter((member) => !isHidden(member)),
                );
            }
            return ts.visitEachChild(node, visit, context);
        };
        return (sourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
    const [transformed] = ts.transform(file, [transformer]).transformed;
    return ts.createPrinter({ removeComments: true }).printFile(transformed);
};

/**
 * Replaces the release's exported classes with the build's, for comparing types. Users pass instances of the build's
 * classes, such as a `Table` in a section's children, so an option type should be checked with those.
 */
const withBuiltClasses = (fileName: string, source: string, classes: ReadonlyMap<string, string>): string => {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const replacements = file.statements.flatMap((statement) => {
        const exportName = ts.isClassDeclaration(statement) && statement.name ? classes.get(statement.name.text) : undefined;
        if (!exportName || !ts.isClassDeclaration(statement) || !statement.name) {
            return [];
        }
        const name = statement.name.text;
        const exported = (ts.getModifiers(statement) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
            ? "export "
            : "";
        const parameters = statement.typeParameters ?? [];
        const declared = parameters.length ? `<${parameters.map((parameter) => parameter.getText(file)).join(", ")}>` : "";
        const args = parameters.length ? `<${parameters.map((parameter) => parameter.name.text).join(", ")}>` : "";
        const built = `import("../built/index").${exportName}`;
        return [
            {
                start: statement.getStart(file),
                end: statement.end,
                text: `${exported}declare const ${name}: typeof ${built};\n${exported}type ${name}${declared} = ${built}${args};`,
            },
        ];
    });
    return replacements.reduceRight(
        (text, { start, end, text: replacement }) => text.slice(0, start) + replacement + text.slice(end),
        source,
    );
};

type ExportInfo = {
    readonly name: string;
    readonly localName: string;
    readonly isValue: boolean;
    readonly isClass: boolean;
    readonly typeParameters: number;
};

const COMPILER_OPTIONS: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: ["node"],
};

const exportsOf = (fileName: string): readonly ExportInfo[] => {
    const program = ts.createProgram([fileName], COMPILER_OPTIONS);
    const checker = program.getTypeChecker();
    const file = program.getSourceFile(fileName) as ts.SourceFile;
    return checker.getExportsOfModule(checker.getSymbolAtLocation(file) as ts.Symbol).map((symbol) => {
        const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        const declaration = target.declarations?.[0];
        const typeParameters =
            declaration &&
            (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration))
                ? (declaration.typeParameters?.length ?? 0)
                : 0;
        return {
            name: symbol.name,
            localName: target.name,
            isValue: (target.flags & ts.SymbolFlags.Value) !== 0,
            isClass: (target.flags & ts.SymbolFlags.Class) !== 0,
            typeParameters,
        };
    });
};

const checkTypes = (release: string, releaseEntry: Entry, builtEntry: Entry, index: number): readonly string[] => {
    const directory = join(WORK, String(index));
    rmSync(directory, { recursive: true, force: true });
    for (const folder of ["released", "released-types", "built"]) {
        mkdirSync(join(directory, folder), { recursive: true });
    }
    const releasedTypes = join(directory, "released", "index.d.ts");
    const builtTypes = join(directory, "built", "index.d.ts");
    const released = withoutHiddenMembers(releasedTypes, readFileSync(join(release, releaseEntry.types), "utf8"));
    writeFileSync(releasedTypes, released);
    writeFileSync(builtTypes, withoutHiddenMembers(builtTypes, readFileSync(join(ROOT, builtEntry.types), "utf8")));

    const releasedExports = exportsOf(releasedTypes);
    const builtNames = new Set(exportsOf(builtTypes).map(({ name }) => name));
    const classes = new Map(
        releasedExports.filter(({ isClass, name }) => isClass && builtNames.has(name)).map(({ localName, name }) => [localName, name]),
    );
    writeFileSync(join(directory, "released-types", "index.d.ts"), withBuiltClasses("index.d.ts", released, classes));

    // Each check is one line, so its errors can be traced back to the export
    const lines = [
        'import type * as Released from "./released/index";',
        'import type * as ReleasedTypes from "./released-types/index";',
        'import type * as Built from "./built/index";',
        ...releasedExports.map(({ name, isValue, typeParameters }, line) => {
            if (isValue) {
                // What the build exports can be used wherever the release's was
                return `declare const built${line}: typeof Built.${name}; export const check${line}: typeof Released.${name} = built${line};`;
            }
            // The type accepts everything the release's did
            const args = typeParameters ? `<${Array.from({ length: typeParameters }, () => "any").join(", ")}>` : "";
            return `declare const released${line}: ReleasedTypes.${name}${args}; export const check${line}: Built.${name}${args} = released${line};`;
        }),
    ];
    const checkFile = join(directory, "check.ts");
    writeFileSync(checkFile, lines.join("\n"));

    const program = ts.createProgram([checkFile], COMPILER_OPTIONS);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => diagnostic.file?.fileName === checkFile);
    return diagnostics.map((diagnostic) => {
        const { line } = (diagnostic.file as ts.SourceFile).getLineAndCharacterOfPosition(diagnostic.start ?? 0);
        const exported = releasedExports[line - 3];
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n").split("\n").slice(0, 6).join("\n        ");
        return `Types: ${exported ? exported.name : `line ${line + 1}`} is not compatible:\n        ${message}`;
    });
};

const release = fetchRelease(process.argv[2]);
const releasePackage = readPackage(release);
const builtEntries = entriesOf(readPackage(ROOT));
console.log(`Comparing the build with ${releasePackage.name} ${releasePackage.version}`);

const problems: string[] = [];
let index = 0;
for (const [path, releaseEntry] of entriesOf(releasePackage)) {
    const builtEntry = builtEntries.get(path);
    const name = path === "." ? releasePackage.name : `${releasePackage.name}/${path.replace(/^\.\//, "")}`;
    if (!builtEntry) {
        problems.push(`${name} is no longer an entry point in package.json's exports`);
        continue;
    }
    if (!existsSync(join(ROOT, builtEntry.types))) {
        console.error(`${builtEntry.types} doesn't exist. Run npm run build first`);
        process.exit(1);
    }
    const found = [
        ...(await checkRuntime(release, releaseEntry, builtEntry, path)),
        ...checkTypes(release, releaseEntry, builtEntry, index++),
    ];
    problems.push(...found.map((problem) => `${name}: ${problem}`));
}

rmSync(WORK, { recursive: true, force: true });
for (const problem of problems) {
    console.error(`::error::${problem}`);
}
console.log(problems.length === 0 ? "No breaking changes found" : `${problems.length} breaking changes found`);
process.exit(problems.length === 0 ? 0 : 1);
