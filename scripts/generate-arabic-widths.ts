/**
 * Generates src/text-layout/arabic-widths.ts: how wide Word draws Arabic's letters in each of the forms it joins them in,
 * isolated, final, initial and medial, the lam-alef ligatures and the tatweel, in the fonts of the width tables whose
 * Arabic Word lays out with its glyphs' own widths, plain and bold, and the font it draws each in.
 *
 * The widths are Word's own, from its PDF of scripts/layout-probes/stops2/word-stops-arabic.ts, which has ten copies of
 * each letter in each form, parted by zero-width non-joiners, and the form joined to tatweels: a form's width is how far
 * apart Word puts its copies, less the tatweels'. In Arial, Times New Roman, which Word draws Cambria's Arabic in, and
 * Courier New, that is the width of the glyph Word draws for the form, as the font has it, and a line of Arabic prose is
 * as wide as its glyphs, to within 0.25 points (AR2). Calibri's Word draws narrower than its glyphs in places, an alef
 * before a zero-width non-joiner 34 thousandths of an em narrower, in a way not yet followed, so it isn't in them. Italic
 * isn't in the PDF.
 *
 * Usage:
 *   python3 scripts/layout-probes/stops2/word-stops-arabic.py scripts/layout-probes/stops2/word-stops-arabic.pdf --json \
 *     > build/word-probes/word-stops-arabic.word.json
 *   npm run run-ts -- scripts/generate-arabic-widths.ts build/word-probes/word-stops-arabic.word.json
 */
// cspell:ignore tatweel tatweels tcheh keheh PSMT
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const OUTPUT = "src/text-layout/arabic-widths.ts";

const [wordPath] = process.argv.slice(2);
if (!wordPath) {
    console.error("Usage: npm run run-ts -- scripts/generate-arabic-widths.ts <Word's widths, as JSON>");
    process.exit(1);
}

// Word's widths of the forms, as word-stops-arabic.py --json reads them from its PDF: each word's width, by its label, such
// as u0628m, in thousandths of an em, and the font Word drew it in, by font and face, such as "Arial bold"
type WordWidths = Readonly<Record<string, Readonly<Record<string, { readonly width: number | null; readonly font: string }>>>>;
const word: WordWidths = JSON.parse(readFileSync(wordPath, "utf8"));

// The letters of the probe: Arabic's, and Persian's peh, tcheh, jeh, keheh, gaf and farsi yeh
const LETTERS = [
    ...Array.from({ length: 0x63a - 0x621 + 1 }, (_, index) => 0x621 + index),
    ...Array.from({ length: 0x64a - 0x641 + 1 }, (_, index) => 0x641 + index),
    0x67e,
    0x686,
    0x698,
    0x6a9,
    0x6af,
    0x6cc,
];
// The alefs lam joins with into a ligature, in the order of the table
const LAM_ALEFS = [0x622, 0x623, 0x625, 0x627];
// The letters that join only the letter before them, which have no initial or medial form, and hamza, which joins none
const RIGHT_JOINING = new Set([0x622, 0x623, 0x624, 0x625, 0x627, 0x629, 0x62f, 0x630, 0x631, 0x632, 0x648, 0x698]);
const NON_JOINING = new Set([0x621]);

// The fonts whose Arabic Word lays out with its glyphs' widths, and their faces the PDF has
const FONTS = ["Arial", "Times New Roman", "Cambria", "Courier New"] as const;
const FACES = ["regular", "bold"] as const;
type Face = (typeof FACES)[number];
const keyOf = (font: string, face: Face): string => `${font}${face === "bold" ? " bold" : ""}`;
// The names of the fonts Word drew them in, as the PDF writes them
const NAMES: Readonly<Record<string, string>> = {
    ArialMT: "Arial",
    "Arial-BoldMT": "Arial",
    TimesNewRomanPSMT: "Times New Roman",
    "TimesNewRomanPS-BoldMT": "Times New Roman",
    CourierNewPSMT: "Courier New",
    "CourierNewPS-BoldMT": "Courier New",
};

const hex = (code: number): string => code.toString(16).padStart(4, "0");

/** The width of a word of the probe, by its label, in a font's face, as Word drew it, and the font it drew it in */
const read = (font: string, face: Face, label: string): { readonly width: number; readonly drawnIn: string } => {
    const found = word[keyOf(font, face)]?.[label];
    if (found?.width === undefined || found.width === null || !(found.font in NAMES)) {
        throw new Error(`No width of ${label} in ${keyOf(font, face)}`);
    }
    return { width: found.width, drawnIn: NAMES[found.font] };
};

/**
 * A face's widths, in thousandths of an em: each letter's in its isolated, final, initial and medial forms, or undefined
 * for those a letter doesn't have; each lam-alef ligature's isolated and final; and the tatweel's. And the font Word draws
 * them in.
 */
const faceOf = (font: string, face: Face): { readonly widths: readonly (number | undefined)[]; readonly drawnIn: string } => {
    const fonts = new Set<string>();
    const width = (label: string): number => {
        const found = read(font, face, label);
        fonts.add(found.drawnIn);
        return found.width;
    };
    const widths = [
        ...LETTERS.flatMap((code) =>
            NON_JOINING.has(code)
                ? [width(`u${hex(code)}i`), undefined, undefined, undefined]
                : RIGHT_JOINING.has(code)
                  ? [width(`u${hex(code)}i`), width(`u${hex(code)}f`), undefined, undefined]
                  : ["i", "f", "n", "m"].map((form) => width(`u${hex(code)}${form}`)),
        ),
        ...LAM_ALEFS.flatMap((alef) => [width(`l${hex(alef)}i`), width(`l${hex(alef)}f`)]),
        width("t0640"),
    ];
    if (fonts.size !== 1) {
        throw new Error(`${keyOf(font, face)} drawn in ${[...fonts].join(", ")}`);
    }
    return { widths, drawnIn: [...fonts][0] };
};

// The digits the widths are written in, as in more-widths.ts
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

/** A face's widths, in tenths of a thousandth of an em, three digits each, or "!" where a letter has no such form */
const encoded = (widths: readonly (number | undefined)[]): string =>
    repeated(
        widths.map((width) => {
            if (width === undefined) {
                return "!";
            }
            const tenths = Math.round(width * 10);
            return `${DIGITS[Math.floor(tenths / 4096)]}${DIGITS[Math.floor(tenths / 64) % 64]}${DIGITS[tenths % 64]}`;
        }),
    );

const entries = FONTS.map((font) => {
    const faces = FACES.map((face) => faceOf(font, face));
    const drawnIn = [...new Set(faces.map((face) => face.drawnIn))];
    if (drawnIn.length !== 1) {
        throw new Error(`${font} drawn in ${drawnIn.join(", ")}`);
    }
    return `    {
        name: "${font}",
${drawnIn[0] === font ? "" : `        drawnIn: "${drawnIn[0]}",\n`}${FACES.map((face, index) => `        ${face}: "${encoded(faces[index].widths)}",`).join("\n")}
    },`;
});

writeFileSync(
    OUTPUT,
    `/**
 * How wide Word draws Arabic's letters in each of the forms it joins them in, the lam-alef ligatures and the tatweel, in
 * the fonts of the width tables whose Arabic Word lays out with its glyphs' own widths, plain and bold, and the font it
 * draws them in.
 *
 * Generated by scripts/generate-arabic-widths.ts from Word's PDF of scripts/layout-probes/stops2/word-stops-arabic.ts,
 * saved from Word 16 for Mac. Do not edit by hand.
 *
 * @module
 */
// cspell:ignore tatweel tcheh keheh

/* cspell:disable */
/**
 * The letters the widths are for, in their order: Arabic's (U+0621 to U+063A and U+0641 to U+064A), and Persian's peh,
 * tcheh, jeh, keheh, gaf and farsi yeh
 */
export const ARABIC_LETTERS: string = "${LETTERS.map((code) => String.fromCodePoint(code)).join("")}";

/** The alefs lam joins with into a ligature, in the order of their widths */
export const LAM_ALEFS: string = "${LAM_ALEFS.map((code) => String.fromCodePoint(code)).join("")}";
/* cspell:enable */

/**
 * How wide Word draws Arabic in a font, plain and bold, in tenths of a thousandth of an em, three digits each, of the 64
 * of \`0-9a-zA-Z+/\`, with "*" and two digits repeating what is before it that many more times: each letter of
 * {@link ARABIC_LETTERS} in its isolated, final, initial and medial forms, "!" for those a letter doesn't have; the
 * isolated and final ligature of lam with each of {@link LAM_ALEFS}; and the tatweel. And the font Word draws them in, when
 * it isn't the font's own.
 */
export type ArabicWidths = {
    readonly name: string;
    readonly drawnIn?: string;
    readonly regular: string;
    readonly bold: string;
};

export const ARABIC_WIDTHS: readonly ArabicWidths[] = [
${entries.join("\n")}
];
`,
);
execSync(`npx prettier --write ${OUTPUT}`);
console.log(`${LETTERS.length} letters in ${FONTS.length} fonts`);
