/**
 * Generates src/text-layout/font-widths.ts: how wide each character is
 * in the fonts Word documents use most, so shapes can be sized to fit their text and pages laid out.
 *
 * The widths come from fonts with an open license that are made to have the same widths as Word's fonts:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New).
 * Carlito and Liberation are in the Debian packages fonts-crosextra-carlito and fonts-liberation2. Caladea is the one
 * LibreOffice installs with itself: the one in Debian's fonts-crosextra-caladea (20200211) has narrower letters and
 * shorter lines than Cambria. They are all in the image scripts/shape-demos/Dockerfile builds.
 *
 * Each width is checked against Word's, from its PDF of scripts/layout-probes/word-character-widths.ts, which has every
 * character of the tables in each font, plain and bold. Where Word's width isn't the open font's, it is Word's, and where
 * Word draws the character in another font, it isn't known, so the layout stops at it.
 *
 * Usage:
 *   npm run run-ts -- scripts/generate-font-widths.ts <directory with the .ttf files> <Word's widths, as JSON>
 *
 * To copy the fonts out of the image:
 *   docker run --rm --platform linux/amd64 -v "$PWD/build/fonts:/out" docx-shape-renderer \
 *     sh -c 'cp /usr/share/fonts/truetype/crosextra/Carlito-*.ttf /usr/share/fonts/truetype/liberation/*.ttf /out/ &&
 *       cp "$(ls -d /opt/libreoffice*)"/share/fonts/truetype/Caladea-*.ttf /out/'
 *
 * To read Word's widths from its PDF, with Poppler (in the same image):
 *   pdftotext -bbox-layout scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths.html
 *   pdftohtml -xml -i -q -zoom 1 scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths
 *   python3 scripts/layout-probes/word-character-widths.py build/word-probes/word-character-widths --json \
 *     > build/word-probes/word-character-widths.word.json
 */
// cspell:ignore hhea hmtx cmap Caladea crosextra
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUTPUT = "src/text-layout/font-widths.ts";

// Each font Word documents use, and the font files with the same widths
const FONTS = [
    { name: "Calibri", regular: "Carlito-Regular.ttf", bold: "Carlito-Bold.ttf" },
    // Word's lines of Cambria are 2401 of its 2048 units, 257.92 twips at 11 points (scripts/layout-probes/word-line-heights.ts
    // Hb), which Caladea, of 1000 units, rounds to 1172
    { name: "Cambria", regular: "Caladea-Regular.ttf", bold: "Caladea-Bold.ttf", lineHeight: (2401 * 1000) / 2048 },
    { name: "Arial", regular: "LiberationSans-Regular.ttf", bold: "LiberationSans-Bold.ttf" },
    { name: "Times New Roman", regular: "LiberationSerif-Regular.ttf", bold: "LiberationSerif-Bold.ttf" },
    { name: "Courier New", regular: "LiberationMono-Regular.ttf", bold: "LiberationMono-Bold.ttf" },
] as const;

/**
 * The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
 * the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, which Vietnamese is written in; and general
 * punctuation, which has the spaces other than U+0020, superscripts and subscripts, currency symbols, letterlike symbols,
 * number forms, arrows and mathematical operators. The combining accents between the spacing modifier letters and Greek
 * take no room, and aren't in the tables.
 */
const RANGES = [
    [0x20, 0x7e],
    [0xa0, 0x2ff],
    [0x370, 0x4ff],
    [0x1e00, 0x1eff],
    [0x2000, 0x22ff],
] as const;
const CHARACTERS = RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index));

const HYPHEN = 0x2d;
const SOFT_HYPHEN = 0xad;
const NO_BREAK_HYPHEN = 0x2011;

const [directory, wordPath] = process.argv.slice(2);
if (!directory || !wordPath) {
    console.error("Usage: npm run run-ts -- scripts/generate-font-widths.ts <directory with the .ttf files> <Word's widths, as JSON>");
    process.exit(1);
}

// Word's widths of the characters, as word-character-widths.py --json reads them from Word's PDF: each character's width
// and the font Word drew it in, and each space's width, by font and face, such as "Calibri bold", in thousandths of an em
type WordWidths = {
    readonly widths: Readonly<Record<string, Readonly<Record<string, { readonly width: number; readonly font: string | null }>>>>;
    readonly spaces: Readonly<Record<string, Readonly<Record<string, number>>>>;
};
const WORD: WordWidths = JSON.parse(readFileSync(wordPath, "utf8"));
// How far Word's width can be from the open font's and still be it. Word's PDF puts ten of a character in 10 points
// where they are to within about half a thousandth of an em each, and reads a little wider: OFFSET, below
const TOLERANCE = 1;

/** Whether Word drew a character in a face's own font, such as ArialMT or Arial-BoldMT for Arial, and not another */
const isOwnFont = (drawnIn: string | null, font: string): boolean => {
    const name = (drawnIn ?? "").toLowerCase().replace(/[^a-z]/g, "");
    return name.startsWith(font.toLowerCase().replace(/[^a-z]/g, "")) && !name.includes("math");
};

/**
 * Reads a TrueType font's height of a line and the width of each of its characters from its `head`, `hhea`, `hmtx` and
 * `cmap` tables.
 */
const readFont = (path: string): { readonly lineHeight: number; readonly widthOf: (code: number) => number | undefined } => {
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

    return {
        // Not rounded, as Word doesn't round it: Calibri's 2500 units of 2048 are 1220.703125 thousandths, and lines of
        // 268.55 twips at 11 points, where 1221 would be 268.62
        lineHeight: ((ascender - descender + lineGap) * 1000) / unitsPerEm,
        // In thousandths of an em, or undefined when the font doesn't have the character
        widthOf: (code) => {
            const glyph = glyphOf(code);
            return glyph === 0 ? undefined : Math.round((advance(glyph) * 1000) / unitsPerEm);
        },
    };
};

/**
 * How much wider Word's PDF reads characters than they are: the middle of how much wider than the open fonts' Word's
 * widths of the characters in the faces' own fonts are, about 0.4 thousandths of an em, as Word's PDF puts each character
 * a little further on than its width
 */
const OFFSET = ((): number => {
    const differences = FONTS.flatMap((font) =>
        (["regular", "bold"] as const).flatMap((face) => {
            const { widthOf } = readFont(join(directory, font[face]));
            return Object.entries(WORD.widths[face === "bold" ? `${font.name} bold` : font.name] ?? {}).flatMap(
                ([hex, { width, font: drawnIn }]) => {
                    const open = widthOf(parseInt(hex, 16));
                    return open !== undefined && isOwnFont(drawnIn, font.name) ? [width - open] : [];
                },
            );
        }),
    );
    return [...differences].sort((one, other) => one - other)[Math.floor(differences.length / 2)];
})();

/**
 * The width of each character of a font's face, in thousandths of an em, or undefined where Word's width isn't known.
 * Each is the open font's, where Word's PDF shows it is Word's too, or else Word's own, and undefined where Word drew the
 * character in another font, which depends on the fonts where the document is opened, or where Word's PDF doesn't show
 * it. Marks, which go on the character before them, and formatting characters, such as the zero-width space, take no
 * room, but for the soft hyphen, which Word draws as a hyphen. A font without a soft hyphen, as Carlito has none, has it
 * as wide as a hyphen, as Word draws it (word-watertight-text TX10b: 67.4 twips for each U+00AD in Calibri 11), and the
 * no-break hyphen is as wide as a hyphen, as the layout reads `w:noBreakHyphen` as one, which Word draws as a hyphen
 * whether the font has a no-break hyphen or not (TX17: "state-of-the-art" 1388.3 twips with them and 1388.5 with hyphens).
 */
const widthsOf = (path: string, font: string, face: "regular" | "bold"): readonly (number | undefined)[] => {
    const { widthOf } = readFont(path);
    const key = face === "bold" ? `${font} bold` : font;
    /** The open font's width where it is Word's, or else Word's */
    const checked = (open: number | undefined, word: number): number =>
        open !== undefined && Math.abs(open - word) <= TOLERANCE ? open : Math.round(word);
    return CHARACTERS.map((code) => {
        const hex = code.toString(16).padStart(4, "0");
        if (/[\p{Mn}\p{Me}\p{Cf}]/u.test(String.fromCodePoint(code)) && code !== SOFT_HYPHEN) {
            return 0;
        }
        if (code === SOFT_HYPHEN || code === NO_BREAK_HYPHEN) {
            return (code === SOFT_HYPHEN ? widthOf(code) : undefined) ?? widthOf(HYPHEN);
        }
        // Spaces are read from the space between letters, so Word's PDF reads them as they are
        const space = WORD.spaces[key]?.[hex];
        if (space !== undefined) {
            return checked(widthOf(code), space);
        }
        const drawn = WORD.widths[key]?.[hex];
        return drawn !== undefined && isOwnFont(drawn.font, font) ? checked(widthOf(code), drawn.width - OFFSET) : undefined;
    });
};

// The digits of the widths, two to a width, from 0 to 4095 thousandths of an em
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const CHARACTER_INDEX = new Map(CHARACTERS.map((code, index) => [code, index]));

/**
 * Writes the widths of a font's face as a string, which text-width.ts reads: each width is two of {@link DIGITS}; "=" is
 * a width that is the same as the letter's the character is made from, such as "a" for "ą", which comes before it; "!"
 * is a character whose width isn't known; and "*" with two digits repeats what is before it that many more times.
 */
const encode = (widths: readonly (number | undefined)[]): string => {
    const tokens = widths.map((width, index) => {
        if (width === undefined) {
            return "!";
        }
        if (width > 4095) {
            throw new Error(`A width of ${width} is more than two digits can write`);
        }
        const base = CHARACTER_INDEX.get(String.fromCodePoint(CHARACTERS[index]).normalize("NFD").codePointAt(0)!);
        // As wide as the letter it is made from, unless the character before is as wide too, so the width repeats
        return base !== undefined && base < index && widths[base] === width && widths[index - 1] !== width
            ? "="
            : `${DIGITS[Math.floor(width / 64)]}${DIGITS[width % 64]}`;
    });
    let encoded = "";
    for (let index = 0; index < tokens.length;) {
        let end = index + 1;
        while (end < tokens.length && tokens[end] === tokens[index] && end - index <= 4095) {
            end++;
        }
        const repeats = end - index - 1;
        encoded +=
            repeats > 1 ? `${tokens[index]}*${DIGITS[Math.floor(repeats / 64)]}${DIGITS[repeats % 64]}` : tokens[index].repeat(repeats + 1);
        index = end;
    }
    return encoded;
};

const entries = FONTS.map((font) => {
    const lineHeight = "lineHeight" in font ? font.lineHeight : readFont(join(directory, font.regular)).lineHeight;
    return `    {
        name: "${font.name}",
        lineHeight: ${lineHeight},
        regular: "${encode(widthsOf(join(directory, font.regular), font.name, "regular"))}",
        bold: "${encode(widthsOf(join(directory, font.bold), font.name, "bold"))}",
    },`;
});

writeFileSync(
    OUTPUT,
    `/**
 * How wide each character is in the fonts Word documents use most, and how tall a line of text is.
 *
 * Generated by scripts/generate-font-widths.ts from fonts with an open license that have the same widths:
 * Carlito (Calibri), Caladea (Cambria), and Liberation Sans, Serif and Mono (Arial, Times New Roman and Courier New),
 * checked against Word's: Word's own widths where its PDF shows they differ, and none where Word draws a character in
 * another font, as its width isn't known. Do not edit by hand.
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
    /** Height of a line of single-spaced text, in thousandths of an em, unrounded */
    readonly lineHeight: number;
    /**
     * The width of each character of {@link FONT_WIDTH_RANGES}, in thousandths of an em, written in a string: each width
     * is two digits of the 64 of \`0-9a-zA-Z+/\`, the first of 64ths; "=" is a width that is the same as that of the letter
     * the character is made from, by its decomposition, such as "a" for "ą"; "!" is a character whose width in Word isn't
     * known; and "*" with two digits repeats what is before it that many more times
     */
    readonly regular: string;
    /** The same for bold text */
    readonly bold: string;
};

/**
 * The characters the widths are for, as ranges of code points: printable ASCII; Latin-1, Latin Extended-A and B, IPA and
 * the spacing modifier letters; Greek and Cyrillic; Latin Extended Additional, for Vietnamese; and general punctuation,
 * superscripts and subscripts, currency symbols, letterlike symbols, number forms, arrows and mathematical operators.
 */
export const FONT_WIDTH_RANGES: readonly (readonly [number, number])[] = [
${RANGES.map(([first, last]) => `    [0x${first.toString(16)}, 0x${last.toString(16)}],`).join("\n")}
];

/* cspell:disable */
export const FONT_WIDTHS: readonly FontWidths[] = [
${entries.join("\n")}
];
/* cspell:enable */
`,
);
execSync(`npx prettier --write ${OUTPUT}`);
