/**
 * Probes of what Word's PDFs of `word-stops-east-asian3.ts` (round 26) left open, for a later batch Word saves. Japanese
 * in MS Mincho 10.5, 42 ideographs to a line of 9026 twips, as there.
 *
 * word-stops-strict3.docx, with Word's strict rules (w:strictFirstAndLastChars):
 *   EA7a: each half-width small katakana and the half-width prolonged sound mark after 42 ideographs, in a paragraph
 *     indented 200 twips from the right, so that it doesn't fit on the first line (EA5's did): whether it starts the
 *     second, or Word keeps it from the start of a line, moving the ideograph before it with it
 * word-stops-strict-list2.docx, with the strict rules and the document's own list of the characters that can't start a
 *   line of Japanese, 、, 。 and あ, which Word's strict list doesn't have (EA7b): あ and ぁ after 42 ideographs: whether
 *   Word keeps あ from the start of a line by the document's list too, or takes its strict list alone, as EA5L showed for ぁ
 * word-stops-strict-list3.docx, with the strict rules and the document's own list of the characters that can't end a line
 *   of Japanese, 、 alone (EA7c): 「 as the 42nd character: whether it ends the line, as the document's list lets it, or
 *   moves on, as Word's keeps it from the end of one
 * word-stops-compress3.docx, with punctuation compressed (w:characterSpacingControl compressPunctuation), each paragraph
 *   after a line that names it:
 *   EA8a: 43 ideographs distributed, 9030 twips, in paragraphs indented 0, 2, 6, 16, 36 and 96 twips from the right, so
 *     that they are 4, 6, 10, 20, 40 and 100 twips too long for their line: how far over its width a line Word squeezes on
 *     is (EA6b's was 4 twips too long)
 *   EA8b, EA8c: 42 ideographs, 。 (b) or 」 (c) and 10 ideographs, distributed: whether the punctuation ends the first
 *     line, as it took half its width at the end of EA6b's lines
 *   EA8d: EA8b's text aligned left, and EA8e justified
 *   EA8f, EA8g: EA8a's first paragraph and EA8b's text in Chinese, in SimSun (zh-CN), distributed; EA8h: EA8b's text in
 *     Chinese justified
 * word-stops-distribute.docx: EA8a to EA8c again, with punctuation not compressed (EA8i to EA8k), to tell what
 *   distribution does alone
 * word-stops-grid-indents3.docx, on GR14's grid that snaps to characters, of cells of 225.65 twips (GR18):
 *   GR18a: indented 1.5 characters before the margin (leftChars -150); GR18b: 2.5 before it (leftChars -250)
 *   GR18c: indented half a character before the margin and hanging one (leftChars -50, hangingChars 100)
 *   GR18d: indented 1.2 characters and its first line 0.9 more (leftChars 120, firstLineChars 90): whether the first
 *     line is at the 3rd cell or the 4th
 * word-stops-endnotes-down4.docx (GR15f): an endnote from a section running down the page, followed by one down it too,
 *   then one across it: whether Word ends it with its own section, with the second, or at the end of the document
 * word-stops-vertical-lines.docx (VL1), sections running down the page: how far apart Word puts their lines, which its
 *   PDFs showed 278 twips in Calibri 11 (GR15e, `word-stops-east-asian.ts` VD5) where across the page they are 268.55:
 *   VL1a: 12 paragraphs of a line each, in Calibri 11; VL1b: a paragraph of prose of several lines in Calibri 11; VL1c,
 *   VL1d, VL1e: the prose in Arial, Times New Roman and Courier New 11; VL1f: in Calibri 14; VL1g: 12 lines of Japanese
 *   in MS Mincho 10.5 after a label in Calibri 10.5, one with a word of Calibri 11 and one with a superscript
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-east-asian4.ts [folder]
 */
import {
    AlignmentType,
    DocumentGridType,
    EndnoteReferenceRun,
    type ISectionOptions,
    PageTextDirectionType,
    Paragraph,
    SectionType,
    TextRun,
} from "docx";

import { PAGE, injectIntoParagraph, line, marker, prose, settings, write } from "./kit";

const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "Calibri", hAnsi: "Calibri" }, size: 21 } as const;
const SIMSUN = { font: { eastAsia: "SimSun", ascii: "Calibri", hAnsi: "Calibri" }, size: 21 } as const;
const JAPANESE = "測量は夏に船と徒歩で行われ、灯台から河口まで続いた。記録には見つかったものが書かれている。";
const IDEOGRAPH = "永";
const LABEL = { size: 14 } as const;

/** A paragraph of text in a font and language, in MS Mincho 10.5 and Japanese by default */
const inLanguage = (text: string, language = "ja-JP", run: object = MINCHO, options: object = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun({ text, ...run, language: { eastAsia: language } })] });

const hex = (character: string): string => character.codePointAt(0)!.toString(16).padStart(4, "0");

// EA7: the strict rules' cases still open
// cspell:disable-next-line
const HALF_WIDTH = [..."ｧｨｩｪｫｬｭｮｯｰ"];
await write({
    name: "word-stops-strict3",
    children: HALF_WIDTH.flatMap((character) => [
        line(`EA7a S ja-JP ${hex(character)}`, {}, LABEL),
        inLanguage(`${IDEOGRAPH.repeat(42)}${character}${IDEOGRAPH.repeat(3)}`, "ja-JP", MINCHO, { indent: { right: 200 } }),
    ]),
    injections: [settings("<w:strictFirstAndLastChars/>")],
});
await write({
    name: "word-stops-strict-list2",
    children: [..."あぁ"].flatMap((character) => [
        line(`EA7b S ja-JP ${hex(character)}`, {}, LABEL),
        inLanguage(`${IDEOGRAPH.repeat(42)}${character}${IDEOGRAPH.repeat(3)}`),
    ]),
    injections: [settings('<w:noLineBreaksBefore w:lang="ja-JP" w:val="、。あ"/>', "<w:strictFirstAndLastChars/>")],
});
await write({
    name: "word-stops-strict-list3",
    children: [line("EA7c E ja-JP 300c", {}, LABEL), inLanguage(`${IDEOGRAPH.repeat(41)}「${IDEOGRAPH.repeat(4)}`)],
    injections: [settings('<w:noLineBreaksAfter w:lang="ja-JP" w:val="、"/>', "<w:strictFirstAndLastChars/>")],
});

// EA8: distributed and justified lines with and without compression
const OVER = [0, 2, 6, 16, 36, 96];
const distributed = { alignment: AlignmentType.DISTRIBUTE } as const;
const squeezed = (name: string, run: object = MINCHO, language = "ja-JP"): readonly Paragraph[] =>
    OVER.flatMap((indent) => [
        line(`${name} ${indent} above`),
        inLanguage(IDEOGRAPH.repeat(43), language, run, { ...distributed, indent: { right: indent } }),
    ]);
const ended = (name: string, punctuation: string, options: object, run: object = MINCHO, language = "ja-JP"): readonly Paragraph[] => [
    line(`${name} above`),
    inLanguage(`${IDEOGRAPH.repeat(42)}${punctuation}${IDEOGRAPH.repeat(10)}`, language, run, options),
];
await write({
    name: "word-stops-compress3",
    children: [
        ...squeezed("EA8a"),
        ...ended("EA8b", "。", distributed),
        ...ended("EA8c", "」", distributed),
        ...ended("EA8d", "。", {}),
        ...ended("EA8e", "。", { alignment: AlignmentType.JUSTIFIED }),
        line("EA8f 0 above"),
        inLanguage(IDEOGRAPH.repeat(43), "zh-CN", SIMSUN, distributed),
        ...ended("EA8g", "。", distributed, SIMSUN, "zh-CN"),
        ...ended("EA8h", "。", { alignment: AlignmentType.JUSTIFIED }, SIMSUN, "zh-CN"),
        line("EA8 below"),
    ],
    injections: [settings('<w:characterSpacingControl w:val="compressPunctuation"/>')],
});
await write({
    name: "word-stops-distribute",
    children: [...squeezed("EA8i"), ...ended("EA8j", "。", distributed), ...ended("EA8k", "」", distributed), line("EA8 below")],
});

// GR18: indents on a grid that snaps to characters, a character or more before the margin, and a first line rounded otherwise
const SNAP = { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360, charSpace: 210 } as const;
const INDENTS: readonly (readonly [string, string])[] = [
    ["GR18a", '<w:ind w:left="-315" w:leftChars="-150"/>'],
    ["GR18b", '<w:ind w:left="-525" w:leftChars="-250"/>'],
    ["GR18c", '<w:ind w:left="-105" w:leftChars="-50" w:hanging="210" w:hangingChars="100"/>'],
    ["GR18d", '<w:ind w:left="252" w:leftChars="120" w:firstLine="189" w:firstLineChars="90"/>'],
];
await write({
    name: "word-stops-grid-indents3",
    sections: [
        {
            properties: { ...PAGE, grid: SNAP } as never,
            children: [
                line("GR18 above"),
                ...INDENTS.map(
                    ([name]) =>
                        new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE.repeat(2)}`, ...MINCHO }), marker(name)] }),
                ),
                line("GR18 below"),
            ],
        },
    ],
    injections: INDENTS.map(([name, indent]) => injectIntoParagraph(name, { pPr: indent })),
});

// GR15f and VL1: sections whose text runs down the page
const DOWN = { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT };
const section = (name: string, children: readonly Paragraph[], down: boolean): ISectionOptions => ({
    properties: {
        ...PAGE,
        type: SectionType.NEXT_PAGE,
        page: { ...PAGE.page, ...(down ? DOWN : {}) },
    } as never,
    children: [line(`${name} above`), ...children, line(`${name} below`)],
});
await write({
    name: "word-stops-endnotes-down4",
    options: {
        endnotes: { 1: { children: [new Paragraph({ children: [new TextRun({ text: `GR15f endnote ${JAPANESE}`, ...MINCHO })] })] } },
    },
    sections: [
        section(
            "GR15f",
            [new Paragraph({ children: [new TextRun({ text: `GR15f ${JAPANESE}`, ...MINCHO }), new EndnoteReferenceRun(1)] })],
            true,
        ),
        section("GR15f down", [line("GR15f down section")], true),
        section("GR15f across", [line("GR15f across section")], false),
    ],
});
const PROSE = prose(150);
const inFont = (name: string, font: string, size = 22): Paragraph =>
    new Paragraph({ children: [new TextRun({ text: `${name} ${PROSE}`, font, size })] });
await write({
    name: "word-stops-vertical-lines",
    sections: [
        section(
            "VL1a",
            Array.from({ length: 12 }, (_, index) => line(`VL1a line ${index + 1}`)),
            true,
        ),
        section("VL1b", [inFont("VL1b", "Calibri")], true),
        section("VL1c", [inFont("VL1c", "Arial")], true),
        section("VL1d", [inFont("VL1d", "Times New Roman")], true),
        section("VL1e", [inFont("VL1e", "Courier New")], true),
        section("VL1f", [inFont("VL1f", "Calibri", 28)], true),
        section(
            "VL1g",
            [
                ...Array.from(
                    { length: 10 },
                    (_, index) => new Paragraph({ children: [new TextRun({ text: `VL1g ${index + 1} ${JAPANESE}`, ...MINCHO })] }),
                ),
                new Paragraph({
                    children: [new TextRun({ text: `VL1g 11 ${JAPANESE}`, ...MINCHO }), new TextRun({ text: " lighthouse", size: 22 })],
                }),
                new Paragraph({
                    children: [new TextRun({ text: `VL1g 12 ${JAPANESE}`, ...MINCHO }), new TextRun({ text: "2", superScript: true })],
                }),
            ],
            true,
        ),
    ],
});
