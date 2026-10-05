/**
 * Probes of the cases around those `word-stops-drawings.docx` DH1, `word-stops-text.docx` PB6, `word-stops-floats.docx`
 * HR1 and `word-stops-tabs.docx` TA8 settled, where docx/layout still stops. Read with `word-stops.py`, as the others.
 *
 * DH2a to DH2d: a grey picture 2 inches square in the header, with square wrapping, 4.5 inches across the page: 2 inches
 *   below the top of its paragraph (a), 2 inches below the top of its line (b), beside the header's three lines of text,
 *   0.6 inches down the page (c), and 1 inch from the left of the column, 3 inches down the page, in a section of two
 *   columns (d) ("a drawing that text flows around in a header or footer, placed against its paragraph or line", "...
 *   beside its text", "... placed against a column of several")
 * PB9a to PB9f: contextual spacing at the edges of table cells, with Normal paragraphs of 12 points before and after:
 *   two cells side by side (a), two rows of a cell each (b), the paragraph before the table with contextual spacing, above
 *   (c), the paragraph after the table with contextual spacing too (d), a table first in a cell (e), and the control,
 *   two cells without contextual spacing (f) ("contextual spacing at the edge of a table cell beside another cell or row,
 *   or a table's paragraphs")
 * HR2a, HR2b: a table of a header row and rows of 3 lines that can't break, after lines that leave room for the header
 *   row and a line: in the first of two columns (a), and below a heading kept with the next (b) ("a table's header rows
 *   alone at the foot of a column", "a paragraph kept with the next before a table whose header rows go on to the next
 *   page")
 * TA9a, TA9b: a tab to a left stop at 9500 twips, past the margin, at the start of a paragraph indented 1000 twips on the
 *   left (a) and on the right (b) ("a left tab stop past the end of the line at the start of a line in an indented
 *   paragraph")
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-edges.ts [folder]
 */
import {
    Header,
    HorizontalPositionRelativeFrom,
    ImageRun,
    type ISectionOptions,
    Paragraph,
    SectionType,
    TabStopType,
    Table,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";

import { ALL_BORDERS, type Child, PAGE, PNG, cell, fill, group, line, para, probe, prose, write } from "./kit";

const EMU = 914400;

/** A picture 2 inches square with square wrapping, 4.5 inches across the page, or across the column, as given */
const floating = (
    name: string,
    down: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom],
    y: number,
    across: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom] = HorizontalPositionRelativeFrom.PAGE,
    x = 4.5,
): ImageRun =>
    new ImageRun({
        type: "png",
        data: PNG,
        altText: { name, description: name, title: name },
        transformation: { width: 2 * 96, height: 2 * 96 },
        floating: {
            horizontalPosition: { relative: across, offset: x * EMU },
            verticalPosition: { relative: down, offset: y * EMU },
            wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
            margins: { left: EMU / 8, right: EMU / 8, top: 0, bottom: 0 },
        },
    });

/** A section of its own whose header has the picture, with the body's text going on below the probe's line above */
const headerProbe = (name: string, picture: ImageRun, headerLines = 1, columns = 1): ISectionOptions => ({
    properties: {
        ...PAGE,
        type: SectionType.NEXT_PAGE,
        ...(columns > 1 ? { column: { count: columns, space: 720 } } : {}),
    },
    headers: {
        default: new Header({
            children: [new Paragraph({ children: [new TextRun(`${name} header ${prose(headerLines * 14)}`), picture] })],
        }),
    },
    children: [line(`${name} above`), para(name, 600), line(`${name} below`)],
});

const CONTEXTUAL = { contextualSpacing: true, spacing: { before: 240, after: 240 } };
const SPACED = { spacing: { before: 240, after: 240 } };

/** A table of 9026 twips of rows of cells, each cell's paragraphs or tables given */
const grid = (rows: readonly (readonly (readonly Child[])[])[]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: rows[0].map(() => Math.floor(9026 / rows[0].length)),
        borders: ALL_BORDERS,
        rows: rows.map((cells) => new TableRow({ children: cells.map((children) => cell(children)) })),
    });

/** HR2's table: a header row and rows of 3 lines that can't break */
const headed = (name: string, width = 9026): Table =>
    new Table({
        width: { size: width, type: WidthType.DXA },
        columnWidths: [width],
        borders: ALL_BORDERS,
        rows: [
            new TableRow({ tableHeader: true, children: [cell(`${name} header`)] }),
            ...Array.from(
                { length: 4 },
                (_, index) =>
                    new TableRow({
                        cantSplit: true,
                        children: [cell(Array.from({ length: 3 }, (__, at) => line(`${name} r${index + 1} line ${at + 1}`)))],
                    }),
            ),
        ],
    });

const tab = (name: string, indent: object): Paragraph =>
    new Paragraph({ indent, tabStops: [{ type: TabStopType.LEFT, position: 9500 }], children: [new TextRun(`\t${name} left`)] });

const sections: ISectionOptions[] = [
    headerProbe("DH2a", floating("DH2a", VerticalPositionRelativeFrom.PARAGRAPH, 2)),
    headerProbe("DH2b", floating("DH2b", VerticalPositionRelativeFrom.LINE, 2)),
    headerProbe("DH2c", floating("DH2c", VerticalPositionRelativeFrom.PAGE, 0.6, HorizontalPositionRelativeFrom.PAGE, 1), 3),
    headerProbe("DH2d", floating("DH2d", VerticalPositionRelativeFrom.PAGE, 3, HorizontalPositionRelativeFrom.COLUMN, 1), 1, 2),
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE },
        children: [
            ...group("PB9a", [
                line("PB9a before table"),
                grid([[[line("PB9a left", CONTEXTUAL)], [line("PB9a right", CONTEXTUAL)]]]),
                line("PB9a after table"),
            ]),
            ...group("PB9b", [
                line("PB9b before table"),
                grid([[[line("PB9b row 1", CONTEXTUAL)]], [[line("PB9b row 2", CONTEXTUAL)]]]),
                line("PB9b after table"),
            ]),
            ...group("PB9c", [line("PB9c before table", CONTEXTUAL), grid([[[line("PB9c cell")]]]), line("PB9c after table")]),
            ...group("PB9d", [
                line("PB9d before table"),
                grid([[[line("PB9d cell", { style: "Other" })]]]),
                line("PB9d after table", CONTEXTUAL),
            ]),
            ...group("PB9e", [
                line("PB9e before table"),
                grid([[[grid([[[line("PB9e inner", CONTEXTUAL)]]]), line("PB9e outer")]]]),
                line("PB9e after table"),
            ]),
            ...group("PB9f", [
                line("PB9f before table"),
                grid([[[line("PB9f left", SPACED)], [line("PB9f right", SPACED)]]]),
                line("PB9f after table"),
            ]),
            // HR2b: the header row and a line of the first row's 3 fit below the heading, which is kept with the next
            ...probe("HR2b", [...fill("HR2b", 46), line("HR2b heading", { keepNext: true }), headed("HR2b")]),
            ...probe("TA9a", [tab("TA9a", { left: 1000 }), line("TA9a next")]),
            ...probe("TA9b", [tab("TA9b", { right: 1000 }), line("TA9b next")]),
        ],
    },
    // HR2a: in the first of two columns, below 47 lines, with room for the header row and a line
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
        children: [line("HR2a above"), ...fill("HR2a", 47), headed("HR2a", 4153), line("HR2a below")],
    },
];

await write({
    name: "word-stops-edges",
    sections,
    options: { styles: { paragraphStyles: [{ id: "Other", name: "Other", basedOn: "Normal", run: { color: "333333" } }] } },
});
