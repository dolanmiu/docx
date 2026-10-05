/**
 * Probes of what `word-stops-east-asian.ts` left stopping, for the next batch Word saves: indents of part of a character on
 * a grid that snaps to characters, and the other cases on grids its probes didn't settle, which section's change sends
 * endnotes to the end of their own section, and Word's strict rules and compression of punctuation in text in Japanese.
 * Japanese in MS Mincho 10.5, as there.
 *
 * word-stops-grid-indents.docx: a grid that snaps to characters (line pitch 360, character pitch 210, cells of 225.65
 * twips), where GR6 showed a paragraph indented 1.5 characters starting at the 3rd cell, as a layout that rounds up or one
 * that rounds to the nearest would put it
 *   GR14a, GR14b: indented 1.2 characters (leftChars 120) and 1.7 (leftChars 170): the 2nd cell or the 3rd, round up or to
 *     the nearest
 *   GR14c: indented 300 twips, 1.33 cells, given in twips (w:left) only
 *   GR14d: a first line indented half a character (firstLineChars 50)
 *   GR14e: indented 2 characters and hanging half a character (leftChars 200, hangingChars 50)
 *   GR14f: a right indent of 1.5 characters (rightChars 150): how many cells the lines keep
 *
 * word-stops-grid-more.docx: the cases around GR3, GR5, GR7, GR8 and GR10, each a section of its own, on the grid it says
 *   GR16a: a word with soft hyphens across the end of a line, on a grid that snaps to characters (GR7a's fit its line)
 *   GR16b: a distributed paragraph of Latin words whose second line only fits its last word squeezed, on such a grid
 *     (GR8's was justified)
 *   GR16c: a right tab stop at 6000 and a centred one at 4000 before ideographs, and a left one at 3000 before Latin text,
 *     on such a grid (GR10a's was left, before ideographs)
 *   GR16d: emphasis marks at at least 20 points of line spacing, on a grid of lines (GR3's were at 1.5 lines)
 *   GR16e: kerned Latin text (kern 1 point), on a grid that snaps to characters (GR5's was on a grid of lines and
 *     characters)
 *   GR16f: a picture in the line after Latin text, on such a grid (GR10b's was after ideographs)
 *
 * word-stops-endnotes-grid.docx, word-stops-endnotes-down.docx and word-stops-endnotes-between.docx: GR13 showed Word
 * putting the endnotes of a section on a grid of lines, followed by one of text running down the page, at the end of their
 * own section, and those of that one at its end too, where it puts endnotes at the end of the document otherwise. Each
 * document has one endnote, as endnotes are placed for the whole document
 *   GR15a: the endnote's section on a grid of lines, the last section of no grid, both across the page: the grid alone
 *   GR15b: the endnote's section running down the page, the last across it, neither on a grid: the direction alone
 *   GR15c: the endnote's section and the last of no grid, with a section on a grid of lines between them: whether Word
 *     ends the endnotes before a section on another grid, or only where the endnote's section isn't the last's
 *
 * word-stops-strict-ja.docx, word-stops-compress-ja.docx and word-stops-compress-kana-ja.docx (EA4a to EA4c): EA1 to EA3's
 *   text, in Japanese (w:lang w:eastAsia="ja-JP"), with Word's strict rules for the characters that can't start a line
 *   (EA4a), and its punctuation compressed (EA4b), and its punctuation and kana (EA4c). EA1 to EA3, in no language, showed
 *   none of them changing a line
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-east-asian2.ts [folder]
 */
import {
    AlignmentType,
    DocumentGridType,
    EmphasisMarkType,
    EndnoteReferenceRun,
    type ISectionOptions,
    LineRuleType,
    PageTextDirectionType,
    Paragraph,
    SectionType,
    TabStopType,
    TextRun,
} from "docx";

import { PAGE, injectIntoParagraph, line, marker, picture, settings, softHyphens, write } from "./kit";

const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "Calibri", hAnsi: "Calibri" }, size: 21 } as const;
const JAPANESE = "測量は夏に船と徒歩で行われ、灯台から河口まで続いた。記録には見つかったものが書かれている。";
const IN_JAPANESE = { language: { eastAsia: "ja-JP" } } as const;
const japanese = (name: string, repeat = 4, run: object = {}): Paragraph =>
    new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE.repeat(repeat)}`, ...MINCHO, ...run })] });

const SNAP = { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360, charSpace: 210 } as const;
const LINES = { type: DocumentGridType.LINES, linePitch: 360 } as const;
const DOWN = { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT };

/** A section of its own, on a new page */
const section = (
    name: string,
    children: readonly Paragraph[],
    properties: { readonly textDirection?: string; readonly grid?: object } = {},
): ISectionOptions => {
    // docx takes a section's text direction with its page
    const { textDirection, ...rest } = properties;
    return {
        properties: {
            ...PAGE,
            type: SectionType.NEXT_PAGE,
            ...rest,
            page: { ...PAGE.page, ...(textDirection ? { textDirection } : {}) },
        } as never,
        children: [line(`${name} above`), ...children, line(`${name} below`)],
    };
};

// GR14: each paragraph's indents, in characters and in twips at 10.5 points a character, as Word writes them
const INDENTS: readonly (readonly [string, string])[] = [
    ["GR14a", '<w:ind w:left="252" w:leftChars="120"/>'],
    ["GR14b", '<w:ind w:left="357" w:leftChars="170"/>'],
    ["GR14c", '<w:ind w:left="300"/>'],
    ["GR14d", '<w:ind w:firstLine="105" w:firstLineChars="50"/>'],
    ["GR14e", '<w:ind w:left="420" w:leftChars="200" w:hanging="105" w:hangingChars="50"/>'],
    ["GR14f", '<w:ind w:right="315" w:rightChars="150"/>'],
];

// GR16b's words, of which a distributed line on the grid only fits the last squeezed
const PROSE = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth";
const LONG_WORD = "Donau\u00addampf\u00adschiff\u00adfahrts\u00adgesell\u00adschaft\u00adkapitän";
await write({
    name: "word-stops-grid-more",
    sections: [
        section("GR16a", [japanese(`GR16a ${JAPANESE.slice(0, 30)}${LONG_WORD} `, 1)], { grid: SNAP }),
        section(
            "GR16b",
            [
                new Paragraph({
                    alignment: AlignmentType.DISTRIBUTE,
                    children: [new TextRun({ text: `GR16b mouth ${`${PROSE} `.repeat(2).trim()}`, ...MINCHO })],
                }),
            ],
            { grid: SNAP },
        ),
        section(
            "GR16c",
            [
                new Paragraph({
                    tabStops: [{ type: TabStopType.RIGHT, position: 6000 }],
                    children: [new TextRun({ text: "GR16c right\t日本語のタブ", ...MINCHO })],
                }),
                new Paragraph({
                    tabStops: [{ type: TabStopType.CENTER, position: 4000 }],
                    children: [new TextRun({ text: "GR16c centre\t日本語のタブ", ...MINCHO })],
                }),
                new Paragraph({
                    tabStops: [{ type: TabStopType.LEFT, position: 3000 }],
                    children: [new TextRun({ text: "GR16c left\tLatin words", ...MINCHO })],
                }),
            ],
            { grid: SNAP },
        ),
        section(
            "GR16d",
            [
                new Paragraph({
                    spacing: { line: 400, lineRule: LineRuleType.AT_LEAST },
                    children: [new TextRun({ text: `GR16d ${JAPANESE}`, ...MINCHO, emphasisMark: { type: EmphasisMarkType.DOT } })],
                }),
                japanese("GR16d after", 1),
            ],
            { grid: LINES },
        ),
        section("GR16e", [new Paragraph({ children: [new TextRun({ text: "GR16e AVATAR Toyota WAVE Yo Te LT kerned text", kern: 2 })] })], {
            grid: SNAP,
        }),
        section(
            "GR16f",
            [
                new Paragraph({
                    children: [
                        new TextRun({ text: "GR16f abc", ...MINCHO }),
                        picture(20, 20),
                        new TextRun({ text: "日本語の絵", ...MINCHO }),
                    ],
                }),
            ],
            { grid: SNAP },
        ),
    ],
    injections: [softHyphens()],
});

await write({
    name: "word-stops-grid-indents",
    sections: [
        section(
            "GR14",
            INDENTS.map(
                ([name]) => new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE.repeat(2)}`, ...MINCHO }), marker(name)] }),
            ),
            { grid: SNAP },
        ),
    ],
    injections: INDENTS.map(([name, indent]) => injectIntoParagraph(name, { pPr: indent })),
});

/** A document of sections, one of which refers to its one endnote */
const withEndnote = async (name: string, probe: string, sections: readonly ISectionOptions[]): Promise<void> => {
    await write({
        name,
        options: { endnotes: { 1: { children: [japanese(`${probe} endnote`, 1)] } } } as object,
        sections,
    });
};
const referring = (name: string): Paragraph =>
    new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE}`, ...MINCHO }), new EndnoteReferenceRun(1)] });

await withEndnote("word-stops-endnotes-grid", "GR15a", [
    section("GR15a", [referring("GR15a")], { grid: LINES }),
    section("GR15a last", [line("GR15a last section")]),
]);
await withEndnote("word-stops-endnotes-down", "GR15b", [
    section("GR15b", [referring("GR15b")], DOWN),
    section("GR15b last", [line("GR15b last section")]),
]);
await withEndnote("word-stops-endnotes-between", "GR15c", [
    section("GR15c", [referring("GR15c")]),
    section("GR15c between", [japanese("GR15c between", 1)], { grid: LINES }),
    section("GR15c last", [line("GR15c last section")]),
]);

const KINSOKU = "記録ぁぃぅぇぉっゃゅょゎ記録ーー記録ゝゞ々記録ァィゥェォッャュョヮヵヶ記録".repeat(6);
const BRACKETS = "「測量」は（夏に）、『船』と【徒歩】で行われた。〔灯台〕から〈河口〉まで、続いた。".repeat(6);
await write({
    name: "word-stops-strict-ja",
    sections: [section("EA4a", [japanese(`EA4a ${KINSOKU}`, 1, IN_JAPANESE)])],
    injections: [settings("<w:strictFirstAndLastChars/>")],
});
await write({
    name: "word-stops-compress-ja",
    sections: [section("EA4b", [japanese(`EA4b ${BRACKETS}`, 1, IN_JAPANESE)])],
    injections: [settings('<w:characterSpacingControl w:val="compressPunctuation"/>')],
});
await write({
    name: "word-stops-compress-kana-ja",
    sections: [section("EA4c", [japanese(`EA4c ${BRACKETS}`, 1, IN_JAPANESE)])],
    injections: [settings('<w:characterSpacingControl w:val="compressPunctuationAndJapaneseKana"/>')],
});
