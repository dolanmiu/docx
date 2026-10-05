/**
 * Generates src/text-layout/office-cloud-fonts.ts: the names of the fonts Office offers as cloud fonts, which Office
 * downloads when a document uses one. Word for Mac draws text in such a font in Office's copy of it, even where the
 * document embeds a file of its own of the font: it drew Pacifico, which a document embedded, in Office's copy, whose
 * letters are narrower and whose lines are shorter (scripts/layout-probes/stops2/word-stops-office-fonts.ts MB4a, MB4b).
 *
 * The names are read from Office's own catalog of its cloud fonts, which Office for Mac keeps in
 * ~/Library/Group Containers/UBF8T346G9.Office/FontCache/4/Catalog/ListAll_hier.Json: each font's family name, its
 * localized family names, such as 游ゴシック for Yu Gothic, and the family name of each of its faces, such as Aptos Black,
 * as documents name them. The catalog is the list of every font Office offers, not of those it has downloaded. It is
 * cross-checked against Microsoft's published list, "Cloud fonts in Office"
 * (https://support.microsoft.com/en-us/office/cloud-fonts-in-office-f7b009fe-037f-45ed-a556-b5fe6ede6adb), which has fewer
 * fonts than the catalog: none of those Office has offered from Google Fonts since, such as Pacifico and Roboto. The faces
 * of the published list that the catalog doesn't name are kept too, and written in the generated file's header.
 *
 * To refresh the list when Office's catalog changes, open Word for Mac's font menu once so Office fetches its catalog
 * again, then run this, and commit the generated file.
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-office-cloud-fonts.ts [catalog] [published list's page, saved as HTML]
 */
// cspell:ignore UBF8T346G9 Aptos hier
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const OUTPUT = "src/text-layout/office-cloud-fonts.ts";
const DEFAULT_CATALOG = join(homedir(), "Library/Group Containers/UBF8T346G9.Office/FontCache/4/Catalog/ListAll_hier.Json");
const PUBLISHED = "https://support.microsoft.com/en-us/office/cloud-fonts-in-office-f7b009fe-037f-45ed-a556-b5fe6ede6adb";

/** A font of Office's catalog: its family name (`f`), its localized family names (`fam`), and its faces (`sf`) */
type CatalogFont = {
    readonly f: string;
    readonly fam: readonly { readonly ltx: string }[];
    readonly sf: readonly {
        /** The face's family name, as documents name it, such as "Aptos Black" */
        readonly gn: string;
        /** Its full name, such as "Aptos Black Italic" */
        readonly dn: string;
        readonly ful: readonly { readonly ltx: string }[];
    }[];
};

type Catalog = { readonly MajorVersion: number; readonly MinorVersion: number; readonly Fonts: readonly CatalogFont[] };

const catalogPath = process.argv[2] ?? DEFAULT_CATALOG;
// The catalog is written with a byte order mark
const catalog = JSON.parse(readFileSync(catalogPath, "utf8").replace(/^﻿/, "")) as Catalog;
const version = `${catalog.MajorVersion}.${catalog.MinorVersion}`;

/** A face's name as the published list and the catalog both may write it: without case, spaces, or "Regular" at its end */
const comparable = (name: string): string =>
    name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/regular$/, "");

// Every name of every face the catalog has, to find those of the published list in
const catalogued = new Set(
    catalog.Fonts.flatMap((font) => [
        font.f,
        ...font.fam.map(({ ltx }) => ltx),
        ...font.sf.flatMap(({ gn, dn, ful }) => [gn, dn, ...ful.map(({ ltx }) => ltx)]),
    ]).map(comparable),
);

const page = process.argv[3] === undefined ? await (await fetch(PUBLISHED)).text() : readFileSync(process.argv[3], "utf8");
/**
 * The text of a cell: without its tags, or any angle bracket left, as no font's name has one, and with the entities its
 * names are written with, `&amp;` last, so that what it makes isn't read as another
 */
const unescaped = (text: string): string =>
    text
        .replace(/<[^>]*>/g, "")
        .replace(/[<>]/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .trim();
// The published list is a table of each face's name, file and version, after a table of where cloud fonts are offered
const published = [...page.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(([, row]) => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(([, cell]) => unescaped(cell)))
    .filter((cells) => cells.length === 3 && cells[0] !== "Font name")
    .map(([name]) => name);
if (published.length === 0) {
    throw new Error("The published list has no fonts: its page has changed");
}
const missing = published.filter((name) => !catalogued.has(comparable(name)));
// The faces of the published list the catalog doesn't name are kept too, as documents may name them
const names = [
    ...new Set([
        ...catalog.Fonts.flatMap((font) => [font.f, ...font.fam.map(({ ltx }) => ltx), ...font.sf.map(({ gn }) => gn)]),
        ...missing,
    ]),
].sort((one, other) => (one.toLowerCase() < other.toLowerCase() ? -1 : one.toLowerCase() > other.toLowerCase() ? 1 : 0));

const today = new Date().toISOString().slice(0, 10);
/** Paragraphs of a comment, wrapped to lines of up to 120 characters */
const commented = (paragraphs: readonly string[]): string =>
    paragraphs
        .map((paragraph) =>
            paragraph
                .split(" ")
                .reduce<readonly string[]>(
                    (lines, word) =>
                        lines.length > 0 && ` * ${lines[lines.length - 1]} ${word}`.length <= 120
                            ? [...lines.slice(0, -1), `${lines[lines.length - 1]} ${word}`]
                            : [...lines, word],
                    [],
                )
                .map((line) => ` * ${line}`)
                .join("\n"),
        )
        .join("\n *\n");
// The names aren't words, and the header names fonts too
const source = `/* cspell:disable */
/**
${commented([
    "The names of the fonts Office offers as cloud fonts, which Word for Mac draws text in from Office's copy of them, even where a document embeds a file of its own of the font.",
    `Generated by scripts/generate-office-cloud-fonts.ts on ${today} from Office's catalog of its cloud fonts, version ${version} (Office for Mac's FontCache/4/Catalog/ListAll_hier.Json): ${catalog.Fonts.length} fonts, with their localized family names and the family names of their faces. Cross-checked against Microsoft's published list, "Cloud fonts in Office" (${PUBLISHED}), whose ${published.length} faces are all in the catalog${missing.length === 0 ? "" : ` but for ${missing.join(", ")}, which are kept too`}. Do not edit by hand.`,
    "@module",
])}
 */

/** The names of the fonts Office offers as cloud fonts, as documents name them */
export const OFFICE_CLOUD_FONTS: readonly string[] = ${JSON.stringify(names)};
`;
writeFileSync(OUTPUT, source);
execSync(`npx prettier --write ${OUTPUT}`, { stdio: "inherit" });
console.log(
    `${names.length} names of ${catalog.Fonts.length} fonts, catalog ${version}; ${missing.length} published faces not in it:`,
    missing,
);
