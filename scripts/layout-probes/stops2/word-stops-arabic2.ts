/**
 * Probes of how Word kerns Arabic's letters, for a later batch Word saves. `word-stops-arabic.ts` (AR1) showed each
 * letter's forms as wide as their glyphs in Arial, Times New Roman (which Word draws Cambria's Arabic in) and Courier New,
 * but `word-stops-more-widths.ts` (W) showed ten copies of a letter joined in a word as much as 23 thousandths of an em a
 * letter wider or narrower than their forms in the first two, so Word kerns their letters by pairs, which docx/layout stops
 * at. Calibri's were kerned in AR1 too, an alef before a zero-width non-joiner and alef 34 thousandths narrower. Its PDF, saved in round 26, showed Word drawing every pair as wide as its
 * forms in Arial and Times New Roman, so it doesn't kern them there; Calibri's it kerns by pairs of their glyphs (see the
 * README).
 *
 * word-stops-arabic-kerning.docx, in Arial, Times New Roman and Calibri, plain and bold, at 10 points, in right-to-left
 * runs:
 * AR4: each pair of the letters of AR1 (Arabic's, and Persian's peh, tcheh, jeh, keheh, gaf and farsi yeh), as a word of
 *   the two (p), which joins them as initial and final where the first joins both ways, and between tatweels (t), which
 *   joins them as medial forms, or final; the words of each first letter in a paragraph of their own, after its label in
 *   Calibri 6, such as "AR4 Arial 0628 p", with a space between each, in the order of the letters. A word's kerning is how
 *   wide Word draws it less the widths of its forms (AR1's), and of its tatweels
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-arabic2.ts [folder]
 */
// cspell:ignore tatweel tatweels tcheh keheh
import { Paragraph, TextRun } from "docx";

import { write } from "./kit";

const FACES = ["Arial", "Times New Roman", "Calibri"].flatMap((font) => [false, true].map((bold) => ({ font, bold })));
const LETTERS = [
    ...Array.from({ length: 0x63a - 0x621 + 1 }, (_, index) => 0x621 + index),
    ...Array.from({ length: 0x64a - 0x641 + 1 }, (_, index) => 0x641 + index),
    0x67e,
    0x686,
    0x698,
    0x6a9,
    0x6af,
    0x6cc,
].map((code) => String.fromCodePoint(code));
const TATWEEL = "ـ";
const CONTEXTS = {
    p: (first: string, second: string): string => `${first}${second}`,
    t: (first: string, second: string): string => `${TATWEEL}${first}${second}${TATWEEL}`,
} as const;
const hex = (letter: string): string => letter.codePointAt(0)!.toString(16).padStart(4, "0");

await write({
    name: "word-stops-arabic-kerning",
    size: 20,
    children: FACES.flatMap(({ font, bold }) =>
        LETTERS.flatMap((first) =>
            Object.entries(CONTEXTS).map(
                ([context, word]) =>
                    new Paragraph({
                        children: [
                            new TextRun({ text: `AR4 ${font}${bold ? " bold" : ""} ${hex(first)} ${context} `, font: "Calibri", size: 12 }),
                            new TextRun({
                                text: LETTERS.map((second) => word(first, second)).join(" "),
                                font,
                                bold,
                                size: 20,
                                rightToLeft: true,
                            }),
                        ],
                    }),
            ),
        ),
    ),
});
