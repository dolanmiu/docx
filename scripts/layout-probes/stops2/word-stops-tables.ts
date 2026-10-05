/**
 * Probes of table rows across pages and of table styles and cell options, where docx/layout stops after `word-probes.docx`
 * (U4, U5, U8), `word-nested-tables.docx` (N1 to N8) and `word-table-formats.docx` (CF, KR, HM, TI).
 *
 * Rows across pages (RW), each after enough lines that the row breaks across the page:
 * RW1: a table in a cell, with a header row, across pages ("a header row of a table in a table cell across pages")
 * RW2: a table in a cell with a cell merged down its rows, across pages
 * RW3: a table in a cell with space between its cells, across pages
 * RW4a, RW4b: a cell merged down 3 rows with 120 lines (a: across three pages), and with 40 lines, the page breaking
 *   between its rows (b)
 * RW5a to RW5c: a row exactly 16000 tall, taller than a page, with a cell merged down from it (a), as a header row (b),
 *   with a footnote (c)
 * RW6: a row of at least 15000 with 70 lines in it
 * RW7: a line in a cell taller than a page: a picture 11 inches tall
 * RW8: a row whose paragraph is kept with the next, before a row that can't split, 30 lines tall, at the foot of a page
 * RW10: a cell merged down from the first of two header rows into the body, with 60 lines, across pages
 * RW11: a row that can't split, of 60 lines, in 2 columns ("a table row kept together taller than a column")
 * RW12: a table in a cell merged down 3 rows, across pages
 *
 * Table styles and cell options (TS):
 * TS1a to TS1c: a table style whose first row has a height of its own (trPr) (a), cell margins of its own (tcPr) (b), and
 *   space between its cells (tblPr) (c) ("a table style's formatting for some of its cells")
 * TS2: a style's corner cells (nwCell, neCell) in a header of two rows
 * TS3: a style's bands of rows in a header of three rows, its first row turned off (w:tblLook firstRow 0)
 * TS4: a row with table properties of its own (w:tblPrEx): borders of 12 and cell margins of 300
 * TS5a, TS5b: a table style with row properties of its own (cantSplit, a height of at least 800) (a) and cell properties
 *   (margins of 200, vertical alignment) (b) ("a table style with formatting of its rows or cells")
 * TS6: cells merged across columns as old versions of Word wrote them (w:hMerge restart and continue)
 * TS7a, TS7b: a cell whose text doesn't wrap (w:noWrap) in a table given no widths (a) and one of fixed widths (b)
 * TS8: text fitted to its cell (w:tcFitText), in a cell of 2000
 * TS9: a table indented 10% of the width (w:tblInd w:type pct)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-tables.ts [folder]
 */
import { type ISectionOptions, HeightRule, Paragraph, SectionType, Table, TableRow, TextRun, VerticalMergeType, WidthType } from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, footnote, line, lines, picture, probe, withProperty, write } from "./kit";

const nested = (name: string, rows: number, options: object = {}): Table =>
    new Table({
        borders: ALL_BORDERS,
        ...options,
        rows: Array.from(
            { length: rows },
            (_, index) =>
                new TableRow({
                    tableHeader: index === 0 && (options as { header?: boolean }).header === true,
                    children: [cell(`${name} inner ${index + 1}`), cell(`${name} right ${index + 1}`)],
                }),
        ),
    });
const outer = (children: readonly (readonly Child[])[], options: object = {}): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [6026, 3000],
        borders: ALL_BORDERS,
        ...options,
        rows: [new TableRow({ children: children.map((one) => cell([...one])) })],
    });
const merged3 = (name: string, content: readonly Child[], widths = [4513, 4513]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: widths,
        borders: ALL_BORDERS,
        rows: [0, 1, 2].map(
            (row) =>
                new TableRow({
                    children: [
                        row === 0
                            ? cell([...content], { verticalMerge: VerticalMergeType.RESTART })
                            : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                        cell(`${name} row ${row + 1}`),
                    ],
                }),
        ),
    });

const children: Child[] = [
    ...probe("RW1", [
        ...fill("RW1", 35),
        outer([
            [
                new Table({
                    borders: ALL_BORDERS,
                    rows: Array.from(
                        { length: 30 },
                        (_, index) =>
                            new TableRow({ tableHeader: index === 0, children: [cell(index === 0 ? "RW1 header" : `RW1 inner ${index}`)] }),
                    ),
                }),
            ],
            [line("RW1 outer")],
        ]),
    ]),
    ...probe("RW2", [
        ...fill("RW2", 35),
        outer([
            [
                new Table({
                    borders: ALL_BORDERS,
                    rows: Array.from(
                        { length: 30 },
                        (_, index) =>
                            new TableRow({
                                children: [
                                    index === 0
                                        ? cell("RW2 merged", { verticalMerge: VerticalMergeType.RESTART })
                                        : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                                    cell(`RW2 inner ${index + 1}`),
                                ],
                            }),
                    ),
                }),
            ],
            [line("RW2 outer")],
        ]),
    ]),
    ...probe("RW3", [
        ...fill("RW3", 35),
        outer([[nested("RW3", 30, { cellSpacing: { value: 60, type: WidthType.DXA } })], [line("RW3 outer")]]),
    ]),
    ...probe("RW4a", [...fill("RW4a", 10), merged3("RW4a", [lines("RW4a merged", 120)])]),
    ...probe("RW4b", [
        ...fill("RW4b", 40),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: ALL_BORDERS,
            rows: [0, 1, 2].map(
                (row) =>
                    new TableRow({
                        children: [
                            row === 0
                                ? cell([lines("RW4b merged", 40)], { verticalMerge: VerticalMergeType.RESTART })
                                : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                            cell([lines(`RW4b row ${row + 1}`, 4)]),
                        ],
                    }),
            ),
        }),
    ]),
    ...probe("RW5a", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: ALL_BORDERS,
            rows: [0, 1].map(
                (row) =>
                    new TableRow({
                        height: row === 0 ? { value: 16000, rule: HeightRule.EXACT } : undefined,
                        children: [
                            row === 0
                                ? cell("RW5a merged", { verticalMerge: VerticalMergeType.RESTART })
                                : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                            cell(`RW5a row ${row + 1}`),
                        ],
                    }),
            ),
        }),
    ]),
    ...probe("RW5b", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({ tableHeader: true, height: { value: 16000, rule: HeightRule.EXACT }, children: [cell("RW5b header")] }),
                new TableRow({ children: [cell("RW5b body")] }),
            ],
        }),
    ]),
    ...probe("RW5c", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({
                    height: { value: 16000, rule: HeightRule.EXACT },
                    children: [cell([new Paragraph({ children: [new TextRun("RW5c row"), footnote(line("RW5c note"))] })])],
                }),
            ],
        }),
    ]),
    ...probe("RW6", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [new TableRow({ height: { value: 15000, rule: HeightRule.ATLEAST }, children: [cell([lines("RW6 row", 70)])] })],
        }),
    ]),
    ...probe("RW7", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("RW7 "), picture(200, 792)] })])] })],
        }),
    ]),
    ...probe("RW8", [
        ...fill("RW8", 40),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({ children: [cell([line("RW8 kept row", { keepNext: true })])] }),
                new TableRow({ cantSplit: true, children: [cell([lines("RW8 tall row", 30)])] }),
            ],
        }),
    ]),
    ...probe("RW10", [
        ...fill("RW10", 30),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: ALL_BORDERS,
            rows: [0, 1, 2, 3].map(
                (row) =>
                    new TableRow({
                        tableHeader: row < 2,
                        children: [
                            row === 0
                                ? cell([lines("RW10 merged", 60)], { verticalMerge: VerticalMergeType.RESTART })
                                : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                            cell(`RW10 row ${row + 1}`),
                        ],
                    }),
            ),
        }),
    ]),
    ...probe("RW12", [...fill("RW12", 30), merged3("RW12", [nested("RW12", 40)])]),
    ...probe("TS1a", [styled("TS1a", "StyleRowHeight")]),
    ...probe("TS1b", [styled("TS1b", "StyleCellMargins")]),
    ...probe("TS1c", [styled("TS1c", "StyleSpacing")]),
    ...probe("TS2", [styled("TS2", "StyleCorners", 2)]),
    ...probe("TS3", [styled("TS3", "StyleBands", 3, "TS3LOOK")]),
    ...probe("TS4", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: ALL_BORDERS,
            rows: [0, 1, 2].map(
                (row) => new TableRow({ children: [cell(`TS4 r${row + 1}${row === 1 ? " own" : ""}`), cell(`TS4 r${row + 1} b`)] }),
            ),
        }),
    ]),
    ...probe("TS5a", [styled("TS5a", "StyleRows")]),
    ...probe("TS5b", [styled("TS5b", "StyleCells")]),
    ...probe("TS6", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [3000, 3000, 3026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({ children: [cell("TS6 merged across two"), cell(""), cell("TS6 third")] }),
                new TableRow({ children: [cell("TS6 a"), cell("TS6 b"), cell("TS6 c")] }),
            ],
        }),
    ]),
    ...probe("TS7a", [
        new Table({
            borders: ALL_BORDERS,
            rows: [
                new TableRow({
                    children: [
                        cell(
                            "TS7a nowrap the in foot mouth made on river was and the coast boat to the by lighthouse of summer the survey",
                        ),
                        cell("TS7a other words in a cell beside it that wrap as they go on and on and on"),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("TS7b", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [2000, 7026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({
                    children: [
                        cell("TS7b nowrap the in foot mouth made on river", { width: { size: 2000, type: WidthType.DXA } }),
                        cell("TS7b other", { width: { size: 7026, type: WidthType.DXA } }),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("TS8", [
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [2000, 7026],
            borders: ALL_BORDERS,
            rows: [
                new TableRow({
                    children: [
                        cell("TS8 fitted to its cell of two thousand", { width: { size: 2000, type: WidthType.DXA } }),
                        cell("TS8 other", { width: { size: 7026, type: WidthType.DXA } }),
                    ],
                }),
            ],
        }),
    ]),
    ...probe("TS9", [
        new Table({
            width: { size: 6000, type: WidthType.DXA },
            columnWidths: [6000],
            indent: { size: 500, type: WidthType.PERCENTAGE },
            borders: ALL_BORDERS,
            rows: [new TableRow({ children: [cell("TS9 indented a share")] })],
        }),
    ]),
];

/** A table of four rows of two cells in a style of the probe's own, with a header of `headers` rows */
function styled(name: string, style: string, headers = 1, look = ""): Table {
    return new Table({
        style,
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [0, 1, 2, 3, 4].map(
            (row) =>
                new TableRow({
                    tableHeader: row < headers,
                    children: [cell(`${name} r${row + 1} a${row === 0 && look ? ` @@${look}@@` : ""}`), cell(`${name} r${row + 1} b`)],
                }),
        ),
    });
}

const SINGLE =
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
const tableStyle = (id: string, own: string, tblPr = ""): string =>
    `<w:style w:type="table" w:styleId="${id}"><w:name w:val="${id}"/><w:tblPr>${tblPr}<w:tblBorders>${SINGLE}</w:tblBorders></w:tblPr>${own}</w:style>`;
const STYLES = [
    tableStyle(
        "StyleRowHeight",
        '<w:tblStylePr w:type="firstRow"><w:trPr><w:trHeight w:val="1000" w:hRule="atLeast"/></w:trPr></w:tblStylePr>',
    ),
    tableStyle(
        "StyleCellMargins",
        '<w:tblStylePr w:type="firstRow"><w:tcPr><w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/></w:tcMar></w:tcPr></w:tblStylePr>',
    ),
    tableStyle(
        "StyleSpacing",
        '<w:tblStylePr w:type="firstRow"><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr></w:tblStylePr>',
    ),
    tableStyle(
        "StyleCorners",
        '<w:tblStylePr w:type="firstRow"><w:rPr><w:b/></w:rPr></w:tblStylePr><w:tblStylePr w:type="nwCell"><w:rPr><w:sz w:val="32"/></w:rPr></w:tblStylePr><w:tblStylePr w:type="neCell"><w:rPr><w:sz w:val="28"/></w:rPr></w:tblStylePr>',
    ),
    tableStyle(
        "StyleBands",
        '<w:tblStylePr w:type="band1Horz"><w:rPr><w:sz w:val="28"/></w:rPr></w:tblStylePr><w:tblStylePr w:type="band2Horz"><w:rPr><w:sz w:val="18"/></w:rPr></w:tblStylePr>',
        '<w:tblStyleRowBandSize w:val="1"/>',
    ),
    tableStyle("StyleRows", '<w:trPr><w:cantSplit/><w:trHeight w:val="800" w:hRule="atLeast"/></w:trPr>'),
    tableStyle(
        "StyleCells",
        '<w:tcPr><w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>',
    ),
];

const sections: ISectionOptions[] = [
    { properties: PAGE, children },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
        children: [
            line("RW11 above"),
            ...fill("RW11", 20),
            new Table({
                width: { size: 4000, type: WidthType.DXA },
                columnWidths: [4000],
                borders: ALL_BORDERS,
                rows: [new TableRow({ cantSplit: true, children: [cell([lines("RW11 row", 60)])] })],
            }),
            line("RW11 below"),
        ],
    },
];

await write({
    name: "word-stops-tables",
    sections,
    injections: [
        (parts) => {
            const styles = parts.get("word/styles.xml")!;
            parts.set("word/styles.xml", styles.replace("</w:styles>", `${STYLES.join("")}</w:styles>`));
            let text = parts.get("word/document.xml")!;
            // Each step only where its probe is, as ONLY leaves the others out
            // TS3: the first row turned off in the table's look
            const ts3 = text.indexOf("@@TS3LOOK@@");
            if (ts3 >= 0) {
                text = withProperty(
                    text,
                    "w:tblPr",
                    '<w:tblLook w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>',
                    text.lastIndexOf("<w:tbl>", ts3),
                );
                text = text.replace(" @@TS3LOOK@@", "");
            }
            // TS4: the second row's own table properties
            const ts4 = text.indexOf(">TS4 r2 own<");
            if (ts4 >= 0) {
                const row = text.lastIndexOf("<w:tr>", ts4) + "<w:tr>".length;
                text =
                    text.slice(0, row) +
                    '<w:tblPrEx><w:tblBorders><w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="12" w:space="0" w:color="000000"/></w:tblBorders><w:tblCellMar><w:left w:w="300" w:type="dxa"/><w:right w:w="300" w:type="dxa"/></w:tblCellMar></w:tblPrEx>' +
                    text.slice(row);
            }
            // TS6: the first two cells merged as old versions of Word wrote it
            const ts6 = text.indexOf(">TS6 merged across two<");
            if (ts6 >= 0) {
                const firstCell = text.lastIndexOf("<w:tc>", ts6);
                text = withProperty(text, "w:tcPr", '<w:hMerge w:val="restart"/>', firstCell + 6, text.indexOf("<w:p", firstCell));
                const secondCell = text.indexOf("<w:tc>", text.indexOf(">TS6 merged across two<"));
                text = withProperty(text, "w:tcPr", '<w:hMerge w:val="continue"/>', secondCell + 6, text.indexOf("<w:p", secondCell));
            }
            // TS7, TS8
            for (const [name, xml] of [
                ["TS7a nowrap", "<w:noWrap/>"],
                ["TS7b nowrap", "<w:noWrap/>"],
                ["TS8 fitted", "<w:tcFitText/>"],
            ] as const) {
                const at = text.indexOf(`>${name}`);
                if (at >= 0) {
                    const tc = text.lastIndexOf("<w:tc>", at);
                    text = withProperty(text, "w:tcPr", xml, tc + 6, text.indexOf("<w:p", tc));
                }
            }
            parts.set("word/document.xml", text);
        },
    ],
});
