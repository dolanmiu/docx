/**
 * Probes of which of a run's fonts Word draws characters past ASCII in, and of how far it keeps text from a table that
 * text flows around, where docx/layout follows Word's PDFs of round 25 and the OOXML run-font rules (ECMA-376 17.3.2.26)
 * and still stops. Each probe starts a page, between a line above and a line below it, in Calibri 11 on A4 with inch
 * margins. Read with `word-stops.py`, as the others.
 *
 * word-stops-run-fonts.docx:
 * HA1a: Chinese prose in SimSun, given for ASCII and East Asian text alone, with curly quotes and parentheses, with the
 *   run's hint for East Asian text (w:hint="eastAsia"): whether the quotes are in SimSun, a full width each, or in Calibri,
 *   the document's high ANSI font, as they were without the hint (word-stops-compat2-15.docx CN10c, where the layout now
 *   draws them in Calibri) ("a character Word may draw in the East Asian font of a run with the hint for East Asian text")
 * HA1b: Japanese prose in MS Mincho with the hint, with an ellipsis, an em dash, a degree sign, a multiplication sign and
 *   a section sign in it, which the rules put in the East Asian font with the hint
 * HA1c: English prose in Calibri with the hint, with curly quotes and dashes, in a run with MS Mincho for East Asian text,
 *   with no East Asian character in it: whether the hint alone moves them to MS Mincho
 * HA1d: HA1c without the hint, the control
 * HA2a: French prose, with accented letters, in a run given Arial for high ANSI alone (w:hAnsi) in a Calibri document:
 *   whether the letters without accents are in Calibri, the document's font for ASCII, and the accented ones in Arial, as
 *   the rules say and the layout lays them out
 * HA2b: French prose in a run given Courier New for ASCII and Arial for high ANSI: the accented letters in Arial, the
 *   rest in Courier New, by their widths
 * HA3a: Thai, Devanagari, Armenian, Georgian, Greek symbols past U+03CF, a Cyrillic supplement letter, supplemental
 *   punctuation and a bracket past U+27BF, which the rules leave out, in a run given Courier New for ASCII and Arial for
 *   high ANSI: which font each is in, by its width, Courier New's being 0.6 em ("a character of a script Word's run-font
 *   rules leave out, such as Thai, in a run with a high ANSI font other than its font for ASCII")
 * HA3b: Hebrew and Arabic words, in a run that isn't right to left, given Courier New for ASCII and Arial for high ANSI:
 *   whether they are in Courier New, the font for ASCII, as the rules say
 *
 * word-stops-float-distance.docx:
 * FD1a to FD1f: the floating table of CN9, 3000 wide with borders of half a point, 2000 from the margin and 500 below the
 *   paragraph before it, in justified prose, 0 (given), 1, 5, 9, 10 and 15 twips from the text left and right of it:
 *   where the text beside it starts and ends. With no distance given, Word put the text half a point from it (CN9,
 *   word-stops-compat-15.docx CM10); with 180 and 200, as given (word-stops-floats.docx FT1b, word-floats3.docx H2)
 *   ("a table that text flows around less than half a point from the text beside it")
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-run-fonts.ts [folder]
 */
import { AlignmentType, Table, TableAnchorType, TableRow, WidthType } from "docx";

import { ALL_BORDERS, type Child, cell, line, para, probe, prose, write } from "./kit";

// cspell:disable
const CHINESE = "中文的句子，标点符号。“引号”和（括号）都在其中。";
const JAPANESE = "日本語の文章…記号—温度は20°Cで、3×4は12、§5を参照。";
const FRENCH =
    "Les élèves étaient déjà là, près de la fenêtre, à côté du château où l'été s'achève; le maître répète la leçon à voix basse.";
// cspell:enable

const eastAsia = (font: string, hint?: string): object => ({ ascii: font, eastAsia: font, ...(hint === undefined ? {} : { hint }) });

const quotes = `“Quoted” words — and ‘more’ – with dashes: ${prose(40)} “again” ${prose(40)}`;

const fonts: readonly Child[] = [
    ...probe("HA1a", [line(`HA1a ${CHINESE.repeat(8)}`, {}, { font: eastAsia("SimSun", "eastAsia"), size: 21 })]),
    ...probe("HA1b", [line(`HA1b ${JAPANESE.repeat(8)}`, {}, { font: eastAsia("MS Mincho", "eastAsia"), size: 21 })]),
    ...probe("HA1c", [
        line(`HA1c ${quotes}`, {}, { font: { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "MS Mincho", hint: "eastAsia" } }),
    ]),
    ...probe("HA1d", [line(`HA1d ${quotes}`, {}, { font: { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "MS Mincho" } })]),
    ...probe("HA2a", [line(`HA2a ${FRENCH} ${FRENCH} ${FRENCH}`, {}, { font: { hAnsi: "Arial" } })]),
    ...probe("HA2b", [line(`HA2b ${FRENCH} ${FRENCH} ${FRENCH}`, {}, { font: { ascii: "Courier New", hAnsi: "Arial" } })]),
    // cspell:disable
    ...probe("HA3a", [
        line("HA3a ภาษาไทย देवनागरी Հայերեն ქართული ϑϕϖ Ԁԁ ⸮⸻ ⟨⟩ ⠁⠃", {}, { font: { ascii: "Courier New", hAnsi: "Arial" } }),
        line("HA3a control ภาษาไทย देवनागरी Հայերեն ქართული ϑϕϖ Ԁԁ ⸮⸻ ⟨⟩ ⠁⠃", {}, { font: { ascii: "Courier New", hAnsi: "Courier New" } }),
    ]),
    ...probe("HA3b", [
        line("HA3b שלום עולם مرحبا بالعالم", {}, { font: { ascii: "Courier New", hAnsi: "Arial" } }),
        line("HA3b control שלום עולם مرحبا بالعالم", {}, { font: { ascii: "Courier New", hAnsi: "Courier New" } }),
    ]),
    // cspell:enable
];

const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED } as const;

const floating = (name: string, distance: number): Table =>
    new Table({
        width: { size: 3000, type: WidthType.DXA },
        columnWidths: [3000],
        borders: ALL_BORDERS,
        float: {
            horizontalAnchor: TableAnchorType.MARGIN,
            absoluteHorizontalPosition: 2000,
            verticalAnchor: TableAnchorType.TEXT,
            absoluteVerticalPosition: 500,
            leftFromText: distance,
            rightFromText: distance,
        },
        rows: [1, 2, 3].map(
            (row) => new TableRow({ children: [cell(`${name} row ${row}`, { width: { size: 3000, type: WidthType.DXA } })] }),
        ),
    });

const distances: readonly Child[] = [0, 1, 5, 9, 10, 15].flatMap((distance, index) => {
    const name = `FD1${"abcdef"[index]}`;
    return probe(name, [para(name, 30, JUSTIFIED), floating(name, distance), para(`${name} after`, 150, JUSTIFIED)]);
});

const main = async (): Promise<void> => {
    await write({ name: "word-stops-run-fonts", children: fonts });
    await write({ name: "word-stops-float-distance", children: distances });
};

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
