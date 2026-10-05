/**
 * Probes of document grids (`w:docGrid`) and text that runs down the page (`w:textDirection` on a section), where
 * docx/layout stops after `word-grid.docx`, `word-grid3.docx` (G1 to G14, CA to CD, H1 to H11, VH1) and
 * `word-vertical.docx` (V1 to V13); and of Word's strict rules for the characters that can't start a line and its
 * compression of punctuation. Japanese in MS Mincho 10.5 unless a probe says. Each probe is a section of its own.
 *
 * word-stops-east-asian.docx:
 * GR1: a footnote in a section whose grid snaps to characters (snapToChars, line pitch 360, character pitch 210)
 * GR2: text spaced out 2 points by its run, on such a grid
 * GR3: emphasis marks at 1.5 lines on a grid of lines (pitch 360)
 * GR4a to GR4c: digits (a), punctuation of another size (b) and Latin text of 16 points (c) next to ideographs on a grid of
 *   lines and characters
 * GR5: kerned Latin text (kern 1 point) on a grid of lines and characters
 * GR6: a paragraph indented 1.5 characters (leftChars 150) on a grid that snaps to characters
 * GR7a, GR7b: a soft hyphen (a), and lines beside a picture with square wrapping (b), on such a grid
 * GR8: a justified line on such a grid that only fits squeezed
 * GR9: a Latin word longer than its line on such a grid
 * GR10a, GR10b: a tab (a) and a picture in the line (b) on such a grid
 * GR11: a grid of lines and characters with no line pitch written
 * GR12: a grid that snaps to characters in columns of 2000 and 6026
 * GR13: endnotes after a last section on another grid: the endnotes' references in a section on a grid of lines, the
 *   last section with none (in word-stops-grid-endnotes.docx, as endnotes go at the end)
 * VD1a to VD1d: in text running down the page (tbRl): a tab (a), a soft hyphen (b), a picture in the line (c), and a
 *   picture with square wrapping (d)
 * VD2a, VD2b: text in MS PMincho, whose kana aren't an em (a), and half-width katakana (b)
 * VD3a to VD3e: a border round a run (a), emphasis marks (b), raised text (c), superscript (d), small capitals (e)
 * VD4: a paragraph with borders
 * VD5: a justified paragraph of Latin words with spaces
 * VD6a, VD6b: a footnote (a) and an endnote (b) referred to from text running down the page (b in the endnotes document)
 * VD7: a table
 * VD8a to VD8c: a gutter of 720 (a), two columns (b), a top margin of -1440 (c)
 * VD9: a continuous section break after text running down the page
 * VD10: a grid that snaps to characters
 * VD11: a footer of 5 lines, taller than the bottom margin
 * VD12: text running up the page (btLr) in a section
 * VD13: a number of two digits set across in text running down (w:eastAsianLayout w:vert, tate-chu-yoko)
 *
 * word-stops-strict.docx (EA1): Japanese with small kana, the prolonged sound mark and iteration marks at the starts of
 *   lines, with Word's strict rules (w:strictFirstAndLastChars)
 * word-stops-compress.docx (EA2) and word-stops-compress-kana.docx (EA3): Japanese with brackets and punctuation, with
 *   punctuation compressed (w:characterSpacingControl compressPunctuation) and with punctuation and kana compressed
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-east-asian.ts [folder]
 */
import {
    BorderStyle,
    Column,
    DocumentGridType,
    EmphasisMarkType,
    EndnoteReferenceRun,
    Footer,
    HorizontalPositionRelativeFrom,
    ImageRun,
    type ISectionOptions,
    LineRuleType,
    PageTextDirectionType,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TabStopType,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
    WidthType,
    AlignmentType,
} from "docx";

import {
    ALL_BORDERS,
    PAGE,
    PNG,
    cell,
    footnote,
    line,
    lines,
    marker,
    picture,
    replaceMarkerRun,
    settings,
    softHyphens,
    write,
} from "./kit";

const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "Calibri", hAnsi: "Calibri" }, size: 21 } as const;
const JAPANESE = "測量は夏に船と徒歩で行われ、灯台から河口まで続いた。記録には見つかったものが書かれている。";
const japanese = (name: string, repeat = 4, run: object = {}): Paragraph =>
    new Paragraph({ children: [new TextRun({ text: `${name} ${JAPANESE.repeat(repeat)}`, ...MINCHO, ...run })] });

type Grid = {
    readonly type?: (typeof DocumentGridType)[keyof typeof DocumentGridType];
    readonly linePitch?: number;
    readonly charSpace?: number;
};
const SNAP: Grid = { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360, charSpace: 210 };
const LINES_AND_CHARS: Grid = { type: DocumentGridType.LINES_AND_CHARS, linePitch: 360, charSpace: 210 };
const LINES: Grid = { type: DocumentGridType.LINES, linePitch: 360 };

/** A section of its own, on a new page */
const section = (
    name: string,
    children: readonly (Paragraph | Table)[],
    properties: { readonly textDirection?: string; readonly page?: object } & object = {},
    extra: Partial<ISectionOptions> = {},
): ISectionOptions => {
    // docx takes a section's text direction with its page
    const { textDirection, page = PAGE.page, ...rest } = properties;
    return {
        ...extra,
        properties: {
            ...PAGE,
            type: SectionType.NEXT_PAGE,
            ...rest,
            page: { ...page, ...(textDirection ? { textDirection } : {}) },
        } as never,
        children: [line(`${name} above`), ...children, line(`${name} below`)],
    };
};
const floating = (): ImageRun =>
    new ImageRun({
        type: "png",
        data: PNG,
        transformation: { width: 96, height: 96 },
        floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: 914400 },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
            wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
        },
    });
const DOWN = { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT };
const border = { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 1 };

const sections: ISectionOptions[] = [
    section(
        "GR1",
        [
            new Paragraph({ children: [new TextRun({ text: `GR1 ${JAPANESE}`, ...MINCHO }), footnote(japanese("GR1 note", 1))] }),
            japanese("GR1 after", 2),
        ],
        { grid: SNAP },
    ),
    section(
        "GR2",
        [
            new Paragraph({
                children: [
                    new TextRun({ text: "GR2 ", ...MINCHO }),
                    new TextRun({ text: JAPANESE, ...MINCHO, characterSpacing: 40 }),
                    new TextRun({ text: JAPANESE, ...MINCHO }),
                ],
            }),
        ],
        { grid: SNAP },
    ),
    section(
        "GR3",
        [
            new Paragraph({
                spacing: { line: 360, lineRule: LineRuleType.AUTO },
                children: [new TextRun({ text: `GR3 ${JAPANESE}`, ...MINCHO, emphasisMark: { type: EmphasisMarkType.DOT } })],
            }),
            japanese("GR3 after", 1),
        ],
        { grid: LINES },
    ),
    section(
        "GR4",
        [
            japanese("GR4a 日本12日本345日本", 1),
            new Paragraph({
                children: [
                    new TextRun({ text: "GR4b 日本", ...MINCHO }),
                    new TextRun({ text: "、。", ...MINCHO, size: 32 }),
                    new TextRun({ text: "日本語", ...MINCHO }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "GR4c 日本", ...MINCHO }),
                    new TextRun({ text: "Latin words", size: 32 }),
                    new TextRun({ text: "日本語", ...MINCHO }),
                ],
            }),
        ],
        { grid: LINES_AND_CHARS },
    ),
    section("GR5", [new Paragraph({ children: [new TextRun({ text: "GR5 AVATAR Toyota WAVE Yo Te LT kerned text", kern: 2 })] })], {
        grid: LINES_AND_CHARS,
    }),
    section("GR6", [new Paragraph({ children: [new TextRun({ text: `GR6 ${JAPANESE.repeat(2)}`, ...MINCHO }), marker("CHARS_GR6")] })], {
        grid: SNAP,
    }),
    section(
        "GR7",
        [
            japanese(`GR7a Donau­dampf­schiff­fahrts`, 1),
            new Paragraph({ children: [floating(), new TextRun({ text: `GR7b ${JAPANESE.repeat(4)}`, ...MINCHO })] }),
        ],
        { grid: SNAP },
    ),
    section(
        "GR8",
        [
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun({ text: `GR8 ${"the survey of the coast was made ".repeat(6)}`, ...MINCHO })],
            }),
        ],
        { grid: SNAP },
    ),
    section("GR9", [japanese(`GR9 ${"lighthousekeeper".repeat(8)}`, 1)], { grid: SNAP }),
    section(
        "GR10",
        [
            new Paragraph({
                tabStops: [{ type: TabStopType.LEFT, position: 3000 }],
                children: [new TextRun({ text: "GR10a\t日本語のタブ", ...MINCHO })],
            }),
            new Paragraph({
                children: [new TextRun({ text: "GR10b 日本語", ...MINCHO }), picture(20, 20), new TextRun({ text: "の絵", ...MINCHO })],
            }),
        ],
        { grid: SNAP },
    ),
    section("GR11", [japanese("GR11", 3)], { grid: { type: DocumentGridType.LINES_AND_CHARS, charSpace: 210 } }),
    section("GR12", [japanese("GR12", 12)], {
        grid: SNAP,
        column: { count: 2, equalWidth: false, children: [new Column({ width: 2000, space: 500 }), new Column({ width: 6526 })] },
    }),
    section(
        "VD1",
        [
            new Paragraph({
                tabStops: [{ type: TabStopType.LEFT, position: 3000 }],
                children: [new TextRun({ text: "VD1a\t縦書きのタブ", ...MINCHO })],
            }),
            japanese("VD1b Donau­dampf", 1),
            new Paragraph({ children: [new TextRun({ text: "VD1c 縦", ...MINCHO }), picture(20, 20)] }),
            new Paragraph({ children: [floating(), new TextRun({ text: `VD1d ${JAPANESE.repeat(3)}`, ...MINCHO })] }),
        ],
        DOWN,
    ),
    section("VD2", [japanese("VD2a", 2, { font: { eastAsia: "MS PMincho", ascii: "Calibri" } }), japanese("VD2b ｶﾀｶﾅﾊﾝｶｸ", 1)], DOWN),
    section(
        "VD3",
        [
            new Paragraph({ children: [new TextRun({ text: "VD3a ", ...MINCHO }), new TextRun({ text: "囲み", ...MINCHO, border })] }),
            new Paragraph({ children: [new TextRun({ text: "VD3b 圏点", ...MINCHO, emphasisMark: { type: EmphasisMarkType.DOT } })] }),
            new Paragraph({
                children: [new TextRun({ text: "VD3c ", ...MINCHO }), new TextRun({ text: "上げ", ...MINCHO, position: "6pt" })],
            }),
            new Paragraph({
                children: [new TextRun({ text: "VD3d x", ...MINCHO }), new TextRun({ text: "2", ...MINCHO, superScript: true })],
            }),
            new Paragraph({ children: [new TextRun({ text: "VD3e small caps", ...MINCHO, smallCaps: true })] }),
        ],
        DOWN,
    ),
    section(
        "VD4",
        [
            new Paragraph({
                border: { top: border, bottom: border, left: border, right: border },
                children: [new TextRun({ text: `VD4 ${JAPANESE}`, ...MINCHO })],
            }),
        ],
        DOWN,
    ),
    section(
        "VD5",
        [
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun(`VD5 ${"the survey of the coast was made in the summer ".repeat(4)}`)],
            }),
        ],
        DOWN,
    ),
    section("VD6", [new Paragraph({ children: [new TextRun({ text: "VD6a 注", ...MINCHO }), footnote(japanese("VD6a note", 1))] })], DOWN),
    section(
        "VD7",
        [
            new Table({
                borders: ALL_BORDERS,
                width: { size: 4000, type: WidthType.DXA },
                columnWidths: [2000, 2000],
                rows: [new TableRow({ children: [cell("VD7 表"), cell("VD7 二")] })],
            }),
        ],
        DOWN,
    ),
    section("VD8a", [japanese("VD8a", 3)], { ...DOWN, page: { ...PAGE.page, margin: { ...PAGE.page.margin, gutter: 720 } } }),
    section("VD8b", [japanese("VD8b", 8)], { ...DOWN, column: { count: 2, space: 720 } }),
    section("VD8c", [japanese("VD8c", 3)], { ...DOWN, page: { ...PAGE.page, margin: { ...PAGE.page.margin, top: -1440 } } }),
    section("VD9", [japanese("VD9", 2)], DOWN),
    {
        properties: {
            page: { ...PAGE.page, textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT },
            type: SectionType.CONTINUOUS,
        },
        children: [japanese("VD9 after the break", 1)],
    },
    section("VD10", [japanese("VD10", 3)], { ...DOWN, grid: SNAP }),
    section("VD11", [japanese("VD11", 3)], DOWN, { footers: { default: new Footer({ children: [lines("VD11 footer", 5)] }) } }),
    section("VD12", [line("VD12 text running up the page in its section")], {
        textDirection: PageTextDirectionType.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
    }),
    section(
        "VD13",
        [
            new Paragraph({
                children: [new TextRun({ text: "VD13 平成", ...MINCHO }), marker("TCY"), new TextRun({ text: "年の記録", ...MINCHO })],
            }),
        ],
        { ...DOWN, footers: undefined },
        { footers: { default: new Footer({ children: [] }) } },
    ),
];

await write({
    name: "word-stops-east-asian",
    sections,
    injections: [
        softHyphens(),
        (parts) => {
            let text = parts.get("word/document.xml")!;
            // GR6: indented 1.5 characters
            const at = text.indexOf("@@CHARS_GR6@@");
            const start = text.lastIndexOf("<w:p>", at);
            text = text.slice(0, start) + text.slice(start).replace("<w:p>", '<w:p><w:pPr><w:ind w:leftChars="150" w:left="315"/></w:pPr>');
            text = text.replace(/<w:r><w:t xml:space="preserve">@@CHARS_GR6@@<\/w:t><\/w:r>/, "");
            // VD12: text running up the page
            const vd12 = text.indexOf("VD12 below");
            const sect = text.indexOf("<w:textDirection", vd12);
            text = text.slice(0, sect) + text.slice(sect).replace(/<w:textDirection w:val="[^"]*"\/>/, '<w:textDirection w:val="btLr"/>');
            parts.set("word/document.xml", text);
        },
        replaceMarkerRun(
            "TCY",
            '<w:r><w:rPr><w:rFonts w:eastAsia="MS Mincho"/><w:sz w:val="21"/><w:eastAsianLayout w:id="3" w:vert="1"/></w:rPr><w:t>31</w:t></w:r>',
        ),
    ],
});

// GR13 and VD6b: endnotes, at the end of a document of their own
await write({
    name: "word-stops-grid-endnotes",
    options: { endnotes: { 1: { children: [japanese("GR13 endnote", 1)] }, 2: { children: [japanese("VD6b endnote", 1)] } } } as object,
    sections: [
        section("GR13", [new Paragraph({ children: [new TextRun({ text: `GR13 ${JAPANESE}`, ...MINCHO }), new EndnoteReferenceRun(1)] })], {
            grid: LINES,
        }),
        section("VD6b", [new Paragraph({ children: [new TextRun({ text: "VD6b 注", ...MINCHO }), new EndnoteReferenceRun(2)] })], DOWN),
        section("GR13 last", [line("GR13 last section")]),
    ],
});

const KINSOKU = "記録ぁぃぅぇぉっゃゅょゎ記録ーー記録ゝゞ々記録ァィゥェォッャュョヮヵヶ記録".repeat(6);
await write({
    name: "word-stops-strict",
    sections: [section("EA1", [japanese(`EA1 ${KINSOKU}`, 1)])],
    injections: [settings("<w:strictFirstAndLastChars/>")],
});
const BRACKETS = "「測量」は（夏に）、『船』と【徒歩】で行われた。〔灯台〕から〈河口〉まで、続いた。".repeat(6);
await write({
    name: "word-stops-compress",
    sections: [section("EA2", [japanese(`EA2 ${BRACKETS}`, 1)])],
    injections: [settings('<w:characterSpacingControl w:val="compressPunctuation"/>')],
});
await write({
    name: "word-stops-compress-kana",
    sections: [section("EA3", [japanese(`EA3 ${BRACKETS}`, 1)])],
    injections: [settings('<w:characterSpacingControl w:val="compressPunctuationAndJapaneseKana"/>')],
});
