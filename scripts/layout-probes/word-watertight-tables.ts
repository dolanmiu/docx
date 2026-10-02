/**
 * Probes of how Word lays out tables where docx/layout reads nothing or guesses, for the watertight inventory. Each probe
 * starts a page, and each line's text names its probe, so the lines can be found in a PDF saved from Word with
 * pdftotext -bbox-layout, which word-watertight.py reads. Calibri 11 on A4 with 1440 margins. Normal has 200 after and
 * 1.5 lines (360) and 11 points of its own, as a template's Normal can, so every paragraph outside TB1 gives its spacing
 * itself: none before or after, single.
 *
 * TB1: the paragraphs of a table whose style has none after, single spacing and 9 points: in Normal, Normal named, a
 *      style of their own, with spacing of their own, in a table without a style, and with only the style's size
 * TB2: borders that only the table's style has: whether they make rows taller, as the table's own do
 * TB3: borders of the cells (`w:tcBorders`) and not the table: whether they make rows taller
 * TB4: space between cells (`w:tblCellSpacing`): how much taller rows are, and how much narrower the text
 * TB5: rows whose paragraphs are kept with the next (`keepNext`): whether the row is kept with the next row, when all of
 *      its paragraphs are, one of them, or one row
 * TB6: text that runs down a cell (`w:textDirection` btLr and tbRl): how tall the row is
 * TB7: an empty cell with a 28-point paragraph mark, with `w:hideMark` and without
 * TB8: a table style's first row (`w:tblStylePr`) of 16 points, with `w:tblLook` firstRow on and off
 * TB9: a table sized to its text, indented 2000 twips (`w:tblInd`), against none: how wide it is
 * TB10: rows hidden (`w:trPr/w:hidden`): whether they take room
 * TB11: a floating table (`w:tblpPr`): whether the text after it goes beside it
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    BorderStyle,
    Document,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    Table,
    TableAnchorType,
    TableBorders,
    TableCell,
    TableRow,
    TextDirection,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

// Calibri 11's lines in Word, in twips
const LINE = (2500 / 2048) * 220;
const TOP = 1440;
const BOTTOM = 16838 - 1440;
const WIDTH = 9026;

// The spacing of every paragraph outside TB1, which Normal's would change
const SINGLE = { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } as const;
const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { ...SINGLE, ...options.spacing }, children: [new TextRun(text)] });

/** The first lines of a probe, which put what follows them `at` twips down the page, as word-line-heights.ts has them */
const lead = (probe: string, at: number): Paragraph[] => {
    const count = Math.floor((at - TOP) / LINE);
    const after = Math.round(at - TOP - count * LINE);
    return Array.from({ length: count }, (_, i) =>
        line(i === 0 ? `${probe} top` : `${probe} fill ${i}`, i === count - 1 ? { spacing: { after } } : {}),
    );
};

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

type TableOptions = Partial<ConstructorParameters<typeof Table>[0]>;
/** A table of rows of cells of these paragraphs, the width of the page, without borders or cell margins unless given */
const table = (
    rows: readonly (readonly Paragraph[][])[],
    options: TableOptions = {},
    cell: Partial<ConstructorParameters<typeof TableCell>[0]> = {},
): Table => {
    const width = Math.floor(WIDTH / rows[0].length);
    return new Table({
        width: { size: width * rows[0].length, type: WidthType.DXA },
        columnWidths: rows[0].map(() => width),
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (cells) =>
                new TableRow({
                    children: cells.map((children) => new TableCell({ width: { size: width, type: WidthType.DXA }, ...cell, children })),
                }),
        ),
        ...options,
    });
};
const borders = (size: number) => {
    const border = { style: BorderStyle.SINGLE, size, color: "000000" };
    return { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
};

/** A table probe on a page of its own: a line above it, the table, and a line below it */
const around = (probe: string, ...tables: (Table | Paragraph)[]): ISectionOptions => ({
    children: [line(`${probe} above`), ...tables, line(`${probe} below`)],
});

/** TB1: a table of one cell of 10 one-line paragraphs, made by `make` */
const tb1 = (probe: string, make: (text: string) => Paragraph, style?: string): ISectionOptions =>
    around(probe, table([[Array.from({ length: 10 }, (_, i) => make(`${probe} para ${i + 1}`))]], style === undefined ? {} : { style }));

/** TB5: 10 rows of `cells` one-line cells, of which row 6 is the first that doesn't fit on the page */
const tb5 = (probe: string, cells: number, kept: (row: number, cell: number) => boolean): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - 5.5 * LINE),
        table(
            Array.from({ length: 10 }, (_, row) =>
                Array.from({ length: cells }, (_, cell) => [
                    line(`${probe} row ${row + 1}${cell > 0 ? " right" : ""}`, { keepNext: kept(row + 1, cell) }),
                ]),
            ),
        ),
        line(`${probe} after`),
    ],
});

/** Table styles docx can't write, added to styles.xml */
const TABLE_STYLES = `
<w:style w:type="table" w:styleId="WatertightTable"><w:name w:val="Watertight Table"/><w:basedOn w:val="TableNormal"/>
  <w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr>
  <w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="WatertightTableSize"><w:name w:val="Watertight Table Size"/><w:basedOn w:val="TableNormal"/>
  <w:rPr><w:sz w:val="18"/></w:rPr>
  <w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="WatertightBordered"><w:name w:val="Watertight Bordered"/><w:basedOn w:val="TableNormal"/>
  <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="24" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="24" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="24" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="24" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="24" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="24" w:space="0" w:color="000000"/></w:tblBorders>
  <w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="WatertightFirstRow"><w:name w:val="Watertight First Row"/><w:basedOn w:val="TableNormal"/>
  <w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>
  <w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:tblStylePr></w:style>
`;

/** [what docx writes, what replaces it], in document.xml */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    // TB7a: hideMark, written as a cell shaded 123456, at the end of the cell's properties as its schema has it
    [/<w:shd [^>]*w:fill="123456"[^>]*\/>((?:(?!<\/w:tcPr>).)*)<\/w:tcPr>/g, "$1<w:hideMark/></w:tcPr>"],
    // TB10: a hidden row, written as a row that can't split
    [/<w:cantSplit\/>/g, "<w:hidden/>"],
    // TB2a: no borders of the table's own, which docx writes on every table, so only its style's are left
    [/(<w:tblStyle w:val="WatertightBordered"\/><w:tblW [^>]*\/>)<w:tblBorders>.*?<\/w:tblBorders>/g, "$1"],
];

const sections: ISectionOptions[] = [
    // TB1a: paragraphs in Normal, in a table of WatertightTable: none after, single, 9 points
    tb1("TB1a", (text) => new Paragraph({ children: [new TextRun(text)] }), "WatertightTable"),
    // TB1b: the same, with Normal named
    tb1("TB1b", (text) => new Paragraph({ style: "Normal", children: [new TextRun(text)] }), "WatertightTable"),
    // TB1c: paragraphs in a style of their own, with Normal's spacing and size
    tb1("TB1c", (text) => new Paragraph({ style: "WatertightBody", children: [new TextRun(text)] }), "WatertightTable"),
    // TB1d: paragraphs in Normal with 100 after of their own
    tb1("TB1d", (text) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun(text)] }), "WatertightTable"),
    // TB1e: paragraphs in Normal, in a table without a style of its own
    tb1("TB1e", (text) => new Paragraph({ children: [new TextRun(text)] })),
    // TB1f: paragraphs in Normal, in a table whose style has only 9 points
    tb1("TB1f", (text) => new Paragraph({ children: [new TextRun(text)] }), "WatertightTableSize"),

    // TB2a: 10 one-line rows of a table whose style has 3-point borders, and none of its own; TB2b: its own 3-point borders
    around(
        "TB2a",
        table(
            Array.from({ length: 10 }, (_, i) => [[line(`TB2a row ${i + 1}`)]]),
            { style: "WatertightBordered" },
        ),
    ),
    around(
        "TB2b",
        table(
            Array.from({ length: 10 }, (_, i) => [[line(`TB2b row ${i + 1}`)]]),
            { borders: borders(24) },
        ),
    ),

    // TB3: 10 one-line rows of cells with 3-point top and bottom borders of their own, in a table without borders
    around(
        "TB3",
        table(
            Array.from({ length: 10 }, (_, i) => [[line(`TB3 row ${i + 1}`)]]),
            {},
            {
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 24, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 24, color: "000000" },
                },
            },
        ),
    ),

    // TB4a: 10 one-line rows with 100 twips between cells; TB4b: a row of 2 cells of prose with it, TB4c without
    around(
        "TB4a",
        table(
            Array.from({ length: 10 }, (_, i) => [[line(`TB4a row ${i + 1}`)]]),
            { cellSpacing: { value: 100, type: WidthType.DXA } },
        ),
    ),
    {
        children: [
            line("TB4b above"),
            table([[[line(`TB4b ${prose(80)}`)], [line(`TB4b right ${prose(80)}`)]]], { cellSpacing: { value: 100, type: WidthType.DXA } }),
            line("TB4c above"),
            table([[[line(`TB4c ${prose(80)}`)], [line(`TB4c right ${prose(80)}`)]]]),
            line("TB4c below"),
        ],
    },

    // TB5a: rows 1 to 9 kept with the next; TB5b: only the first of each row's 2 cells, rows 1 to 9; TB5c: only row 5;
    // TB5d: none
    tb5("TB5a", 1, (row) => row < 10),
    tb5("TB5b", 2, (row, cell) => row < 10 && cell === 0),
    tb5("TB5c", 1, (row) => row === 5),
    tb5("TB5d", 1, () => false),

    // TB6: a cell of text running up (btLr) and down (tbRl), beside a cell of a line, and the same with 3 paragraphs
    ...(
        [
            ["TB6a", TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, 1],
            ["TB6b", TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT, 1],
            ["TB6c", TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, 3],
        ] as const
    ).map(([probe, direction, count]) => ({
        children: [
            line(`${probe} above`),
            new Table({
                width: { size: WIDTH, type: WidthType.DXA },
                columnWidths: [2000, WIDTH - 2000],
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 2000, type: WidthType.DXA },
                                textDirection: direction,
                                children: Array.from({ length: count }, (_, i) =>
                                    line(`${probe} vertical text of ten words in one cell ${i + 1}`),
                                ),
                            }),
                            new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, children: [line(`${probe} right`)] }),
                        ],
                    }),
                ],
            }),
            line(`${probe} below`),
        ],
    })),

    // TB7a: an empty cell whose mark is 28 points, with hideMark, beside a line; TB7b: without
    ...(["TB7a", "TB7b"] as const).map((probe) =>
        around(
            probe,
            new Table({
                width: { size: WIDTH, type: WidthType.DXA },
                columnWidths: [2000, WIDTH - 2000],
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 2000, type: WidthType.DXA },
                                ...(probe === "TB7a" ? { shading: { fill: "123456" } } : {}),
                                children: [new Paragraph({ spacing: SINGLE, run: { size: 56 } })],
                            }),
                            new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, children: [line(`${probe} right`)] }),
                        ],
                    }),
                ],
            }),
        ),
    ),

    // TB8: 5 one-line rows of a table whose style's first row is 16 points bold, with tblLook firstRow on and off
    around(
        "TB8a",
        table(
            Array.from({ length: 5 }, (_, i) => [[line(`TB8a row ${i + 1}`)]]),
            { style: "WatertightFirstRow", tableLook: { firstRow: true } },
        ),
    ),
    around(
        "TB8b",
        table(
            Array.from({ length: 5 }, (_, i) => [[line(`TB8b row ${i + 1}`)]]),
            { style: "WatertightFirstRow", tableLook: { firstRow: false } },
        ),
    ),

    // TB9a: a table of one cell of prose, without widths, indented 2000 twips; TB9b: not indented
    ...(["TB9a", "TB9b"] as const).map((probe) =>
        around(
            probe,
            new Table({
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                ...(probe === "TB9a" ? { indent: { size: 2000, type: WidthType.DXA } } : {}),
                rows: [new TableRow({ children: [new TableCell({ children: [line(`${probe} ${prose(150)}`)] })] })],
            }),
        ),
    ),

    // TB10: 10 one-line rows, of which rows 3 to 7 are hidden
    around(
        "TB10",
        new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [WIDTH],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: Array.from(
                { length: 10 },
                (_, i) =>
                    new TableRow({
                        cantSplit: i >= 2 && i <= 6,
                        children: [new TableCell({ width: { size: WIDTH, type: WidthType.DXA }, children: [line(`TB10 row ${i + 1}`)] })],
                    }),
            ),
        }),
    ),

    // TB11: a table 3000 twips wide floating at the left margin, 1000 twips below the paragraph after it, then prose
    {
        children: [
            line("TB11 above"),
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                borders: borders(8),
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    verticalAnchor: TableAnchorType.TEXT,
                    relativeHorizontalPosition: RelativeHorizontalPosition.LEFT,
                    absoluteVerticalPosition: 0,
                    rightFromText: 200,
                    bottomFromText: 200,
                },
                rows: Array.from(
                    { length: 6 },
                    (_, i) =>
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [line(`TB11 cell ${i + 1}`)] }),
                            ],
                        }),
                ),
            }),
            line(`TB11 ${prose(200)}`),
        ],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                paragraph: { spacing: { before: 0, after: 200, line: 360, lineRule: LineRuleType.AUTO } },
                run: { size: 22 },
            },
            {
                id: "WatertightBody",
                name: "Watertight Body",
                paragraph: { spacing: { before: 0, after: 200, line: 360, lineRule: LineRuleType.AUTO } },
                run: { size: 22 },
            },
        ],
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) => text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    const styles = await zip.file("word/styles.xml")!.async("string");
    zip.file("word/styles.xml", styles.replace("</w:styles>", `${TABLE_STYLES.replace(/\n\s*/g, "")}</w:styles>`));
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-tables.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
