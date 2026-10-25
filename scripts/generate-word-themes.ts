/**
 * Generates the themes, colors and fonts of docx/theme from Word's own: src/theme/themes.ts has the themes of Word's
 * Design > Themes gallery, src/theme/color-schemes.ts the colors of its Design > Colors gallery, and
 * src/theme/font-schemes.ts the fonts of its Design > Fonts gallery. Word for Mac keeps them in the app, in
 * Contents/Resources/Office Themes: a .thmx file for each theme, and the colors and fonts in its Theme Colors and Theme
 * Fonts folders. The galleries' Office colors and fonts are those of Office Theme.thmx. Each file is read with
 * docx/theme's own `readTheme`.
 *
 * A theme's fonts for other scripts, such as Japanese, are written only where they differ from Office's, as `docx`
 * writes Office's for the others.
 *
 * To refresh them when Word's themes change, run this with Word for Mac installed, and commit the generated files.
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-word-themes.ts [path to Microsoft Word.app]
 */
// cspell:ignore thmx
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { Document, type IThemeFontOptions, type IThemeFontsOptions, type IThemeOptions, Packer } from "../src";
import { readTheme } from "../src/theme/read-theme";

const WORD = process.argv[2] ?? "/Applications/Microsoft Word.app";
const THEMES = join(WORD, "Contents/Resources/Office Themes");
const VERSION = execFileSync("/usr/libexec/PlistBuddy", ["-c", "Print CFBundleShortVersionString", join(WORD, "Contents/Info.plist")])
    .toString()
    .trim();

// Word's fonts of Office 2007 to 2010 are named after their fonts, but the Fonts gallery calls them Office 2007 - 2010
const FONT_SCHEME_NAMES: Readonly<Record<string, string>> = { "Office2007-2010.xml": "Office 2007 - 2010" };

/** A name as a key of the generated object, such as OFFICE_2013_2022 for "Office 2013 - 2022 Theme" */
const keyOf = (name: string): string =>
    name
        .replace(/ Theme$/, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

// Office's themes, colors and fonts come first, as in Word's galleries, the newest first
const OFFICE_KEYS: readonly string[] = ["OFFICE", "OFFICE_2013_2022", "OFFICE_2007_2010"];
const officeRank = (key: string): number => (OFFICE_KEYS.includes(key) ? OFFICE_KEYS.indexOf(key) : OFFICE_KEYS.length);

const filesIn = (folder: string, extension: string): readonly string[] =>
    readdirSync(folder)
        .filter((file) => file.endsWith(extension))
        .sort((a, b) => a.localeCompare(b));

/** The Office theme `docx` writes, whose fonts for other scripts each theme's are compared with */
const office = readTheme(await Packer.toBuffer(new Document({ sections: [] })));

/**
 * One of a theme's fonts, with only its fonts for other scripts that differ from Office's, or its name for Latin text
 * alone when it has no others
 */
const withoutOfficeScripts = (use: keyof IThemeFontsOptions, font: IThemeFontOptions): string | IThemeFontOptions => {
    const officeScripts = (office.fonts![use] as IThemeFontOptions).scripts!;
    const scripts = Object.entries(font.scripts ?? {}).filter(([script, typeface]) => officeScripts[script] !== typeface);
    const { scripts: _, ...rest } = font;
    if (scripts.length === 0) {
        return Object.keys(rest).length === 1 && rest.latin !== undefined ? rest.latin : rest;
    }
    return { ...rest, scripts: Object.fromEntries(scripts) };
};

const withoutOfficeFontScripts = (fonts: IThemeFontsOptions): IThemeFontsOptions => ({
    headings: withoutOfficeScripts("headings", fonts.headings as IThemeFontOptions),
    body: withoutOfficeScripts("body", fonts.body as IThemeFontOptions),
});

const latinOf = (font: IThemeFontsOptions["headings"]): string => (typeof font === "string" ? font : font!.latin!);

/** "Georgia for headings and body text", or "Calibri Light for headings and Calibri for body text" */
const describeFonts = (fonts: IThemeFontsOptions): string => {
    const [headings, body] = [latinOf(fonts.headings), latinOf(fonts.body)];
    return headings === body ? `${headings} for headings and body text` : `${headings} for headings and ${body} for body text`;
};

type Entry = { readonly key: string; readonly description: string; readonly value: unknown };

/** Office's first, then the others in the order of their keys */
const byGallery = (a: Entry, b: Entry): number => officeRank(a.key) - officeRank(b.key) || a.key.localeCompare(b.key);

const objectSource = (entries: readonly Entry[]): string =>
    `{\n${entries.map(({ key, description, value }) => `/** ${description} */\n${key}: ${JSON.stringify(value)},`).join("\n")}\n}`;

/** Text as the lines of a comment, each at most 120 characters long */
const commentLines = (text: string): string =>
    text
        .split(" ")
        .reduce<readonly string[]>((lines, word) => {
            const last = lines[lines.length - 1];
            return last !== undefined && ` * ${last} ${word}`.length <= 120 ? [...lines.slice(0, -1), `${last} ${word}`] : [...lines, word];
        }, [])
        .map((line) => ` * ${line}`)
        .join("\n");

const header = (description: string): string => `/* cspell:disable */
/**
${commentLines(description)}
 *
 * Generated by scripts/generate-word-themes.ts from those of Word for Mac ${VERSION}. Do not edit by hand.
 *
 * @module
 */
`;

const write = (path: string, source: string): void => {
    writeFileSync(path, source);
    execFileSync("npx", ["prettier", "--write", path], { stdio: "inherit" });
};

const themes = filesIn(THEMES, ".thmx")
    .map((file): Entry => {
        const theme = readTheme(readFileSync(join(THEMES, file)));
        const fonts = withoutOfficeFontScripts(theme.fonts!);
        const value: IThemeOptions = { name: theme.name, colors: theme.colors, fonts };
        const label = theme.name!.replace(/ Theme$/, "");
        return { key: keyOf(theme.name!), description: `${label}, with ${describeFonts(fonts)}`, value };
    })
    .sort(byGallery);

write(
    "src/theme/themes.ts",
    `${header(
        "Word's themes, as its Design > Themes gallery offers them: their names, colors, and fonts for headings and body text, with their fonts for other scripts where they differ from Office's.",
    )}import type { IThemeOptions } from "docx";

/**
 * Word's themes, as its Design > Themes gallery offers them, each with its name, its colors, and its fonts for headings
 * and body text. Give one to \`Document\`'s \`theme\`, as it is or with colors or fonts of your own.
 *
 * The fills, lines and effects of shapes styled by the theme are Office's, as \`docx\` writes them.
 *
 * @publicApi
 *
 * @example
 * \`\`\`typescript
 * const doc = new Document({ theme: Themes.FACET, sections: [] });
 * \`\`\`
 */
export const Themes = ${objectSource(themes)} as const satisfies Readonly<Record<string, IThemeOptions>>;
`,
);

const officeColors = readTheme(readFileSync(join(THEMES, "Office Theme.thmx"))).colors;
const colorSchemes = [
    { key: "OFFICE", description: `Office, the colors of the Office theme`, value: officeColors },
    ...filesIn(join(THEMES, "Theme Colors"), ".xml").map((file): Entry => {
        const xml = readFileSync(join(THEMES, "Theme Colors", file), "utf-8");
        const name = /name="([^"]*)"/.exec(xml.slice(xml.indexOf("<a:clrScheme")))![1];
        return { key: keyOf(name), description: name, value: readTheme(xml).colors };
    }),
].sort(byGallery);

write(
    "src/theme/color-schemes.ts",
    `${header("The colors of Word's Design > Colors gallery, each a set of a theme's twelve colors.")}import type { IThemeColorsOptions } from "docx";

/**
 * The colors of Word's Design > Colors gallery, each a set of a theme's twelve colors. Give one to a theme's \`colors\`,
 * to go with fonts of another theme, as Word's Design tab mixes them.
 *
 * @publicApi
 *
 * @example
 * \`\`\`typescript
 * const doc = new Document({ theme: { ...Themes.FACET, colors: ColorSchemes.BLUE_GREEN }, sections: [] });
 * \`\`\`
 */
export const ColorSchemes = ${objectSource(colorSchemes)} as const satisfies Readonly<Record<string, IThemeColorsOptions>>;
`,
);

const officeFonts = withoutOfficeFontScripts(readTheme(readFileSync(join(THEMES, "Office Theme.thmx"))).fonts!);
const fontSchemes = [
    { key: "OFFICE", description: `Office: ${describeFonts(officeFonts)}, the fonts of the Office theme`, value: officeFonts },
    ...filesIn(join(THEMES, "Theme Fonts"), ".xml").map((file): Entry => {
        const xml = readFileSync(join(THEMES, "Theme Fonts", file), "utf-8");
        const name = FONT_SCHEME_NAMES[basename(file)] ?? /name="([^"]*)"/.exec(xml.slice(xml.indexOf("<a:fontScheme")))![1];
        const fonts = withoutOfficeFontScripts(readTheme(xml).fonts!);
        return { key: keyOf(name), description: `${name.startsWith("Office") ? `${name}: ` : ""}${describeFonts(fonts)}`, value: fonts };
    }),
].sort(byGallery);

write(
    "src/theme/font-schemes.ts",
    `${header("The fonts of Word's Design > Fonts gallery, each a theme's fonts for headings and body text.")}import type { IThemeFontsOptions } from "docx";

/**
 * The fonts of Word's Design > Fonts gallery, each a theme's fonts for headings and body text, with their fonts for
 * other scripts where they differ from Office's. Give one to a theme's \`fonts\`, to go with colors of another theme, as
 * Word's Design tab mixes them.
 *
 * @publicApi
 *
 * @example
 * \`\`\`typescript
 * const doc = new Document({ theme: { ...Themes.FACET, fonts: FontSchemes.GEORGIA }, sections: [] });
 * \`\`\`
 */
export const FontSchemes = ${objectSource(fontSchemes)} as const satisfies Readonly<Record<string, IThemeFontsOptions>>;
`,
);
