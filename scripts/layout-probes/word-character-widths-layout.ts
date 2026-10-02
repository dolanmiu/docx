// Lays out the paragraphs of W of word-character-widths.ts, or of word-italic-widths, which the same script writes with
// "italic", with docx/layout, and compares where each line breaks with where Word breaks it, as word-character-widths.py
// --json reads it from Word's PDF: the code point, such as u0041, or the word of ten of its character, such as 0041, that
// starts each line after the first. Only paragraphs whose characters' widths are all known in their face are laid out, as
// the layout stops at the others, and only those Word's PDF shows every word of.
//
// Usage:
//   python3 scripts/layout-probes/word-character-widths.py build/word-probes/word-italic-widths --json \
//     > build/word-probes/word-italic-widths.word.json
//   npm run run-ts -- scripts/layout-probes/word-character-widths-layout.ts word-italic-widths build/word-probes/word-italic-widths.word.json
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { type InlineItem, type TextFont, layoutLines, unknownCharacter } from "../../src/text-layout";

const [name, wordPath] = process.argv.slice(2);
if (!name || !wordPath) {
    console.error("Usage: npm run run-ts -- scripts/layout-probes/word-character-widths-layout.ts <probe> <Word's reading, as JSON>");
    process.exit(1);
}

type Probe = {
    readonly size: number;
    readonly copies: number;
    readonly faces: readonly { readonly font: string; readonly bold: boolean; readonly italic?: boolean }[];
    readonly paragraphs: readonly (readonly number[])[];
};
const PROBE: Probe = JSON.parse(readFileSync(join(import.meta.dirname, `${name}.json`), "utf8"));
const WORD: { readonly lines: Readonly<Record<string, readonly string[]>> } = JSON.parse(readFileSync(wordPath, "utf8"));

// A4 with margins of an inch, in points, and the code points' size, as the script writes them
const WIDTH = (11906 - 2 * 1440) / 20;
const LABEL_SIZE = 6;

const hex = (code: number): string => code.toString(16).padStart(4, "0");

/**
 * Where docx/layout starts each line of a paragraph after the first: the first code point or word that starts on it. A word
 * broken across lines counts on the line it starts on, as the reader counts it, so a line with only the end of one has none
 */
const linesOf = (number: number, codes: readonly number[], face: TextFont): readonly string[] => {
    const text = (value: string, font: TextFont): InlineItem => ({ type: "text", text: value, font });
    const marker = (value: string): InlineItem => ({ type: "marker", name: value });
    const items: readonly InlineItem[] = [
        text(`W${number} `, { font: "Calibri", size: PROBE.size }),
        ...codes.flatMap((code) => [
            marker(`u${hex(code)}`),
            text(`u${hex(code)}`, { font: "Calibri", size: LABEL_SIZE }),
            text(" ", face),
            marker(hex(code)),
            text(`${String.fromCodePoint(code).repeat(PROBE.copies)} `, face),
        ]),
    ];
    return layoutLines(items, { width: WIDTH })
        .slice(1)
        .flatMap(({ markers }) => markers.slice(0, 1));
};

const results = PROBE.faces.map(({ font, bold, italic }, faceIndex) => {
    const face: TextFont = { font, size: PROBE.size, bold, italic };
    const key = `${font}${bold ? " bold" : ""}${italic ? " italic" : ""}`;
    const compared = PROBE.paragraphs.flatMap((codes, index) => {
        const number = faceIndex * PROBE.paragraphs.length + index + 1;
        const word = WORD.lines[`W${number}`];
        const known = codes.every((code) => unknownCharacter(String.fromCodePoint(code), face) === undefined);
        if (word === undefined || !known) {
            return [];
        }
        const ours = linesOf(number, codes, face);
        return [{ number, same: ours.join(" ") === word.join(" "), ours, word }];
    });
    return { key, compared };
});

for (const { key, compared } of results) {
    const differing = compared.filter(({ same }) => !same);
    console.log(`${key}: ${compared.length - differing.length} of ${compared.length} paragraphs' lines break where Word breaks them`);
    for (const { number, ours, word } of differing) {
        console.log(`  W${number}: Word ${word.join(" ")}, docx/layout ${ours.join(" ")}`);
    }
}
const all = results.flatMap(({ compared }) => compared);
console.log(`${all.filter(({ same }) => same).length} of ${all.length} in all`);
