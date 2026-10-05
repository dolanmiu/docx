/**
 * Generates src/layout/equation-widths.ts: how wide each character of an equation of text is in Cambria Math, and the
 * italic correction Word adds after each italic letter, from Word's own PDFs of scripts/layout-probes/word-equations.ts and
 * word-equations2.ts, as word-equations2.py reads them. A character's width is how far Word put the next from it, past the
 * space it put between them, where Word drew both at places of their own, and otherwise its width in the PDF's Cambria
 * Math, to a thousandth of an em. Only the characters of an equation's text are kept: those of the fractions, roots and
 * sums of the probes are left out.
 *
 * Given Word's widths of the characters of `word-stops-equations.docx` EQ27, as word-equation-characters.py reads them,
 * and Word's Cambria Math (Cambria.ttc, in Word's own fonts), it adds the italic letters Word draws for the Greek
 * variants, with their italic correction, and the width of each other character Cambria Math has, which EQ27 showed Word
 * draws as wide as the font has it, in the font's units. It leaves out what Word may draw otherwise: letters, which Word
 * may draw in italic, but for the letters of the mathematical alphabets and the letterlike symbols, which Word draws as
 * they are; marks, which go on the character before them; spaces; and characters EQ27 showed Word drawing at another
 * width, such as the integrals.
 *
 * Usage:
 *   python3 scripts/layout-probes/word-equations2.py --json scripts/layout-probes/word-equations.pdf \
 *     scripts/layout-probes/word-equations2.pdf > build/word-probes/word-equation-widths.json
 *   pdftotext -bbox-layout scripts/layout-probes/stops2/word-stops-equations.pdf build/word-probes/word-stops-equations.html
 *   python3 scripts/layout-probes/stops2/word-equation-characters.py build/word-probes/word-stops-equations.html \
 *     > build/word-probes/word-equation-characters.json
 *   npm run run-ts -- scripts/generate-equation-widths.ts build/word-probes/word-equation-widths.json \
 *     build/word-probes/word-equation-characters.json "/Applications/Microsoft Word.app/Contents/Resources/DFonts/Cambria.ttc"
 */
// cspell:ignore bbox
import { readFileSync, writeFileSync } from "node:fs";

import { readFontFile } from "../src/text-layout/font-file";

const OUTPUT = "src/layout/equation-widths.ts";

// The characters of the fractions, roots and sums of the probes, which an equation's text doesn't have
const LEFT_OUT = new Set(["\u2211", "\u221a"]);

const [path, charactersPath, fontPath] = process.argv.slice(2);
if (path === undefined || charactersPath === undefined || fontPath === undefined) {
    console.error(
        "Usage: npm run run-ts -- scripts/generate-equation-widths.ts <word-equations2.py's widths> <word-equation-characters.py's> <Cambria.ttc>",
    );
    process.exit(2);
}
const measured = JSON.parse(readFileSync(path, "utf8")) as Record<string, readonly [number, number]>;
const characters = JSON.parse(readFileSync(charactersPath, "utf8")) as Record<string, { readonly width: number; readonly drawn: string }>;
const font = readFontFile(readFileSync(fontPath)).find(({ name }) => name === "Cambria Math");
if (font === undefined) {
    console.error(`No Cambria Math in ${fontPath}`);
    process.exit(2);
}
// The font's units to the em
const UNITS = 2048;
/** A character's width in Cambria Math, in its units, or undefined when it has no glyph for it */
const unitsOf = (character: string): number | undefined => {
    const advance = font.advanceOf(character.codePointAt(0)!);
    return advance === undefined ? undefined : Math.round(advance * UNITS);
};
// How far Word's width of a character can be from the font's, in thousandths of an em, as it reads where it drew it
const SAME = 1;

// The italic letters Word draws for the Greek variants (EQ27j), each as wide as the font has it, with its italic
// correction after the last of the ten of it
const variants = Object.entries(characters).flatMap(([character, { width, drawn }]) => {
    const units = unitsOf(drawn);
    return drawn === character || units === undefined
        ? []
        : [[drawn, [Math.round((units / UNITS) * 100000) / 100, Math.round((width - (units / UNITS) * 1000) * 10 * 100) / 100]] as const];
});
const widths: Record<string, readonly [number, number]> = { ...Object.fromEntries(variants), ...measured };
// What EQ27 showed Word drawing at another width than the font's
const otherWidth = new Set(
    Object.entries(characters).flatMap(([character, { width, drawn }]) => {
        const units = unitsOf(drawn);
        return drawn === character && (units === undefined || Math.abs(width - (units / UNITS) * 1000) > SAME) ? [character] : [];
    }),
);
// Letters, but for the mathematical alphabets and the letterlike symbols, marks and spaces, which Word may draw otherwise
const OTHERWISE = /^[\p{L}\p{M}\p{Z}\p{C}]$/u;
const drawnAsThey = (code: number): boolean => (code >= 0x1d400 && code <= 0x1d7ff) || (code >= 0x2100 && code <= 0x214f);

/** A character as TypeScript writes it in a string: as it is when it is plain ASCII, and escaped otherwise */
const written = (character: string): string => {
    const code = character.codePointAt(0)!;
    if (code >= 0x20 && code < 0x7f && character !== '"' && character !== "\\") {
        return character;
    }
    return code > 0xffff ? `\\u{${code.toString(16)}}` : `\\u${code.toString(16).padStart(4, "0")}`;
};

// Cambria Math's own widths of its other characters, in its units, as runs of consecutive characters: the first, in
// base 36, a colon, and the widths, in base 36, separated by commas
const own: number[][] = [];
for (let code = 0x20; code <= 0x10ffff; code++) {
    const character = String.fromCodePoint(code);
    const units = unitsOf(character);
    if (units === undefined || character in widths || otherWidth.has(character) || LEFT_OUT.has(character)) {
        continue;
    }
    if (OTHERWISE.test(character) && !drawnAsThey(code)) {
        continue;
    }
    const last = own[own.length - 1];
    if (last !== undefined && last[0] + last.length - 1 === code) {
        last.push(units);
    } else {
        own.push([code, units]);
    }
}
const ownWidths = own.map(([first, ...run]) => `${first.toString(36)}:${run.map((units) => units.toString(36)).join(",")}`).join(";");

const entries = Object.entries(widths)
    .filter(([character]) => !LEFT_OUT.has(character))
    .sort(([one], [other]) => one.codePointAt(0)! - other.codePointAt(0)!)
    .map(([character, [width, correction]]) => `    ["${written(character)}", [${width}, ${correction}]],`);

writeFileSync(
    OUTPUT,
    `/**
 * How wide each character of an equation of text is in Cambria Math, and the italic correction Word adds after each
 * italic letter, in thousandths of an em, as Word's PDFs of scripts/layout-probes/word-equations.ts and word-equations2.ts
 * show them, and scripts/layout-probes/stops2/word-stops-equations.ts for the italic letters of the Greek variants.
 *
 * Generated by scripts/generate-equation-widths.ts. Do not edit by hand.
 *
 * @module
 */
export const EQUATION_WIDTHS: ReadonlyMap<string, readonly [number, number]> = new Map([
${entries.join("\n")}
]);

/**
 * How wide Cambria Math has each of its other characters that Word draws as they are, in its units, 2048 to the em, as
 * runs of consecutive characters: the first, in base 36, a colon, and the widths, in base 36, separated by commas, the
 * runs separated by semicolons. Word draws them as wide as the font has them (\`word-stops-equations.docx\` EQ27)
 */
export const CAMBRIA_MATH_WIDTHS = "${ownWidths}";
`,
);
console.log(
    `Wrote ${entries.length} characters, and ${own.reduce((all, run) => all + run.length - 1, 0)} of Cambria Math's own, to ${OUTPUT}`,
);
