/**
 * Probes of table styles and cell options, for what `word-stops-tables.docx` (TS1 to TS9) left open:
 *
 * - "a table style with formatting of its rows or cells": TS5a showed Word ignores a style's own row height, but its rows of
 *   a line couldn't show whether it keeps them whole (`w:cantSplit`) (TS10a), nor a part's for some rows (TS10b).
 * - "a table indented by a share of the width": TS9 gave 500%, as docx's `WidthType.PERCENTAGE` takes a percent (TS11a, TS11b).
 * - "a table cell whose text doesn't wrap, in a table sized to its text" (TS12a to TS12c) and "text fitted to its table
 *   cell, in a table sized to its text" (TS13a, TS13b): how Word sizes the columns.
 * - "a table style's bands of rows in a header of four rows or more" (TS14): TS3 showed a header of three banded from its
 *   first row with the first row turned off.
 * - A row with a height of its own and its style's part's (TS15), which the layout takes as the row's own.
 *
 * Calibri 11 on A4 with inch margins; each probe between a line above and a line below.
 *
 * TS10a: a table whose style keeps its rows whole, of a row of 30 lines after 40 lines; TS10b: the same, its style's part
 *   for its first row keeping it whole, the row its first
 * TS11a: a table of 6000 indented 10% of the width (`w:tblInd w:type="pct"`); TS11b: indented -5%
 * TS12a: a table given no widths, of a cell of 12 words that doesn't wrap beside one of 60 words; TS12b: the same with 30
 *   words that don't wrap, wider than the page; TS12c: a cell of 12 words that doesn't wrap beside one of 3
 * TS13a: a table given no widths, of a cell of 12 words fitted to it beside one of 60 words; TS13b: beside one of 3
 * TS14: a table of 6 rows, the first 4 its header, in a style with bands of rows of 14 and 9 points, its first row off
 * TS15: a first row of exactly 400 twips in a style whose part for its first row gives it at least 1000
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-tables2.ts [folder]
 */
import { HeightRule, Paragraph, Table, TableRow, TextRun, WidthType } from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, group, lines, newPage, probe, prose, withProperty, write } from "./kit";

const SINGLE =
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
const tableStyle = (id: string, own: string, tblPr = ""): string =>
    `<w:style w:type="table" w:styleId="${id}"><w:name w:val="${id}"/><w:tblPr>${tblPr}<w:tblBorders>${SINGLE}</w:tblBorders></w:tblPr>${own}</w:style>`;
const STYLES = [
    tableStyle("StyleKept", "<w:trPr><w:cantSplit/></w:trPr>"),
    tableStyle("StyleFirstKept", '<w:tblStylePr w:type="firstRow"><w:trPr><w:cantSplit/></w:trPr></w:tblStylePr>'),
    tableStyle(
        "StyleBands4",
        '<w:tblStylePr w:type="band1Horz"><w:rPr><w:sz w:val="28"/></w:rPr></w:tblStylePr><w:tblStylePr w:type="band2Horz"><w:rPr><w:sz w:val="18"/></w:rPr></w:tblStylePr>',
        '<w:tblStyleRowBandSize w:val="1"/>',
    ),
    tableStyle("StyleTall", '<w:tblStylePr w:type="firstRow"><w:trPr><w:trHeight w:val="1000" w:hRule="atLeast"/></w:trPr></w:tblStylePr>'),
];

const kept = (name: string, style: string): Table =>
    new Table({
        style,
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [cell([lines(`${name} row`, 30)])] }), new TableRow({ children: [cell(`${name} after`)] })],
    });

const indented = (name: string, share: number): Table =>
    new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [6000],
        indent: { size: share, type: WidthType.PERCENTAGE },
        borders: ALL_BORDERS,
        rows: [new TableRow({ children: [cell(`${name} indented`)] })],
    });

// A cell of text marked for an injection of its own cell property, and the cells beside it
const marked = (name: string, marker: string, words: number, beside: number): Table =>
    new Table({
        borders: ALL_BORDERS,
        rows: [new TableRow({ children: [cell(`${name} ${marker} ${prose(words)}`), cell(`${name} beside ${prose(beside)}`)] })],
    });

const children: Child[] = [
    ...probe("TS10a", [...fill("TS10a", 40), kept("TS10a", "StyleKept")]),
    ...probe("TS10b", [...fill("TS10b", 40), kept("TS10b", "StyleFirstKept")]),
    newPage(),
    ...group("TS11a", [indented("TS11a", 10)]),
    ...group("TS11b", [indented("TS11b", -5)]),
    newPage(),
    ...group("TS12a", [marked("TS12a", "NOWRAP", 12, 60)]),
    ...group("TS12b", [marked("TS12b", "NOWRAP", 30, 3)]),
    ...group("TS12c", [marked("TS12c", "NOWRAP", 12, 3)]),
    newPage(),
    ...group("TS13a", [marked("TS13a", "FITTED", 12, 60)]),
    ...group("TS13b", [marked("TS13b", "FITTED", 12, 3)]),
    newPage(),
    ...group("TS14", [
        new Table({
            style: "StyleBands4",
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            rows: [0, 1, 2, 3, 4, 5].map(
                (row) =>
                    new TableRow({
                        tableHeader: row < 4,
                        children: [cell(`TS14 r${row + 1} a${row === 0 ? " @@LOOK@@" : ""}`), cell(`TS14 r${row + 1} b`)],
                    }),
            ),
        }),
    ]),
    ...group("TS15", [
        new Table({
            style: "StyleTall",
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            rows: [
                new TableRow({ height: { value: 400, rule: HeightRule.EXACT }, children: [cell("TS15 r1")] }),
                new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TS15 r2")] })])] }),
            ],
        }),
    ]),
];

await write({
    name: "word-stops-tables2",
    sections: [{ properties: PAGE, children }],
    injections: [
        (parts) => {
            const styles = parts.get("word/styles.xml")!;
            parts.set("word/styles.xml", styles.replace("</w:styles>", `${STYLES.join("")}</w:styles>`));
            let text = parts.get("word/document.xml")!;
            // TS14: the first row turned off in the table's look, where it is, as ONLY can leave it out
            const look = text.indexOf("@@LOOK@@");
            if (look >= 0) {
                text = withProperty(
                    text,
                    "w:tblPr",
                    '<w:tblLook w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>',
                    text.lastIndexOf("<w:tbl>", look),
                );
                text = text.replace(" @@LOOK@@", "");
            }
            // TS12 and TS13: the cells that don't wrap, and those fitted to their text
            for (const [marker, xml] of [
                ["NOWRAP", "<w:noWrap/>"],
                ["FITTED", "<w:tcFitText/>"],
            ] as const) {
                for (let at = text.indexOf(` ${marker} `); at >= 0; at = text.indexOf(` ${marker} `)) {
                    const tc = text.lastIndexOf("<w:tc>", at);
                    text = withProperty(text, "w:tcPr", xml, tc + 6, text.indexOf("<w:p", tc));
                    text = text.replace(` ${marker} `, " ");
                }
            }
            parts.set("word/document.xml", text);
        },
    ],
});
