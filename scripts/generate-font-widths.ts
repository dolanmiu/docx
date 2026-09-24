/**
 * Generates src/shapes/text-metrics/font-widths.ts: how wide each character is
 * in the fonts Word documents use most, so shapes can be sized to fit their text.
 *
 * The widths come from fonts with an open license that are made to have the same widths as Word's fonts:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New).
 * They are in the Debian packages fonts-crosextra-carlito, fonts-crosextra-caladea and fonts-liberation2, and in the
 * image scripts/shape-demos/Dockerfile builds.
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-font-widths.ts <directory with the .ttf files>
 *
 * To copy the fonts out of the image:
 *   docker run --rm --platform linux/amd64 -v "$PWD/build/fonts:/out" docx-shape-renderer \
 *     sh -c 'cp /usr/share/fonts/truetype/crosextra/*.ttf /usr/share/fonts/truetype/liberation/*.ttf /out/'
 */
// cspell:ignore hhea hmtx cmap Caladea crosextra
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUTPUT = "src/shapes/text-metrics/font-widths.ts";

// Each font Word documents use, and the font files with the same widths
const FONTS = [
    { name: "Calibri", regular: "Carlito-Regular.ttf", bold: "Carlito-Bold.ttf" },
    { name: "Cambria", regular: "Caladea-Regular.ttf", bold: "Caladea-Bold.ttf" },
    { name: "Arial", regular: "LiberationSans-Regular.ttf", bold: "LiberationSans-Bold.ttf" },
    { name: "Times New Roman", regular: "LiberationSerif-Regular.ttf", bold: "LiberationSerif-Bold.ttf" },
    { name: "Courier New", regular: "LiberationMono-Regular.ttf", bold: "LiberationMono-Bold.ttf" },
] as const;

// Printable ASCII, Latin-1, and the dashes, quotes, bullet, ellipsis, euro and trade mark signs Word often uses
const CHARACTERS = [
    ...Array.from({ length: 0x7f - 0x20 }, (_, index) => 0x20 + index),
    ...Array.from({ length: 0x100 - 0xa0 }, (_, index) => 0xa0 + index),
    0x2013,
    0x2014,
    0x2018,
    0x2019,
    0x201c,
    0x201d,
    0x2022,
    0x2026,
    0x20ac,
    0x2122,
];

type FontMetrics = {
    /** Width of each character in CHARACTERS, in thousandths of an em */
    readonly widths: readonly number[];
    /** Height of a line of single-spaced text, in thousandths of an em */
    readonly lineHeight: number;
};

/**
 * Reads the widths of a TrueType font's characters from its `head`, `hhea`, `hmtx` and `cmap` tables.
 */
const readFontMetrics = (path: string): FontMetrics => {
    const font = readFileSync(path);
    const tables = new Map(
        Array.from({ length: font.readUInt16BE(4) }, (_, index) => {
            const record = 12 + index * 16;
            return [font.toString("latin1", record, record + 4), font.readUInt32BE(record + 8)] as const;
        }),
    );
    const table = (tag: string): number => {
        const offset = tables.get(tag);
        if (offset === undefined) {
            throw new Error(`${path} has no ${tag} table`);
        }
        return offset;
    };

    const unitsPerEm = font.readUInt16BE(table("head") + 18);
    const hhea = table("hhea");
    const ascender = font.readInt16BE(hhea + 4);
    const descender = font.readInt16BE(hhea + 6);
    const lineGap = font.readInt16BE(hhea + 8);
    const metricCount = font.readUInt16BE(hhea + 34);
    const hmtx = table("hmtx");
    const advance = (glyph: number): number => font.readUInt16BE(hmtx + Math.min(glyph, metricCount - 1) * 4);

    // The Unicode (platform 3, encoding 1) subtable, in format 4
    const cmap = table("cmap");
    const subtable = Array.from({ length: font.readUInt16BE(cmap + 2) }, (_, index) => cmap + 4 + index * 8)
        .filter((record) => font.readUInt16BE(record) === 3 && font.readUInt16BE(record + 2) === 1)
        .map((record) => cmap + font.readUInt32BE(record + 4))[0];
    if (subtable === undefined || font.readUInt16BE(subtable) !== 4) {
        throw new Error(`${path} has no Unicode character map in format 4`);
    }
    const segments = font.readUInt16BE(subtable + 6) / 2;
    const ends = subtable + 14;
    const starts = ends + segments * 2 + 2;
    const deltas = starts + segments * 2;
    const rangeOffsets = deltas + segments * 2;
    const glyphOf = (code: number): number => {
        const segment = Array.from({ length: segments }, (_, index) => index).find((index) => font.readUInt16BE(ends + index * 2) >= code);
        if (segment === undefined || font.readUInt16BE(starts + segment * 2) > code) {
            return 0;
        }
        const delta = font.readUInt16BE(deltas + segment * 2);
        const rangeOffset = font.readUInt16BE(rangeOffsets + segment * 2);
        if (rangeOffset === 0) {
            return (code + delta) & 0xffff;
        }
        const glyph = font.readUInt16BE(rangeOffsets + segment * 2 + rangeOffset + (code - font.readUInt16BE(starts + segment * 2)) * 2);
        return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    };

    const thousandths = (units: number): number => Math.round((units * 1000) / unitsPerEm);
    return {
        widths: CHARACTERS.map((code) => thousandths(advance(glyphOf(code)))),
        lineHeight: thousandths(ascender - descender + lineGap),
    };
};

// Writes a character in a string literal, with anything outside printable ASCII as an escape
const escape = (code: number): string => {
    if (code === 0x22 || code === 0x5c) {
        return `\\${String.fromCharCode(code)}`;
    }
    return code < 0x7f ? String.fromCharCode(code) : `\\u${code.toString(16).padStart(4, "0")}`;
};

const directory = process.argv[2];
if (!directory) {
    console.error("Usage: npm run run-ts -- scripts/generate-font-widths.ts <directory with the .ttf files>");
    process.exit(1);
}

const entries = FONTS.map(({ name, regular, bold }) => {
    const plain = readFontMetrics(join(directory, regular));
    const heavy = readFontMetrics(join(directory, bold));
    return `    {
        name: "${name}",
        lineHeight: ${plain.lineHeight},
        regular: [${plain.widths.join(", ")}],
        bold: [${heavy.widths.join(", ")}],
    },`;
});

writeFileSync(
    OUTPUT,
    `/**
 * How wide each character is in the fonts Word documents use most, and how tall a line of text is.
 *
 * Generated by scripts/generate-font-widths.ts from fonts with an open license that have the same widths:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New).
 * Do not edit by hand.
 *
 * @module
 */
// cspell:ignore Caladea

/**
 * The widths of a font's characters.
 */
export type FontWidths = {
    /** The font's name */
    readonly name: string;
    /** Height of a line of single-spaced text, in thousandths of an em */
    readonly lineHeight: number;
    /** Width of each character in {@link FONT_WIDTH_CHARACTERS}, in thousandths of an em */
    readonly regular: readonly number[];
    /** The same for bold text */
    readonly bold: readonly number[];
};

/**
 * The characters the widths are for, in order: printable ASCII, Latin-1, and common punctuation.
 */
export const FONT_WIDTH_CHARACTERS = "${CHARACTERS.map(escape).join("")}";

export const FONT_WIDTHS: readonly FontWidths[] = [
${entries.join("\n")}
];
`,
);
execSync(`npx prettier --write ${OUTPUT}`);
