/**
 * Probes of a document in compatibility mode (`w:compatSetting` compatibilityMode under 15), where docx/layout stops at
 * the start: "a document in compatibility mode". Word lays such a document out as Word 2010 (14), Word 2007 (12) or Word
 * 2003 (11) did, in ways not written down. Two of the Word templates in demo/assets are in mode 12 (field-trip.docx,
 * simple-template-3.docx), and so are the demos that patch them (templates/field-trip-form, templates/keep-original-styles).
 *
 * The same pages are written four times: word-stops-compat-15.docx, the control, which docx/layout lays out; and
 * word-stops-compat-14, -12 and -11, the same in compatibility modes 14, 12 and 11. Where a page of 14, 12 or 11 is
 * Word's page of 15, line for line, the layout can lay that part of an older mode's document out as it does mode 15; where
 * it differs, the page shows what to follow. This is a first round: it finds which parts differ, and a part that does
 * may need a round of its own to settle how.
 *
 * Each probe starts a page, between a line above and a line below it. Calibri 11 on A4 with inch margins, unless it says.
 *
 * CM1: 300 words of prose left-aligned, then 200 justified
 * CM2: Times New Roman 12, three paragraphs with 10 points after and 1.15 lines
 * CM3: Heading 1, 2 and 3 of docx's styles over prose
 * CM4: a table given no widths, of three columns with words of different lengths and a cell of 40 words
 * CM5: a table of fixed widths 2000, 3000 and 4026, single borders, cell margins of 100, a word of 2400 in the first cell
 * CM6: a numbered list of 12 items, and a bulleted list of 3 levels, with hanging indents
 * CM7: two footnotes on a page, the second of 30 lines, which goes on to the next page
 * CM8: two columns of 30 lines, then a continuous section break and a line across the page
 * CM9: a picture 1.5 inches square floating with square wrapping at 2 inches from the margin, in justified prose
 * CM10: a floating table, square wrapping, in justified prose
 * CM11: a table of a header row and 40 rows of two lines, after 30 lines, so it breaks across pages
 * CM12: tabs: right, centred and decimal stops, a dotted leader, and a tab past the margin
 * CM13: a heading kept with the next on the last line of a page, and a paragraph whose last line would be alone on the next
 * CM14: docx's text box (VML) in a line, and a frame with text beside it
 * CM15: lines of exact 30 points and at least 30 points at the top of a page
 * CM16: four paragraphs with contextual spacing and 12 points before and after, in a table cell
 * CM17: paragraphs with borders 4 points from their text, three in a box
 * CM18: Japanese prose with punctuation, in MS Mincho 10.5
 * CM19: a line of Calibri 11 with words in Courier New 14 and Cambria 20
 * CM20: superscript and subscript in a line, and raised text
 * CM21: a word longer than a line
 * CM22: empty paragraphs whose marks are 24 points
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-compat-mode.ts [folder]
 */
import {
    AlignmentType,
    BorderStyle,
    FootnoteReferenceRun,
    FrameAnchorType,
    HeadingLevel,
    LevelFormat,
    LineRuleType,
    Paragraph,
    SectionType,
    Table,
    TableAnchorType,
    TableRow,
    TabStopType,
    TextRun,
    Textbox,
    WidthType,
} from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, line, para, picture, probe, prose, write } from "./kit";

const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED };

const pages = (
    mode: number,
): { children: Child[]; footnotes: Record<number, { children: Paragraph[] }>; columns: Child[]; after: Child[] } => {
    const footnotes: Record<number, { children: Paragraph[] }> = {
        1: { children: [line("CM7 note 1")] },
        2: { children: Array.from({ length: 30 }, (_, index) => line(`CM7 note 2 line ${index + 1}`)) },
    };
    const children: Child[] = [
        line(`CM mode ${mode}`),
        ...probe("CM1", [para("CM1", 300), para("CM1 justified", 200, JUSTIFIED)]),
        ...probe(
            "CM2",
            [1, 2, 3].map((index) =>
                para(`CM2 p${index}`, 80, { spacing: { after: 200, line: 276 } }, { font: "Times New Roman", size: 24 }),
            ),
        ),
        ...probe("CM3", [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("CM3 heading 1")] }),
            para("CM3 a", 60),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("CM3 heading 2")] }),
            para("CM3 b", 60),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("CM3 heading 3")] }),
            para("CM3 c", 60),
        ]),
        ...probe("CM4", [
            new Table({
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({ children: [cell("CM4 a"), cell("CM4 lighthousekeeper"), cell(`CM4 ${prose(40)}`)] }),
                    new TableRow({ children: [cell("CM4 short words here"), cell("CM4 b"), cell("CM4 c")] }),
                ],
            }),
        ]),
        ...probe("CM5", [
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [2000, 3000, 4026],
                borders: ALL_BORDERS,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                rows: [
                    new TableRow({
                        children: [
                            cell("CM5 lighthousekeepersurveyors", { width: { size: 2000, type: WidthType.DXA } }),
                            cell(`CM5 ${prose(20)}`, { width: { size: 3000, type: WidthType.DXA } }),
                            cell(`CM5 ${prose(30)}`, { width: { size: 4026, type: WidthType.DXA } }),
                        ],
                    }),
                ],
            }),
        ]),
        ...probe("CM6", [
            ...Array.from(
                { length: 12 },
                (_, index) =>
                    new Paragraph({
                        numbering: { reference: "numbers", level: 0 },
                        children: [new TextRun(`CM6 item ${index + 1} ${prose(12)}`)],
                    }),
            ),
            ...[0, 1, 2, 1, 0].map(
                (level, index) =>
                    new Paragraph({
                        numbering: { reference: "bullets", level },
                        children: [new TextRun(`CM6 bullet ${index + 1} ${prose(20)}`)],
                    }),
            ),
        ]),
        ...probe("CM7", [
            ...fill("CM7", 20),
            new Paragraph({ children: [new TextRun("CM7 first reference"), new FootnoteReferenceRun(1)] }),
            ...fill("CM7 more", 15),
            new Paragraph({ children: [new TextRun("CM7 second reference"), new FootnoteReferenceRun(2)] }),
            ...fill("CM7 after", 10),
        ]),
    ];
    const columns: Child[] = [...probe("CM8", fill("CM8", 30), { below: false })];
    const after: Child[] = [
        line("CM8 below"),
        ...probe("CM9", [
            para("CM9", 30, JUSTIFIED),
            new Paragraph({
                ...JUSTIFIED,
                // A picture floating 2 inches from the margin, square wrapping (see the injection below)
                children: [new TextRun(`CM9 anchor ${prose(150)}`), picture(108, 108)],
            }),
        ]),
        ...probe("CM10", [
            para("CM10", 30, JUSTIFIED),
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                borders: ALL_BORDERS,
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    absoluteHorizontalPosition: 2000,
                    verticalAnchor: TableAnchorType.TEXT,
                    absoluteVerticalPosition: 500,
                },
                rows: [1, 2, 3].map(
                    (row) => new TableRow({ children: [cell(`CM10 row ${row}`, { width: { size: 3000, type: WidthType.DXA } })] }),
                ),
            }),
            para("CM10 after", 150, JUSTIFIED),
        ]),
        ...probe("CM11", [
            ...fill("CM11", 30),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({ tableHeader: true, children: [cell("CM11 head left"), cell("CM11 head right")] }),
                    ...Array.from(
                        { length: 40 },
                        (_, index) =>
                            new TableRow({
                                children: [cell(`CM11 r${index + 1} a\nCM11 r${index + 1} b`), cell(`CM11 r${index + 1} right`)],
                            }),
                    ),
                ],
            }),
        ]),
        ...probe("CM12", [
            new Paragraph({
                tabStops: [
                    { type: TabStopType.RIGHT, position: 9026 },
                    { type: TabStopType.CENTER, position: 4513 },
                ],
                children: [new TextRun("CM12a\tcentre\tright")],
            }),
            new Paragraph({ tabStops: [{ type: TabStopType.DECIMAL, position: 4000 }], children: [new TextRun("CM12b\t1234.56")] }),
            new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9026, leader: "dot" }],
                children: [new TextRun("CM12c leader\t99")],
            }),
            new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 9500 }], children: [new TextRun("CM12d\tpast")] }),
        ]),
        ...probe("CM13", [
            ...fill("CM13", 48),
            new Paragraph({ keepNext: true, children: [new TextRun("CM13 heading kept")] }),
            para("CM13 after heading", 60),
            ...fill("CM13 more", 40),
            para("CM13 widow", 40),
        ]),
        ...probe("CM14", [
            new Paragraph({
                children: [
                    new TextRun("CM14 box "),
                    new Textbox({ style: { width: "200pt", height: "auto" }, children: [line("CM14 in the box")] }),
                    new TextRun(" after"),
                ],
            }),
            new Paragraph({
                frame: {
                    type: "absolute",
                    position: { x: 1000, y: 3000 },
                    width: 3000,
                    height: 1000,
                    anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN },
                },
                children: [new TextRun("CM14 frame")],
            }),
            para("CM14 after frame", 200, JUSTIFIED),
        ]),
        ...probe("CM15", [
            new Paragraph({
                pageBreakBefore: true,
                spacing: { line: 600, lineRule: LineRuleType.EXACT },
                children: [new TextRun(`CM15a ${prose(30)}`)],
            }),
            new Paragraph({ spacing: { line: 600, lineRule: LineRuleType.AT_LEAST }, children: [new TextRun(`CM15b ${prose(30)}`)] }),
        ]),
        ...probe("CM16", [
            new Table({
                borders: ALL_BORDERS,
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                rows: [
                    new TableRow({
                        children: [
                            cell(
                                [1, 2, 3, 4].map((index) =>
                                    line(`CM16 para ${index}`, { contextualSpacing: true, spacing: { before: 240, after: 240 } }),
                                ),
                            ),
                        ],
                    }),
                ],
            }),
        ]),
        ...probe("CM17", [
            ...[1, 2, 3].map(
                (index) =>
                    new Paragraph({
                        border: Object.fromEntries(
                            ["top", "bottom", "left", "right"].map((side) => [
                                side,
                                { style: BorderStyle.SINGLE, size: 4, space: 4, color: "000000" },
                            ]),
                        ),
                        children: [new TextRun(`CM17 boxed ${index} ${prose(20)}`)],
                    }),
            ),
        ]),
        ...probe("CM18", [
            line(
                `CM18 ${"日本語の文章、句読点。「かぎ括弧」と（丸括弧）を含む。".repeat(8)}`,
                {},
                { font: { eastAsia: "MS Mincho", ascii: "MS Mincho" }, size: 21 },
            ),
        ]),
        ...probe("CM19", [
            new Paragraph({
                children: [
                    new TextRun("CM19 calibri "),
                    new TextRun({ text: "courier ", font: "Courier New", size: 28 }),
                    new TextRun({ text: "cambria", font: "Cambria", size: 40 }),
                    new TextRun(` ${prose(20)}`),
                ],
            }),
            para("CM19 next", 20),
        ]),
        ...probe("CM20", [
            new Paragraph({
                children: [
                    new TextRun("CM20 x"),
                    new TextRun({ text: "2", superScript: true }),
                    new TextRun(" and H"),
                    new TextRun({ text: "2", subScript: true }),
                    new TextRun("O and "),
                    new TextRun({ text: "raised", position: "6pt" }),
                    new TextRun(` ${prose(20)}`),
                ],
            }),
            para("CM20 next", 20),
        ]),
        ...probe("CM21", [line(`CM21 ${"lighthousekeeper".repeat(12)} end`)]),
        ...probe("CM22", [1, 2, 3].map(() => new Paragraph({ run: { size: 48 }, children: [] })).concat([line("CM22 after")])),
    ];
    return { children, footnotes, columns, after };
};

for (const mode of [15, 14, 12, 11]) {
    const { children, footnotes, columns, after } = pages(mode);
    await write({
        name: `word-stops-compat-${mode}`,
        options: {
            compatibility: { version: mode },
            footnotes,
            numbering: {
                config: [
                    {
                        reference: "numbers",
                        levels: [
                            {
                                level: 0,
                                format: LevelFormat.DECIMAL,
                                text: "%1.",
                                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                            },
                        ],
                    },
                    {
                        reference: "bullets",
                        levels: [0, 1, 2].map((level) => ({
                            level,
                            format: LevelFormat.BULLET,
                            text: ["●", "○", "■"][level],
                            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
                        })),
                    },
                ],
            },
        },
        sections: [
            { properties: PAGE, children },
            { properties: { ...PAGE, column: { count: 2, space: 720 } }, children: columns },
            { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: after },
        ],
        injections: [
            // CM9's picture floats: square wrapping, 2 inches from the margin, 0.2 inches below its paragraph's top
            (parts) => {
                const text = parts.get("word/document.xml")!;
                const at = text.indexOf("CM9 anchor ");
                const start = at < 0 ? -1 : text.indexOf("<wp:inline", at);
                // Not another probe's picture, where CM9 isn't in the document (ONLY), which leaves this out
                if (start < 0) {
                    throw new Error("No picture after CM9 anchor in word/document.xml");
                }
                const end = text.indexOf("</wp:inline>", start) + "</wp:inline>".length;
                const inline = text.slice(start, end);
                const extent = inline.match(/<wp:extent [^>]*\/>/)![0];
                const inner = inline.slice(inline.indexOf("<wp:docPr"), inline.lastIndexOf("</wp:inline>"));
                const anchor =
                    `<wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
                    `<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>1828800</wp:posOffset></wp:positionH>` +
                    `<wp:positionV relativeFrom="paragraph"><wp:posOffset>182880</wp:posOffset></wp:positionV>${extent}<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
                    `<wp:wrapSquare wrapText="bothSides"/>${inner.replace(/<wp:effectExtent [^>]*\/>/, "")}</wp:anchor>`;
                parts.set("word/document.xml", text.slice(0, start) + anchor + text.slice(end));
            },
        ],
    });
}
