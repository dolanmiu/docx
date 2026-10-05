/**
 * Generates src/text-layout/more-widths.ts: how wide Word draws the characters of Hebrew, the Arabic-Indic and Devanagari
 * digits, Thai, box drawing, blocks, geometric shapes (docx's bullets ● ○ ■ among them), symbols and dingbats in the fonts
 * of the width tables, plain and bold, and in italic and bold italic in Calibri, Cambria, Arial, Times New Roman and
 * Courier New, the font it draws each in, which for most is another font than the text's, and how far above and below
 * the baseline each of those fonts makes room in a line.
 *
 * The widths are Word's own, from its PDFs of scripts/layout-probes/stops2/word-stops-more-widths.ts, which has ten of each
 * character in each font and face: in the five fonts, plain and bold (word-stops-more-widths), in Office's other fonts
 * (word-stops-more-widths-office) and in the five's italics (word-stops-more-italic-widths). Word draws each glyph with the
 * width its font gives it, so a character's width is a tenth of its glyphs', and the ascent and descent of each font Word
 * draws them in are in the font's descriptor. Arabic's and Devanagari's letters, which Word joins into forms of other
 * widths, aren't in it, and the italics of Office's other fonts, which the PDFs don't have, aren't either.
 *
 * It reads the width tables' line heights, from src/text-layout/font-widths.ts, so run scripts/generate-font-widths.ts
 * first. Usage, with each of the three PDFs read:
 *   python3 scripts/layout-probes/stops2/word-stops-more-widths.py scripts/layout-probes/stops2/word-stops-more-widths.pdf --json \
 *     > build/word-probes/word-stops-more-widths.word.json
 *   npm run run-ts -- scripts/generate-more-widths.ts build/word-probes/word-stops-more-widths.word.json \
 *     build/word-probes/word-stops-more-widths-office.word.json build/word-probes/word-stops-more-italic-widths.word.json
 */
// cspell:ignore nikhahit PSMT hhea
import { readFileSync, writeFileSync } from "node:fs";

import { FONT_WIDTHS } from "../src/text-layout/font-widths";

import { OFFICE_FONTS } from "./office-fonts";

const OUTPUT = "src/text-layout/more-widths.ts";

const wordPaths = process.argv.slice(2);
if (wordPaths.length === 0) {
    console.error("Usage: npm run run-ts -- scripts/generate-more-widths.ts <Word's widths, as JSON>...");
    process.exit(1);
}

// Word's widths of the characters, as word-stops-more-widths.py --json reads them from its PDF: each character's width and
// the font Word drew it in, by font and face, such as "Calibri bold", in thousandths of an em, and each font's ascent and
// descent in thousandths of an em
type WordWidths = {
    readonly widths: Readonly<Record<string, Readonly<Record<string, { readonly width: number; readonly font: string }>>>>;
    readonly fonts: Readonly<Record<string, { readonly ascent: number; readonly descent: number }>>;
};
const READINGS: readonly WordWidths[] = wordPaths.map((path) => JSON.parse(readFileSync(path, "utf8")));
const word: WordWidths = {
    widths: Object.assign({}, ...READINGS.map((reading) => reading.widths)),
    fonts: Object.assign({}, ...READINGS.map((reading) => reading.fonts)),
};

/**
 * The characters the widths are for, as ranges of code points: Hebrew; the Arabic-Indic and Eastern Arabic-Indic digits,
 * and the Devanagari full stops and digits, which Word doesn't join to the letters beside them; Thai; and box drawing, block
 * elements, geometric shapes, miscellaneous symbols and dingbats
 */
const RANGES = [
    [0x590, 0x5ff],
    [0x660, 0x669],
    [0x6f0, 0x6f9],
    [0x964, 0x96f],
    [0xe00, 0xe7f],
    [0x2500, 0x27bf],
] as const;
const CHARACTERS = RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index));

// The fonts of the width tables, and the faces Word's PDFs have of them
const FONTS = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New", ...OFFICE_FONTS.map(({ name }) => name)];
const FACES = ["regular", "bold", "italic", "boldItalic"] as const;
type Face = (typeof FACES)[number];
const keyOf = (font: string, face: Face): string =>
    `${font}${face === "bold" || face === "boldItalic" ? " bold" : ""}${face === "italic" || face === "boldItalic" ? " italic" : ""}`;

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
    CourierNewPSMT: "Courier New",
    CourierNewPS: "Courier New",
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
    Mangal: "Mangal",
};
// Kohinoor Devanagari, which Word drew Cambria's and Times New Roman's Devanagari in, whose lines are 300 twips apart at 10
// points where its descriptor's ascent and descent make 280, by how much above and below the baseline isn't known, so the
// characters drawn in it stay unknown
const UNSETTLED = new Set(["KohinoorDevanagari"]);
// The suffixes the PDF writes the name of a face with
const SUFFIX = /-(Regular|Bold|BoldMT|Italic|ItalicMT|BoldItalic|BoldItalicMT)$/;
const fallbackName = (drawnIn: string): string => {
    const name = drawnIn.replace(SUFFIX, "");
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

/** How far above the baseline a font of the width tables' lines are, with the line gap of its hhea table, in thousandths of an em */
const ascentOf = (font: string): number | undefined => {
    const widths = FONT_WIDTHS.find(({ name }) => name === font);
    return widths === undefined ? undefined : widths.lineHeight - widths.descent;
};

/**
 * Whether a font Word draws a character in could make the line of a font taller in a way not yet known: Word makes room
 * for its ascent and descent, as its descriptor gives them, but whether that takes in the line gap of a font with one, as
 * Arial's and Times New Roman's hhea tables have, isn't known, as no Word PDF has shown one taller than the text's own
 * font with it (word-stops-office-fonts.docx FB2 showed Calibri and Cambria Math, which have none)
 */
const lineGapCouldRaise = (font: string, fallback: { readonly name: string; readonly ascent: number }): boolean => {
    const withGap = ascentOf(fallback.name);
    return withGap !== undefined && withGap > fallback.ascent + 1 && ascentOf(font)! < withGap;
};

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
        if (read === undefined || read.font.includes("+") || UNSETTLED.has(read.font.replace(SUFFIX, ""))) {
            return {};
        }
        // In tenths of a thousandth of an em, as Word lays them out with the fonts' own widths, which are finer
        const width = Math.round(read.width * 10) / 10;
        if (isOwnFont(read.font, font)) {
            return { width };
        }
        const fallback = { name: fallbackName(read.font), ...metricsOf(read.font) };
        if (lineGapCouldRaise(font, fallback)) {
            return {};
        }
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

// Each font's faces Word's PDFs have: plain and bold in each, and italic and bold italic in the five. The plain and bold
// faces are read first, so the fonts they draw characters in come first among the fallbacks, as before the others were
const FACES_READ = [
    ...FONTS.flatMap((font) => (["regular", "bold"] as const).map((face) => [font, face] as const)),
    ...FONTS.flatMap((font) => (["italic", "boldItalic"] as const).map((face) => [font, face] as const)),
].filter(([font, face]) => word.widths[keyOf(font, face)] !== undefined);
const CHARACTERS_OF = new Map(FACES_READ.map(([font, face]) => [keyOf(font, face), charactersOf(font, face)]));

const entries = FONTS.map((font) => {
    const faces = FACES.filter((face) => CHARACTERS_OF.has(keyOf(font, face)));
    if (!faces.includes("regular") || !faces.includes("bold")) {
        throw new Error(`Word's widths don't have ${font}, plain and bold`);
    }
    return `    {
        name: "${font}",
${faces
    .map((face) => {
        const characters = CHARACTERS_OF.get(keyOf(font, face))!;
        return `        ${face}: {
            widths: "${widthsOf(characters)}",
            fonts: "${fontsOf(characters)}",
        },`;
    })
    .join("\n")}
    },`;
});

const fallbacks = FALLBACKS.map(({ name, ascent, descent }) => `    { name: "${name}", ascent: ${ascent}, descent: ${descent} },`);

writeFileSync(
    OUTPUT,
    `/**
 * How wide Word draws the characters of Hebrew, the Arabic-Indic and Devanagari digits, Thai, box drawing, blocks,
 * geometric shapes, symbols and dingbats in the fonts of the width tables, plain and bold, and in Calibri's, Cambria's,
 * Arial's, Times New Roman's and Courier New's italics, the font it draws each in, and how far above and below the
 * baseline those fonts make room in a line.
 *
 * Generated by scripts/generate-more-widths.ts from Word's PDFs of scripts/layout-probes/stops2/word-stops-more-widths.ts,
 * saved from Word 16 for Mac. Do not edit by hand.
 *
 * @module
 */

/**
 * The characters the widths are for, as ranges of code points: Hebrew; the Arabic-Indic and Eastern Arabic-Indic digits;
 * the Devanagari full stops and digits; Thai; and box drawing, block elements, geometric shapes, miscellaneous symbols and
 * dingbats.
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
 * How wide Word draws the characters of {@link MORE_WIDTH_RANGES} in a font's faces: each face's \`widths\` in
 * tenths of a thousandth of an em, three digits each, of the 64 of \`0-9a-zA-Z+/\`, or "!" where they aren't known, and the \`fonts\` it
 * draws them in, "-" for the font itself or the digit of one of {@link FALLBACK_FONTS}, each with "*" and two digits
 * repeating what is before it that many more times.
 */
export type MoreWidths = {
    readonly name: string;
    readonly regular: { readonly widths: string; readonly fonts: string };
    readonly bold: { readonly widths: string; readonly fonts: string };
    /** The same in italic and bold italic, or none for a font whose italics Word's PDFs haven't shown */
    readonly italic?: { readonly widths: string; readonly fonts: string };
    readonly boldItalic?: { readonly widths: string; readonly fonts: string };
};

export const MORE_WIDTHS: readonly MoreWidths[] = [
${entries.join("\n")}
];
/* cspell:enable */
`,
);
console.log(`${CHARACTERS.length} characters in ${FONTS.length} fonts, drawn in ${FALLBACKS.length} other fonts and faces`);
