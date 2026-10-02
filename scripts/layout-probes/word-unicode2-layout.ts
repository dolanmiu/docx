// cspell:disable
// Lays out the probes of word-unicode2.ts's S and E with docx/layout, and compares where each line breaks with Word's,
// as word-unicode2.read.ts prints them from Word's PDF.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-unicode2.read.ts build/word-probes/word-unicode2.html > build/word-probes/word-unicode2.out
//        npm run run-ts -- scripts/layout-probes/word-unicode2-layout.ts build/word-probes/word-unicode2.out
import * as fs from "fs";

import { type InlineItem, layoutLines } from "../../src/text-layout";

const IDEOGRAPH = "永";
const FONT = { font: "MS Mincho", size: 6 };

/**
 * Where docx/layout puts the character a probe tests, as the reader writes it: "." where it starts the second line (S) or
 * ends the first (E), and "X" where it doesn't: where the ideograph before it moves to the second line with it (S), or it
 * moves there itself (E). A bookmark before what moves shows which line it is on.
 */
const verdictOf = (kind: string, character: string, language: string): string => {
    const text = (value: string): InlineItem => ({ type: "text", text: value, font: FONT, language });
    const items: readonly InlineItem[] =
        kind === "S"
            ? [text(IDEOGRAPH.repeat(39)), { type: "marker", name: "moved" }, text(`${IDEOGRAPH}${character}${IDEOGRAPH.repeat(3)}`)]
            : [text(IDEOGRAPH.repeat(39)), { type: "marker", name: "moved" }, text(`${character}${IDEOGRAPH.repeat(4)}`)];
    const lines = layoutLines(items, { width: 241 });
    return lines.findIndex(({ markers }) => markers.includes("moved")) === 0 ? "." : "X";
};

const output = fs.readFileSync(process.argv[2], "utf8").split("\n");
const header = output.findIndex((line) => line.includes("ja-JP  zh-CN"));
const languages = output[header].trim().split(/\s+/);
const rows = output.slice(header + 1).flatMap((line) => {
    const match = /^\s+([SE]) (\S+) U\+[0-9A-F]+\s+(.*)$/.exec(line);
    return match ? [{ kind: match[1], character: match[2], word: match[3].trim().split(/\s+/) }] : [];
});
const differences = rows.flatMap(({ kind, character, word }) =>
    languages.flatMap((language, index) => {
        const ours = verdictOf(kind, character, language);
        return ours === word[index] ? [] : [`${kind} ${character} ${language}: Word ${word[index]}, docx/layout ${ours}`];
    }),
);
console.log(`${rows.length * languages.length - differences.length} of ${rows.length * languages.length} as Word breaks them`);
for (const difference of differences) {
    console.log(`  ${difference}`);
}
