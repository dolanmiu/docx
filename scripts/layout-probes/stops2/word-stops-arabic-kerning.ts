/**
 * Checks the layout's widths of Arabic's joined forms against Word's PDF of `word-stops-arabic2.ts` (AR4), as
 * `word-stops-arabic-kerning.py --json` reads it: each pair of the letters as a word of the two, and between tatweels,
 * measured in the forms the layout joins them in, against how wide Word draws it, in the faces whose widths the layout has.
 *
 * Usage:
 *   python3 scripts/layout-probes/stops2/word-stops-arabic-kerning.py scripts/layout-probes/stops2/word-stops-arabic-kerning.pdf --json \
 *     > build/word-probes/word-stops-arabic-kerning.word.json
 *   npm run run-ts -- scripts/layout-probes/stops2/word-stops-arabic-kerning.ts build/word-probes/word-stops-arabic-kerning.word.json
 */
// cspell:ignore tatweel tatweels
import { readFileSync } from "node:fs";

import { arabicFaceOf, joinedWidthsOf } from "../../../src/text-layout/arabic-shaping";

const [path] = process.argv.slice(2);
if (!path) {
    console.error("Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-arabic-kerning.ts <Word's widths, as JSON>");
    process.exit(1);
}

type Read = Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, { readonly width: number }>>>>>>;
const read: Read = JSON.parse(readFileSync(path, "utf8"));
const TATWEEL = "ـ";

for (const [faceName, contexts] of Object.entries(read)) {
    const bold = faceName.endsWith(" bold");
    const face = arabicFaceOf(bold ? faceName.slice(0, -" bold".length) : faceName, bold, false);
    if (face === undefined) {
        console.log(`${faceName}: no widths in the layout`);
        continue;
    }
    for (const [context, words] of Object.entries(contexts)) {
        const differences = Object.entries(words).map(([pair, { width }]) => {
            const characters = [...(context === "p" ? pair : `${TATWEEL}${pair}${TATWEEL}`)];
            const widths = joinedWidthsOf(characters, face);
            const predicted = characters.reduce((sum, _, index) => sum + widths.get(index)!, 0);
            return { pair, difference: width - predicted };
        });
        const most = differences.reduce((largest, next) => (Math.abs(next.difference) > Math.abs(largest.difference) ? next : largest));
        const mean = differences.reduce((sum, { difference }) => sum + difference, 0) / differences.length;
        console.log(
            `${faceName} ${context}: ${differences.length} words, ${most.difference.toFixed(1)} thousandths from the layout's at most (${most.pair}), ${mean.toFixed(2)} on average`,
        );
    }
}
