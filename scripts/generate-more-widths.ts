/**
 * Generates src/text-layout/more-widths.ts: how wide Word draws the characters of Hebrew, Thai, box drawing, blocks,
 * geometric shapes (docx's bullets ● ○ ■ among them), symbols and dingbats in the fonts of the width tables, plain and
 * bold, the font it draws each in, which for most is another font than the text's, and how far above and below the
 * baseline each of those fonts makes room in a line.
 *
 * The widths are Word's own, from its PDF of scripts/layout-probes/stops2/word-stops-more-widths.ts, which has ten of each
 * character in each font and face: Word draws each glyph with the width its font gives it, so a character's width is a
 * tenth of its glyphs', and the ascent and descent of each font Word draws them in are in the font's descriptor. Arabic
 * and Devanagari, which Word joins into forms of other widths, aren't in it, and italic and bold italic, which the PDF
 * doesn't have, aren't either.
 *
 * Usage:
 *   python3 scripts/layout-probes/stops2/word-stops-more-widths.py scripts/layout-probes/stops2/word-stops-more-widths.pdf --json \
 *     > build/word-probes/word-stops-more-widths.word.json
 *   npm run run-ts -- scripts/generate-more-widths.ts build/word-probes/word-stops-more-widths.word.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUTPUT = "src/text-layout/more-widths.ts";

const [wordPath] = process.argv.slice(2);
if (!wordPath) {
    console.error("Usage: npm run run-ts -- scripts/generate-more-widths.ts <Word's widths, as JSON>");
    process.exit(1);
}

// Word's widths of the characters, as word-stops-more-widths.py --json reads them from its PDF: each character's width and
// the font Word drew it in, by font and face, such as "Calibri bold", in thousandths of an em, and each font's ascent and
// descent in thousandths of an em
type WordWidths = {
    readonly widths: Readonly<Record<string, Readonly<Record<string, { readonly width: number; readonly font: string }>>>>;
    readonly fonts: Readonly<Record<string, { readonly ascent: number; readonly descent: number }>>;
};
const word: WordWidths = JSON.parse(readFileSync(wordPath, "utf8"));

/**
 * The characters the widths are for, as ranges of code points: Hebrew; Thai; and box drawing, block elements, geometric
 * shapes, miscellaneous symbols and dingbats
 */
const RANGES = [
    [0x590, 0x5ff],
    [0xe00, 0xe7f],
    [0x2500, 0x27bf],
] as const;
const CHARACTERS = RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index));

// The fonts of the width tables, and their faces Word's PDF has
const FONTS = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New"] as const;
const FACES = ["regular", "bold"] as const;
type Face = (typeof FACES)[number];
const keyOf = (font: string, face: Face): string => `${font}${face === "bold" ? " bold" : ""}`;

// Thai's sara am, which Word draws after a consonant as a nikhahit, which takes no room, and a sara aa, as wide as one:
// "น้ำ" is 135.1 twips of Tahoma 11 and 107.1 more (word-stops-thai.docx TH1). On its own, as the probe has it, it is drawn
// after a dotted circle, which a word never has
const SARA_AM = 0xe33;
const SARA_AA = 0xe32;

/** Whether Word drew a character in a face's own font, such as ArialMT or Arial-BoldMT for Arial, and not another */
const isOwnFont = (drawnIn: string, font: string): boolean => {
    const name = drawnIn.toLowerCase().replace(/[^a-z]/g, "");
    return name.startsWith(font.toLowerCase().replace(/[^a-z]/g, "")) && !name.includes("math");
};

// The names of the fonts Word drew characters in, as the PDF writes them without a face's suffix, such as SegoeUISymbol
const NAMES: Readonly<Record<string, string>> = {
    Tahoma: "Tahoma",
    "MS-Gothic": "MS Gothic",
    "MS-Mincho": "MS Mincho",
    SegoeUISymbol: "Segoe UI Symbol",
    ArialMT: "Arial",
    Arial: "Arial",
    CambriaMath: "Cambria Math",
    AppleColorEmoji: "Apple Color Emoji",
    TimesNewRomanPSMT: "Times New Roman",
    TimesNewRomanPS: "Times New Roman",
    AngsanaNew: "Angsana New",
    Calibri: "Calibri",
    Cambria: "Cambria",
};
const fallbackName = (drawnIn: string): string => {
    const name = drawnIn.replace(/-(Bold|Regular|BoldMT)$/, "");
    if (!(name in NAMES)) {
        throw new Error(`A font not named: ${drawnIn}`);
    }
    return NAMES[name];
};
// The fonts Word drew characters in that aren't their text's own, in the order they are first found, each with the
// ascent and descent of the face Word drew them in
const FALLBACKS: { readonly name: string; readonly ascent: number; readonly descent: number }[] = [];
// The ascent and descent Word gives each, in thousandths of an em: those of its descriptor, but for the East Asian fonts,
// whose lines Word makes taller than their characters, as text-width.ts has them: MS Gothic and MS Mincho's lines between
// box drawing characters are 259.4 twips at 10 points (word-stops-more-widths.docx), 1008 above the baseline and 289 below
const EAST_ASIAN = new Set(["MS Gothic", "MS Mincho"]);
const metricsOf = (drawnIn: string): { readonly ascent: number; readonly descent: number } =>
    EAST_ASIAN.has(fallbackName(drawnIn)) ? { ascent: 1008, descent: 289 } : word.fonts[drawnIn];

/**
 * Each character's width in a font's face, in thousandths of an em, or undefined where Word's PDF doesn't show it, and
 * the index of the font Word draws it in among {@link FALLBACKS}, or undefined where it is the face's own. Marks, which go
 * on the character before them, and formatting characters take no room.
 */
const charactersOf = (font: string, face: Face): readonly { readonly width?: number; readonly fallback?: number }[] => {
    const drawn = word.widths[keyOf(font, face)];
    return CHARACTERS.map((code) => {
        if (/[\p{Mn}\p{Me}\p{Cf}]/u.test(String.fromCodePoint(code))) {
            return { width: 0 };
        }
        const read = drawn[(code === SARA_AM ? SARA_AA : code).toString(16).padStart(4, "0")];
        if (read === undefined || read.font.includes("+")) {
            return {};
        }
        // In tenths of a thousandth of an em, as Word lays them out with the fonts' own widths, which are finer
        const width = Math.round(read.width * 10) / 10;
        if (isOwnFont(read.font, font)) {
            return { width };
        }
        const fallback = { name: fallbackName(read.font), ...metricsOf(read.font) };
        const known = FALLBACKS.findIndex((other) => JSON.stringify(other) === JSON.stringify(fallback));
        if (known < 0) {
            // eslint-disable-next-line functional/immutable-data
            FALLBACKS.push(fallback);
        }
        return { width, fallback: known < 0 ? FALLBACKS.length - 1 : known };
    });
};

// The digits the widths are written in, as in font-widths.ts
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

/**
 * Writes tokens as a string, with "*" and two digits repeating the token before it that many more times.
 */
const repeated = (tokens: readonly string[]): string => {
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

/** A face's widths, in tenths of a thousandth of an em, three digits each, or "!" where it isn't known */
const widthsOf = (characters: readonly { readonly width?: number }[]): string =>
    repeated(
        characters.map(({ width }) => {
            if (width === undefined) {
                return "!";
            }
            const tenths = Math.round(width * 10);
            return `${DIGITS[Math.floor(tenths / 4096)]}${DIGITS[Math.floor(tenths / 64) % 64]}${DIGITS[tenths % 64]}`;
        }),
    );

/** The fonts a face's characters are drawn in: "-" for its own, or the digit of the index of another */
const fontsOf = (characters: readonly { readonly fallback?: number }[]): string =>
    repeated(characters.map(({ fallback }) => (fallback === undefined ? "-" : DIGITS[fallback])));

const entries = FONTS.map((font) => {
    const faces = FACES.map((face) => charactersOf(font, face));
    return `    {
        name: "${font}",
${FACES.map(
    (face, index) => `        ${face}: {
            widths: "${widthsOf(faces[index])}",
            fonts: "${fontsOf(faces[index])}",
        },`,
).join("\n")}
    },`;
});

const fallbacks = FALLBACKS.map(({ name, ascent, descent }) => `    { name: "${name}", ascent: ${ascent}, descent: ${descent} },`);

writeFileSync(
    OUTPUT,
    `/**
 * How wide Word draws the characters of Hebrew, Thai, box drawing, blocks, geometric shapes, symbols and dingbats in the
 * fonts of the width tables, plain and bold, the font it draws each in, and how far above and below the baseline those
 * fonts make room in a line.
 *
 * Generated by scripts/generate-more-widths.ts from Word's PDF of scripts/layout-probes/stops2/word-stops-more-widths.ts,
 * saved from Word 16 for Mac. Do not edit by hand.
 *
 * @module
 */

/**
 * The characters the widths are for, as ranges of code points: Hebrew; Thai; and box drawing, block elements, geometric
 * shapes, miscellaneous symbols and dingbats.
 */
export const MORE_WIDTH_RANGES: readonly (readonly [number, number])[] = [
${RANGES.map(([first, last]) => `    [0x${first.toString(16)}, 0x${last.toString(16)}],`).join("\n")}
];

/**
 * A font Word draws characters in that its text's font doesn't have, such as Segoe UI Symbol for Calibri's ★: how far
 * above and below the baseline it makes room in a line, in thousandths of an em.
 */
export type FallbackFont = { readonly name: string; readonly ascent: number; readonly descent: number };

/* cspell:disable */
export const FALLBACK_FONTS: readonly FallbackFont[] = [
${fallbacks.join("\n")}
];

/**
 * How wide Word draws the characters of {@link MORE_WIDTH_RANGES} in a font, plain and bold: each face's \`widths\` in
 * tenths of a thousandth of an em, three digits each, of the 64 of \`0-9a-zA-Z+/\`, or "!" where they aren't known, and the \`fonts\` it
 * draws them in, "-" for the font itself or the digit of one of {@link FALLBACK_FONTS}, each with "*" and two digits
 * repeating what is before it that many more times.
 */
export type MoreWidths = {
    readonly name: string;
    readonly regular: { readonly widths: string; readonly fonts: string };
    readonly bold: { readonly widths: string; readonly fonts: string };
};

export const MORE_WIDTHS: readonly MoreWidths[] = [
${entries.join("\n")}
];
/* cspell:enable */
`,
);
console.log(`${CHARACTERS.length} characters in ${FONTS.length} fonts, drawn in ${FALLBACKS.length} other fonts and faces`);
