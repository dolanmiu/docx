/**
 * Probes of what `word-stops-compat-mode.ts`, `word-stops-thai-and-compat.ts` and `word-stops-pages.ts` left open, where
 * docx/layout still stops after following what they showed. Each probe starts a page, between a line above and a line
 * below it, in Calibri 11 on A4 with inch margins, unless it says. `word-stops.py` reads them all.
 *
 * word-stops-compat2-15.docx, -14 and -12: the same pages in compatibility modes 15 (the control), 14 and 12. Mode 11 laid
 * out as 12 in each of CM1 to CM22, so it isn't here.
 * CN1: a paragraph that ends with a page break (CN1a), and one with text after its page break (CN1b): where the text after
 *   the break and the next paragraph go ("a page break at the end of a paragraph in a document in compatibility mode")
 * CN2: prose kerned from 1 point with pairs Calibri kerns (CN2a), and with ligatures (w14:ligatures) on (CN2b), which the
 *   layout follows in compatibility mode as in mode 15 without having seen them there
 * CN3: a picture 30 points tall in a line of text, followed as in mode 15 without having been seen
 * CN4: prose distributed (CN4a), and Latin prose justified for Thai (CN4b) and with a low kashida (CN4c) ("a paragraph
 *   distributed, or justified for Thai or with a low kashida, in a document in compatibility mode")
 * CN5: text after tabs past the end of the line: a left stop at 9500 with prose after it (CN5a), a tab after a right stop at
 *   the margin (CN5b), centred and decimal stops at 9800 (CN5c, CN5d), and a left stop between a right indent of 720 and
 *   the margin (CN5e) ("a tab past the end of the line in a document in compatibility mode")
 * CN6: prose beside a picture 1 inch square with square wrapping, placed 1000, 1500, 2000 and 2500 twips from the margin
 *   with no distance from the text (CN6a to CN6d): the narrowest gap Word 2010 puts text in ("a line beside a drawing or
 *   frame in a gap narrower than 135 points, in a document in compatibility mode"; CM9 had 2700, CM14 1000 beside a frame)
 * CN7: prose beside a frame 3000 twips wide placed 2000 and 3000 twips from the margin (CN7a, CN7b)
 * CN8: tables of three columns given no widths, with a cell of 40 words: indented 720 (CN8a), half the width (CN8b),
 *   centred (CN8c), in a table cell (CN8d), and cells given widths of 2000 with a word of 2400 and no width of the table's
 *   own (CN8e) ("a table sized to its text in a table cell, indented or as a share of the width, in a document in
 *   compatibility mode", "a table widened for a long word, or its rows evened out, in a document in compatibility mode")
 * CN9: a floating table 3000 wide, 2000 from the margin, in prose aligned left ("a table that text flows around in a
 *   document in compatibility mode"; CM10's prose was justified)
 * CN10: Japanese prose in MS Mincho 10.5 (CN10a), Japanese with Latin words (CN10b), and Chinese in SimSun 10.5 (CN10c)
 *   ("East Asian text in a document in compatibility mode 12 or 11")
 * CN11: docx's text box of one line (CN11a) and three (CN11b) in a line of text ("a VML drawing in a document in
 *   compatibility mode 12 or 11": CM14's line was 14 twips higher in 12)
 *
 * word-stops-top-spacing2.docx, with `suppressTopSpacing` on, where Word's way with it hasn't been seen:
 * ST6: the first line of a page at least a height less than its text's: Calibri 11 at least 8 (ST6a) and 12 points (ST6b),
 *   Times New Roman 12 at least 10 (ST6c), Calibri 24 at least 20 (ST6d) and 28 (ST6e) (ST2a was Calibri 11 at least 10)
 * ST7: the first line of a page at 1.15, 1.5 and 2 lines (ST7a to ST7c)
 * ST8: a paragraph of 10 lines at exactly 30 points that goes on to the next page: its line at the top
 * ST9: a table at the top of a page whose cell's first line is at exactly 30 (ST9a), at least 30 (ST9b) and 2 lines (ST9c)
 * ST10: the first paragraph of a section on a new page with 12 points before it, at exactly 30
 * ST11: a paragraph with a border above it at the top of a page, at exactly 30
 * ST12: a line at exactly 30 after a page break in the paragraph before (ST4a meant to have one)
 * ST13: the first line of the document at exactly 30 (word-stops-top-spacing3.docx)
 * ST14: in word-stops-top-spacing3.docx, whose default font is Calibri 20: the first line of a page at exactly 40 points
 *   (ST14a) and at least 40 (ST14b), which show whether the 9.6 points Word keeps are the same with another default
 * ST15: a header whose first line is at exactly 30 points (word-stops-top-spacing3.docx)
 *
 * word-stops-booklet2.docx and word-stops-booklet3.docx: pages printed as a folded booklet (w:bookFoldPrinting, and
 *   w:bookFoldRevPrinting in 3), of 4 sheets, with 4 pages of prose (BK2, BK3), whose lines show how wide Word makes each
 *   page (BK1's lines were too short, and Word's PDF of it left out its first page)
 *
 * word-stops-divisions.docx: paragraphs in HTML divisions (w:divId), with the web settings' divisions
 * DV2a: three paragraphs in one division with margins of 720 left and right, 120 above and below, and borders
 * DV2b: a paragraph in a division with margins and no borders
 * DV2c: a paragraph in the bordered division with 12 points before and after it, after one with 12 points after it
 * DV2d: a paragraph in a division in a division (w:divsChild)
 *
 * word-stops-fe-layout2.docx, with useFELayout on: Japanese prose with no Latin in it (FE2a), Japanese with Latin words in
 *   a paragraph with a right indent of 1000 (FE2b), Chinese (FE2c), and FE1's Japanese with Latin words with both
 *   autoSpaceDE and autoSpaceDN off (FE2d; FE1b had only autoSpaceDN off), whose lines Word breaks otherwise than without it
 *
 * What Word showed, in the PDFs saved from Word 16 for Mac in round 25 (word-stops-top-spacing3 and word-stops-booklet3
 * weren't saved):
 *
 * - Modes 14 and 12 laid out CN1a, CN1b, CN2a, CN3, CN6a to CN6d, CN7a, CN7b and CN8c as mode 15 does: the paragraph after a
 *   page break at the top of the next page, gaps of 1000 to 2500 twips beside a picture and 2000 beside a frame filled
 * - CN2b: no ligatures without `enableOpenTypeFeatures`, its lines broken where mode 15's are
 * - CN4a to CN4c: distributed lines, and Latin justified for Thai and with a low kashida, not squeezed: broken as left-aligned
 * - CN5a to CN5e: each tab at its stop past the end of the line, and the rest of the paragraph on that line, past the margin
 *   and off the page: CN5a's line to 18827 twips, a default stop at 9360 after a right one at the margin, "centred" and
 *   "1234.56" lined up at 9800, and the text after a stop between a right indent and the margin to 13496
 * - CN8a: an indented table's text at its indent, its columns sized in what the indent leaves and the two margins beside it;
 *   CN8b: a table of half the width 4616 twips wide, 108 more than mode 15's; CN8d: a table in a cell sized as in mode 15,
 *   its borders at the cell's text; CN8e: a table widened for a long word as in mode 15
 * - CN9: a floating table 113 twips left of mode 15's, its text at 2000, and the text beside it in a gap of 1882 twips
 * - CN10a to CN10c: modes 14 and 15 alike; in 12, East Asian text in no language broken only at its spaces, a run longer than
 *   a line after its last character that fits, with no characters kept from starting or ending a line
 * - CN11a, CN11b: in 12, the text box as large and in the same place, its line 0.72 points shorter and "after" 0.72 points
 *   nearer: no room for its outline
 * - ST6a to ST6e: at least a height X, X less 9.6 points left out, if more than none, whether the line is taller or shorter;
 *   ST7: multiple spacing as it is; ST8: a paragraph's later line at the top of the next page cut as its first; ST9a to
 *   ST9c: a table's cells as they are; ST10: cut below the space before a section's first paragraph; ST11: below a border
 *   above, as it is; ST12: after a page break in the paragraph before, cut
 * - BK2: each page laid out as the section's A4 page, two to a sheet in the booklet's order
 * - DV2a, DV2b, DV2d: text indented by the margins, added up for a division in another, with the margin, border and its space
 *   above the division and below it once; DV2c: with space before and after of its own, 240 twips above and below it, and
 *   no border drawn above or below
 * - FE2a, FE2c, FE2d: lines as without `useFELayout`; FE2b: 52.5 twips, a quarter of 10.5 points, between East Asian text
 *   and Latin letters and digits beside it
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-compat2.ts [folder]
 */
import {
    AlignmentType,
    Header,
    LineRuleType,
    PageBreak,
    Paragraph,
    SectionType,
    Table,
    TableAnchorType,
    TableRow,
    TabStopType,
    TextRun,
    Textbox,
    WidthType,
    BorderStyle,
    FrameAnchorType,
} from "docx";

import {
    ALL_BORDERS,
    type Child,
    type Injection,
    PAGE,
    cell,
    fill,
    injectIntoParagraph,
    line,
    marker,
    para,
    picture,
    probe,
    prose,
    replaceText,
    settings,
    write,
} from "./kit";

// A picture placed on the page with square wrapping, at a distance from the margin in twips, with no distance from the text
const floatPicture =
    (name: string, offset: number): Injection =>
    (parts) => {
        const text = parts.get("word/document.xml")!;
        const at = text.indexOf(`${name} anchor `);
        const start = at < 0 ? -1 : text.indexOf("<wp:inline", at);
        // Not another probe's picture, where this one isn't in the document (ONLY), which leaves it out
        if (start < 0) {
            throw new Error(`No picture after ${name} anchor in word/document.xml`);
        }
        const end = text.indexOf("</wp:inline>", start) + "</wp:inline>".length;
        const inline = text.slice(start, end);
        const extent = inline.match(/<wp:extent [^>]*\/>/)![0];
        const inner = inline.slice(inline.indexOf("<wp:docPr"), inline.lastIndexOf("</wp:inline>"));
        const anchor =
            `<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
            `<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>${offset * 635}</wp:posOffset></wp:positionH>` +
            `<wp:positionV relativeFrom="paragraph"><wp:posOffset>0</wp:posOffset></wp:positionV>${extent}<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
            `<wp:wrapSquare wrapText="bothSides"/>${inner.replace(/<wp:effectExtent [^>]*\/>/, "")}</wp:anchor>`;
        parts.set("word/document.xml", text.slice(0, start) + anchor + text.slice(end));
    };

const JAPANESE = "日本語の文章、句読点。「かぎ括弧」と（丸括弧）を含む。";
const CHINESE = "中文的句子，标点符号。“引号”和（括号）都在其中。";
const MINCHO = { font: { eastAsia: "MS Mincho", ascii: "MS Mincho" }, size: 21 };

const compatPages = (): Child[] => [
    ...probe("CN1a", [new Paragraph({ children: [new TextRun("CN1a before the break"), new PageBreak()] }), line("CN1a next")]),
    ...probe("CN1b", [
        new Paragraph({ children: [new TextRun("CN1b before the break"), new PageBreak(), new TextRun("CN1b after the break")] }),
        line("CN1b next"),
    ]),
    ...probe("CN2a", [para("CN2a AVATAR Wave To Yo", 120, {}, { kern: 2 })]),
    ...probe("CN2b", [para("CN2b office offline afflict", 120)]),
    ...probe("CN3", [
        new Paragraph({ children: [new TextRun("CN3 before "), picture(30), new TextRun(` after ${prose(30)}`)] }),
        para("CN3 next", 20),
    ]),
    ...probe("CN4a", [para("CN4a", 120, { alignment: AlignmentType.DISTRIBUTE })]),
    ...probe("CN4b", [para("CN4b", 120, { alignment: AlignmentType.THAI_DISTRIBUTE })]),
    ...probe("CN4c", [para("CN4c", 120, { alignment: AlignmentType.LOW_KASHIDA })]),
    ...probe("CN5", [
        new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 9500 }], children: [new TextRun(`CN5a\tpast ${prose(20)}`)] }),
        new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [new TextRun("CN5b\tright\tdefault")] }),
        new Paragraph({ tabStops: [{ type: TabStopType.CENTER, position: 9800 }], children: [new TextRun("CN5c\tcentred")] }),
        new Paragraph({ tabStops: [{ type: TabStopType.DECIMAL, position: 9800 }], children: [new TextRun("CN5d\t1234.56")] }),
        new Paragraph({
            indent: { right: 720 },
            tabStops: [{ type: TabStopType.LEFT, position: 8800 }],
            children: [new TextRun(`CN5e\tindent ${prose(10)}`)],
        }),
    ]),
    ...(["a", "b", "c", "d"] as const).flatMap((letter) =>
        probe(`CN6${letter}`, [new Paragraph({ children: [new TextRun(`CN6${letter} anchor ${prose(150)}`), picture(72)] })]),
    ),
    ...[2000, 3000].flatMap((x, index) =>
        probe(`CN7${"ab"[index]}`, [
            new Paragraph({
                frame: {
                    type: "absolute",
                    position: { x, y: 600 },
                    width: 3000,
                    height: 1000,
                    anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.TEXT },
                },
                children: [new TextRun(`CN7${"ab"[index]} frame`)],
            }),
            para(`CN7${"ab"[index]} beside`, 200),
        ]),
    ),
    ...(
        [
            ["CN8a", { indent: { size: 720, type: WidthType.DXA } }],
            ["CN8b", { width: { size: 50, type: WidthType.PERCENTAGE } }],
            ["CN8c", { alignment: AlignmentType.CENTER }],
        ] as const
    ).flatMap(([name, options]) =>
        probe(name, [
            new Table({
                borders: ALL_BORDERS,
                ...options,
                rows: [new TableRow({ children: [cell(`${name} a`), cell(`${name} lighthousekeeper`), cell(`${name} ${prose(40)}`)] })],
            }),
        ]),
    ),
    ...probe("CN8d", [
        new Table({
            borders: ALL_BORDERS,
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            rows: [
                new TableRow({
                    children: [
                        cell([
                            line("CN8d outer"),
                            new Table({
                                borders: ALL_BORDERS,
                                rows: [
                                    new TableRow({ children: [cell("CN8d a"), cell("CN8d lighthousekeeper"), cell(`CN8d ${prose(40)}`)] }),
                                ],
                            }),
                            line("CN8d outer after"),
                        ]),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("CN8e", [
        new Table({
            borders: ALL_BORDERS,
            columnWidths: [2000, 2000, 2000],
            rows: [
                new TableRow({
                    children: [
                        cell("CN8e lighthousekeepersurveyors", { width: { size: 2000, type: WidthType.DXA } }),
                        cell(`CN8e ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                        cell(`CN8e ${prose(20)}`, { width: { size: 2000, type: WidthType.DXA } }),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("CN9", [
        para("CN9", 30),
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
                (row) => new TableRow({ children: [cell(`CN9 row ${row}`, { width: { size: 3000, type: WidthType.DXA } })] }),
            ),
        }),
        para("CN9 after", 150),
    ]),
    ...probe("CN10a", [line(`CN10a ${JAPANESE.repeat(8)}`, {}, MINCHO)]),
    ...probe("CN10b", [line(`CN10b ${"日本語の文章にLatin wordsと数字123を含む。".repeat(8)}`, {}, MINCHO)]),
    ...probe("CN10c", [line(`CN10c ${CHINESE.repeat(8)}`, {}, { font: { eastAsia: "SimSun", ascii: "SimSun" }, size: 21 })]),
    ...probe("CN11a", [
        new Paragraph({
            children: [
                new TextRun("CN11a box "),
                new Textbox({ style: { width: "200pt", height: "auto" }, children: [line("CN11a in the box")] }),
                new TextRun(" after"),
            ],
        }),
        para("CN11a next", 20),
    ]),
    ...probe("CN11b", [
        new Paragraph({
            children: [
                new TextRun("CN11b box "),
                new Textbox({
                    style: { width: "200pt", height: "auto" },
                    children: [line("CN11b in the box 1"), line("CN11b in the box 2"), line("CN11b in the box 3")],
                }),
                new TextRun(" after"),
            ],
        }),
        para("CN11b next", 20),
    ]),
];

for (const mode of [15, 14, 12]) {
    await write({
        name: `word-stops-compat2-${mode}`,
        options: { compatibility: { version: mode } },
        sections: [{ properties: PAGE, children: [line(`CN mode ${mode}`), ...compatPages()] }],
        injections: [
            ...(["a", "b", "c", "d"] as const).map((letter, index) => floatPicture(`CN6${letter}`, 1000 + 500 * index)),
            replaceText(
                '<w:r><w:t xml:space="preserve">CN2b ',
                '<w:r><w:rPr><w14:ligatures w14:val="standard"/></w:rPr><w:t xml:space="preserve">CN2b ',
            ),
        ],
    });
}

const exact = (points: number) => ({ spacing: { line: points * 20, lineRule: LineRuleType.EXACT } });
const atLeast = (points: number) => ({ spacing: { line: points * 20, lineRule: LineRuleType.AT_LEAST } });
const multiple = (lines: number) => ({ spacing: { line: Math.round(lines * 240), lineRule: LineRuleType.AUTO } });
const topLine = (name: string, spacing: object, run: object = {}, extra: object = {}): Paragraph =>
    new Paragraph({ pageBreakBefore: true, ...spacing, ...extra, children: [new TextRun({ text: `${name} first ${prose(24)}`, ...run })] });
const after = (name: string): Paragraph[] => [line(`${name} next 1`), line(`${name} next 2`), line(`${name} below`)];
const topProbe = (name: string, spacing: object, run: object = {}, extra: object = {}): Child[] => [
    line(`${name} above`),
    topLine(name, spacing, run, extra),
    ...after(name),
];

await write({
    name: "word-stops-top-spacing2",
    options: { compatibility: { suppressTopSpacing: true } },
    sections: [
        {
            properties: PAGE,
            children: [
                ...topProbe("ST6a", atLeast(8)),
                ...topProbe("ST6b", atLeast(12)),
                ...topProbe("ST6c", atLeast(10), { font: "Times New Roman", size: 24 }),
                ...topProbe("ST6d", atLeast(20), { size: 48 }),
                ...topProbe("ST6e", atLeast(28), { size: 48 }),
                ...topProbe("ST7a", multiple(1.15)),
                ...topProbe("ST7b", multiple(1.5)),
                ...topProbe("ST7c", multiple(2)),
                ...probe("ST8", [...fill("ST8", 40), new Paragraph({ ...exact(30), children: [new TextRun(`ST8 exact ${prose(150)}`)] })]),
                ...[exact(30), atLeast(30), multiple(2)].flatMap((spacing, index) => [
                    // The page break at the end of the paragraph above leaves its mark on its line, so the table starts the page
                    new Paragraph({ children: [new TextRun(`ST9${"abc"[index]} above`), new PageBreak()] }),
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        rows: [
                            new TableRow({
                                children: [
                                    cell([new Paragraph({ ...spacing, children: [new TextRun(`ST9${"abc"[index]} first ${prose(24)}`)] })]),
                                ],
                            }),
                        ],
                    }),
                    ...after(`ST9${"abc"[index]}`),
                ]),
                ...topProbe("ST11", exact(30), {}, { border: { top: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "000000" } } }),
                line("ST12 above"),
                new Paragraph({ children: [new TextRun("ST12 break"), new PageBreak()] }),
                new Paragraph({ ...exact(30), children: [new TextRun(`ST12 first ${prose(24)}`)] }),
                ...after("ST12"),
                line("ST10 above"),
            ],
        },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [
                new Paragraph({
                    spacing: { before: 240, line: 600, lineRule: LineRuleType.EXACT },
                    children: [new TextRun(`ST10 first ${prose(24)}`)],
                }),
                ...after("ST10"),
            ],
        },
    ],
});

await write({
    name: "word-stops-top-spacing3",
    size: 40,
    options: { compatibility: { suppressTopSpacing: true } },
    sections: [
        {
            properties: PAGE,
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({ ...exact(30), children: [new TextRun({ text: "ST15 header first", size: 22 })] }),
                        line("ST15 header next", {}, { size: 22 }),
                    ],
                }),
            },
            children: [
                new Paragraph({ ...exact(30), children: [new TextRun({ text: `ST13 first ${prose(24)}`, size: 22 })] }),
                ...[line("ST13 next 1", {}, { size: 22 }), line("ST13 below", {}, { size: 22 }), line("ST13 above", {}, { size: 22 })],
                ...topProbe("ST14a", exact(40)),
                ...topProbe("ST14b", atLeast(40)),
                // The header's lines are ST15's, on each page
                line("ST15 above"),
                line("ST15 below"),
            ],
        },
    ],
});

const booklet = (name: string, probeName: string, ...xml: readonly string[]): Promise<string> =>
    write({
        name,
        sections: [
            {
                properties: PAGE,
                children: [
                    line(`${probeName} above`),
                    ...Array.from({ length: 28 }, (_, index) => para(`${probeName} p${index + 1}`, 120)),
                ],
            },
        ],
        injections: [settings(...xml)],
    });
await booklet("word-stops-booklet2", "BK2", "<w:bookFoldPrinting/>", '<w:bookFoldPrintingSheets w:val="4"/>');
await booklet("word-stops-booklet3", "BK3", "<w:bookFoldRevPrinting/>", '<w:bookFoldPrintingSheets w:val="4"/>');

// The divisions: 1001 with margins and borders, 1002 with margins only, and 1003 inside 1002
const BORDER = 'w:val="single" w:sz="12" w:space="4" w:color="000000"';
const MARGINS = '<w:marLeft w:val="720"/><w:marRight w:val="720"/><w:marTop w:val="120"/><w:marBottom w:val="120"/>';
const WEB_SETTINGS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:divs>' +
    `<w:div w:id="1001">${MARGINS}<w:divBdr><w:top ${BORDER}/><w:left ${BORDER}/><w:bottom ${BORDER}/><w:right ${BORDER}/></w:divBdr></w:div>` +
    `<w:div w:id="1002">${MARGINS}<w:divsChild><w:div w:id="1003">${MARGINS}</w:div></w:divsChild></w:div>` +
    "</w:divs></w:webSettings>";
// Each paragraph in a division, by a marker of its own, which the division's id takes the place of in its properties
const divisions: Injection[] = [];
const inDivision = (text: string, id: number, options: object = {}): Paragraph => {
    const name = `DIV${divisions.length + 1}`;
    divisions.push(injectIntoParagraph(name, { pPr: `<w:divId w:val="${id}"/>` }));
    return new Paragraph({ ...options, children: [new TextRun(text), marker(name)] });
};
await write({
    name: "word-stops-divisions",
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe(
                    "DV2a",
                    [1, 2, 3].map((index) => inDivision(`DV2a p${index} ${prose(60)}`, 1001)),
                ),
                ...probe("DV2b", [inDivision(`DV2b ${prose(60)}`, 1002)]),
                ...probe("DV2c", [
                    para("DV2c before", 20, { spacing: { after: 240 } }),
                    inDivision(`DV2c ${prose(60)}`, 1001, { spacing: { before: 240, after: 240 } }),
                ]),
                ...probe("DV2d", [inDivision(`DV2d ${prose(60)}`, 1003)]),
            ],
        },
    ],
    injections: [
        ...divisions,
        (parts) => {
            parts.set("word/webSettings.xml", WEB_SETTINGS);
            const rels = parts.get("word/_rels/document.xml.rels")!;
            parts.set(
                "word/_rels/document.xml.rels",
                rels.replace(
                    "</Relationships>",
                    '<Relationship Id="rIdStopsWeb" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/></Relationships>',
                ),
            );
            const types = parts.get("[Content_Types].xml")!;
            parts.set(
                "[Content_Types].xml",
                types.replace(
                    "</Types>",
                    '<Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/></Types>',
                ),
            );
        },
    ],
});

await write({
    name: "word-stops-fe-layout2",
    options: { compatibility: { useFELayout: true } },
    injections: [injectIntoParagraph("FE2d", { pPr: '<w:autoSpaceDE w:val="0"/><w:autoSpaceDN w:val="0"/>' })],
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("FE2a", [line(`FE2a ${JAPANESE.repeat(8)}`, {}, MINCHO)]),
                ...probe("FE2b", [
                    line(`FE2b ${"日本語の文章にLatin wordsと数字123を含む。".repeat(8)}`, { indent: { right: 1000 } }, MINCHO),
                ]),
                ...probe("FE2c", [line(`FE2c ${CHINESE.repeat(8)}`, {}, { font: { eastAsia: "SimSun", ascii: "SimSun" }, size: 21 })]),
                // Both of the paragraph's East Asian auto spacings off, written in its properties in the schema's order
                ...probe("FE2d", [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `FE2d ${"日本語の文章にLatin wordsと数字123を含む。測量は夏に行われた。".repeat(6)}`,
                                ...MINCHO,
                            }),
                            marker("FE2d"),
                        ],
                    }),
                ]),
            ],
        },
    ],
});
