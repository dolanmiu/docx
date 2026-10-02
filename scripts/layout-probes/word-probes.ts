// cspell:ignore bbox
// Probes of how Word lays out what docx/layout can't yet: the unknowns of layout-plan.md, numbered U1 to U8 after them.
// Each line's text starts with its probe's name, so the lines can be found in a PDF saved from Word with pdftotext
// -bbox-layout, and read by word-probes.py. Calibri 11, single spaced: 268.55 twips a line in Word, and 51 lines to a
// page of A4 with 1440 margins (13958 twips). Every probe line has no space after, but Normal has 200 after, so the empty
// paragraph docx writes at the end of each section has 200 after, as in word-rules2.ts. Footnotes are in Normal too,
// so their lines are as tall as the body's, and moving a reference down a line leaves one line less for its note.
//
// U1: the widths of the columns of tables given no widths, with cells merged across columns (U1a to U1m, U1u) and with tables
//     in their cells (U1n to U1t). Tables are drawn with borders, black, and those in cells red, so where each column
//     starts and ends can be read from the PDF's drawing. Several tables share a page, as one can't move another's widths
// U2: footnotes continued on the next page in ways Word hasn't shown: with a line on its own (U2a to U2e), of several
//     paragraphs or a table (U2f to U2h), referred to from a line held back by widow control, keepLines or keepNext, or
//     followed by another (U2j to U2n), and too long for the next page too (U2o to U2q). Word (word-probes.pdf): a
//     footnote keeps its own widow and orphan control, and breaks between its paragraphs and table rows as the body does.
//     Where too little of it can stay, its reference's line moves to the next page with it. The body's widow control,
//     keepLines and keepNext apply first, and one longer than a page fills whole pages
// U3: a footnote in a table row that doesn't fit below the row, or in a row that breaks across pages. Word
//     (word-probes.pdf): a row refers to footnotes as a line does. One whose footnote doesn't fit below it moves to the
//     next page with it, and one whose footnote can continue stays. In a row broken across pages, each line's footnote
//     goes on the page its line is on, and the row breaks after the line whose footnote continues
// U4: a row with cells merged down, a table in a cell, or a set height taller than its text, broken across pages
// U5: a row that can't break, taller than a page. Word (word-probes.pdf): it moves to a new page, unless it is at the top
//     of one, and breaks there as other rows do, 51 lines and 9. A row set to a height taller than a page, exactly or at
//     least, takes a page of its own, cut off at its bottom, and what follows starts the next. LibreOffice does the same
// U6: footnotes in columns: under their reference's column, or flowing from the first
// U7: the space before a continuous section's first paragraph with a page break before it
// U8: from #3603: spaces before a line or page break with no text, a cell whose first line doesn't fit beside cells whose
//     lines do, and a paragraph kept together in a cell taller than a page. Word (word-probes.pdf): the row of a paragraph
//     kept together that is taller than a page moves to a new page and breaks there, as one that can't break does (U5),
//     where LibreOffice breaks it where it is
//
// From U2 on, each probe is a section of its own, starting on a new page, and "<probe> top" is its first line. "fill"
// lines are one-line paragraphs. A probe named with a number, such as "U2a 48", has its reference or table on that line
// of the page.
import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import {
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    HeightRule,
    type ISectionOptions,
    Packer,
    PageBreak,
    Paragraph,
    SectionType,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Child = Paragraph | Table;

const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { after: 0, ...options.spacing }, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks, each "<probe> <word> <n>" */
const lines = (probe: string, count: number, options: Options = {}, word = "line"): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0, ...options.spacing },
        children: Array.from(
            { length: count },
            (_, i) => new TextRun({ text: `${probe} ${word} ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
        ),
    });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
/** A paragraph of words that wraps, starting with its probe's name */
const prose = (probe: string, words: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0, ...options.spacing },
        children: [new TextRun(`${probe} ${Array.from({ length: words }, (_, i) => WORDS[(i * 5) % WORDS.length]).join(" ")}`)],
    });

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
const footnote = (...children: Child[]): FootnoteReferenceRun => {
    footnoteId++;
    // A footnote can have a table in it, though the option's type only names paragraphs
    footnotes[footnoteId] = { children: children as Paragraph[] };
    return new FootnoteReferenceRun(footnoteId);
};
/** A one-line paragraph whose text is followed by references to these footnotes */
const withNotes = (text: string, ...notes: FootnoteReferenceRun[]): Paragraph =>
    new Paragraph({ spacing: { after: 0 }, children: [new TextRun(text), ...notes] });
/** A paragraph of lines split by line breaks, with references after the lines given */
const linesWithNotes = (
    probe: string,
    count: number,
    notes: Readonly<Record<number, FootnoteReferenceRun[]>>,
    options: Options = {},
): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0, ...options.spacing },
        children: Array.from({ length: count }, (_, i) => [
            new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
            ...(notes[i + 1] ?? []),
        ]).flat(),
    });

// ---------------------------------------------------------------------------------------------------------------------
// U1: tables given no widths
// ---------------------------------------------------------------------------------------------------------------------

const LONG = "each entry of the log says what was found on the survey where it was found and what should be done about it";
const HALF = "each entry of the log says what was found on the survey";
const MEDIUM = "each entry of the log says what was found";
const LONGER = "each entry of the log says what was found on the survey where it was found";
const SHORTER = "the log of the survey";
const WORD = "Pneumonoultramicroscopicsilicovolcanoconiosis";

type CellSpec = string | { readonly text?: string; readonly span?: number; readonly width?: number; readonly children?: readonly Child[] };

const border = (color: string) => ({ style: BorderStyle.SINGLE, size: 4, color });
const borders = (color: string) => ({
    top: border(color),
    bottom: border(color),
    left: border(color),
    right: border(color),
    insideHorizontal: border(color),
    insideVertical: border(color),
});

const cellParagraph = (text: string): Paragraph => line(text);

/** A table of rows of cells without widths, unless a cell gives one, drawn in black, or red when in a cell */
const autoTable = (rows: readonly (readonly CellSpec[])[], options: { width?: number; percent?: number; nested?: boolean } = {}): Table =>
    new Table({
        ...(options.width === undefined ? {} : { width: { size: options.width, type: WidthType.DXA } }),
        ...(options.percent === undefined ? {} : { width: { size: options.percent, type: WidthType.PERCENTAGE } }),
        borders: borders(options.nested ? "FF0000" : "000000"),
        rows: rows.map(
            (row) =>
                new TableRow({
                    children: row.map((spec) => {
                        const { text, span, width, children } = typeof spec === "string" ? { text: spec } : spec;
                        return new TableCell({
                            ...(span === undefined ? {} : { columnSpan: span }),
                            ...(width === undefined ? {} : { width: { size: width, type: WidthType.DXA } }),
                            children: children ? [...children] : [cellParagraph(text ?? "")],
                        });
                    }),
                }),
        ),
    });

/** A probe of item 1: a label naming it, the table, and a line after it */
const tableProbe = (name: string, note: string, table: Table): Child[] => [line(`${name}: ${note}`), table, line(`${name} end`)];

const U1: Child[][] = [
    [
        // As word-autofit.docx's D1, which Word made 3053, 5249 and 700, with other texts
        ...tableProbe(
            "U1a",
            "long text across 2 columns of one and three short words, beside two",
            autoTable([
                [{ text: LONG, span: 2 }, "two"],
                ["one", "three short words", "two"],
            ]),
        ),
        // Text across 2 columns that is wider than both, in a table narrower than the page: how the extra is shared
        ...tableProbe(
            "U1b",
            "medium text across 2 columns of one and two words",
            autoTable([[{ text: MEDIUM, span: 2 }], ["one", "two words"]]),
        ),
        ...tableProbe(
            "U1c",
            "medium text across 3 columns of one, two words, three short words",
            autoTable([[{ text: MEDIUM, span: 3 }], ["one", "two words", "three short words"]]),
        ),
        // Text across 2 columns narrower than they are
        ...tableProbe(
            "U1d",
            "one across 2 columns of two words and three short words",
            autoTable([[{ text: "one", span: 2 }], ["two words", "three short words"]]),
        ),
        // A long word across 2 columns: its narrowest is wider than the columns are
        ...tableProbe(
            "U1e",
            "a long word across 2 columns of one and two words",
            autoTable([[{ text: WORD, span: 2 }], ["one", "two words"]]),
        ),
    ],
    [
        // Merged cells staggered, so the middle column has no cell of its own
        ...tableProbe(
            "U1f",
            "shorter across columns 1-2, then medium across 2-3; column 2 has no cell of its own",
            autoTable([
                [{ text: SHORTER, span: 2 }, "one"],
                ["one", { text: MEDIUM, span: 2 }],
            ]),
        ),
        // A column given a width under text across it
        ...tableProbe(
            "U1g",
            "medium across 2 columns, the first of one given 1500",
            autoTable([[{ text: MEDIUM, span: 2 }], [{ text: "one", width: 1500 }, "two words"]]),
        ),
        // The merged cell given a width
        ...tableProbe(
            "U1h",
            "one given 6000 across 2 columns of one and two words",
            autoTable([[{ text: "one", span: 2, width: 6000 }], ["one", "two words"]]),
        ),
        // Two merged cells over a shared column, of different lengths: the order they are shared in
        ...tableProbe(
            "U1i",
            "shorter across columns 1-2, medium across 2-3, above one, two words, three short words",
            autoTable([
                [{ text: SHORTER, span: 2 }, "x"],
                ["x", { text: MEDIUM, span: 2 }],
                ["one", "two words", "three short words"],
            ]),
        ),
        // Text across 3 columns above text across 2 of them: whether the narrower is shared first. Shared first, the half
        // text leaves the long one little to share; shared in the rows' order, the long text widens the third column too
        ...tableProbe(
            "U1u",
            "longer across 3 columns, then half across columns 1-2, above one, two words, three short words",
            autoTable([[{ text: LONGER, span: 3 }], [{ text: HALF, span: 2 }, "x"], ["one", "two words", "three short words"]]),
        ),
    ],
    [
        // A table of 100% with a merged cell: widened in proportion to what
        ...tableProbe(
            "U1j",
            "100%: shorter across 2 columns of one and two words, beside three short words",
            autoTable(
                [
                    [{ text: SHORTER, span: 2 }, "three short words"],
                    ["one", "two words", "x"],
                ],
                { percent: 100 },
            ),
        ),
        // Long text across 3 columns, narrowed to the page
        ...tableProbe(
            "U1k",
            "long across 3 columns of 1.1, two words, three short words",
            autoTable([[{ text: LONG, span: 3 }], ["1.1", "two words", "three short words"]]),
        ),
        // A merged cell and a long column both narrowed
        ...tableProbe(
            "U1l",
            "long across 2 columns of one and two words, beside long",
            autoTable([
                [{ text: LONG, span: 2 }, LONG],
                ["one", "two words", "x"],
            ]),
        ),
        // A merged cell whose columns have long text too
        ...tableProbe("U1m", "a long word across 2 columns of half and long", autoTable([[{ text: WORD, span: 2 }], [HALF, LONG]])),
    ],
    [
        // Tables in cells
        ...tableProbe(
            "U1n",
            "a table of one and two words, beside one",
            autoTable([[{ children: [autoTable([["one", "two words"]], { nested: true }), line("")] }, "one"]]),
        ),
        ...tableProbe(
            "U1o",
            "a table of one and long, beside long",
            autoTable([[{ children: [autoTable([["one", LONG]], { nested: true }), line("")] }, LONG]]),
        ),
        ...tableProbe(
            "U1p",
            "a table 3000 wide of one and two words, beside two words",
            autoTable([[{ children: [autoTable([["one", "two words"]], { width: 3000, nested: true }), line("")] }, "two words"]]),
        ),
        ...tableProbe(
            "U1q",
            "a table of 100% of one and two words, beside two words",
            autoTable([[{ children: [autoTable([["one", "two words"]], { percent: 100, nested: true }), line("")] }, "two words"]]),
        ),
        ...tableProbe(
            "U1r",
            "three short words above a table of one, beside two words",
            autoTable([[{ children: [line("three short words"), autoTable([["one"]], { nested: true }), line("")] }, "two words"]]),
        ),
        ...tableProbe(
            "U1s",
            "a table of cells given 1500 and 1500, beside two words",
            autoTable([
                [
                    {
                        children: [
                            autoTable(
                                [
                                    [
                                        { text: "one", width: 1500 },
                                        { text: "two", width: 1500 },
                                    ],
                                ],
                                { nested: true },
                            ),
                            line(""),
                        ],
                    },
                    "two words",
                ],
            ]),
        ),
        ...tableProbe(
            "U1t",
            "a table of long, beside half",
            autoTable([[{ children: [autoTable([[LONG]], { nested: true }), line("")] }, HALF]]),
        ),
    ],
];

// ---------------------------------------------------------------------------------------------------------------------
// U2 to U8: one probe a page
// ---------------------------------------------------------------------------------------------------------------------

/** A table without borders or cell margins, as wide as the page, of rows of cells of these blocks */
const plainTable = (
    rows: readonly (readonly (readonly Child[])[])[],
    rowOptions: readonly Partial<ConstructorParameters<typeof TableRow>[0]>[] = [],
    cellOptions: (row: number, cell: number) => Partial<ConstructorParameters<typeof TableCell>[0]> = () => ({}),
    width = 9026,
): Table => {
    const cells = Math.max(...rows.map((row) => row.length));
    return new Table({
        width: { size: width, type: WidthType.DXA },
        columnWidths: Array.from({ length: cells }, () => Math.floor(width / cells)),
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (row, rowIndex) =>
                new TableRow({
                    ...rowOptions[rowIndex],
                    children: row.map(
                        (children, cellIndex) =>
                            new TableCell({
                                width: { size: Math.floor(width / cells), type: WidthType.DXA },
                                ...cellOptions(rowIndex, cellIndex),
                                children: [...children],
                            }),
                    ),
                }),
        ),
    });
};

/** A probe on a page of its own: its top line, fill lines up to the line given, then the rest */
const page = (name: string, before: number, ...rest: Child[]): ISectionOptions => ({
    children: [line(`${name} top`), ...fill(name, before - 2), ...rest],
});

const TWO = { count: 2, space: 720 };
/** A placeholder run's text, which the document's XML has replaced with a page break, so the break is in a 28-point run */
const PAGE_BREAK_28 = "PAGEBREAKPLACEHOLDER";
const THREE = { count: 3, space: 360 };

const sections: ISectionOptions[] = [
    ...U1.map((children) => ({ children })),

    // U2a: a 3-line footnote referred to from line L: 3, 2 and 1 of its lines fit below its reference
    ...[47, 48, 49].map((at) =>
        page(`U2a ${at}`, at, withNotes(`U2a ${at} ref`, footnote(lines(`U2a ${at} note`, 3))), ...fill(`U2a ${at} after`, 10)),
    ),
    // U2b: an 8-line footnote: 7 of its lines fit, and 1
    ...[43, 49].map((at) =>
        page(`U2b ${at}`, at, withNotes(`U2b ${at} ref`, footnote(lines(`U2b ${at} note`, 8))), ...fill(`U2b ${at} after`, 10)),
    ),
    // U2c: the same without widow control in the footnote
    ...[43, 49].map((at) =>
        page(
            `U2c ${at}`,
            at,
            withNotes(`U2c ${at} ref`, footnote(lines(`U2c ${at} note`, 8, { widowControl: false }))),
            ...fill(`U2c ${at} after`, 10),
        ),
    ),
    // U2d: a 2-line footnote, 1 of whose lines fits
    page("U2d 49", 49, withNotes("U2d 49 ref", footnote(lines("U2d 49 note", 2))), ...fill("U2d 49 after", 10)),
    // U2e: a 4-line footnote: 3, 2 and 1 of its lines fit
    ...[47, 48, 49].map((at) =>
        page(`U2e ${at}`, at, withNotes(`U2e ${at} ref`, footnote(lines(`U2e ${at} note`, 4))), ...fill(`U2e ${at} after`, 10)),
    ),
    // U2f: a footnote of 2 paragraphs of 4 lines: 6, 5, 4 and 2 of its lines fit
    ...[44, 45, 46, 48].map((at) =>
        page(
            `U2f ${at}`,
            at,
            withNotes(`U2f ${at} ref`, footnote(lines(`U2f ${at} note`, 4, {}, "first"), lines(`U2f ${at} note`, 4, {}, "second"))),
            ...fill(`U2f ${at} after`, 10),
        ),
    ),
    // U2g: a footnote of 3 one-line paragraphs: 2 and 1 fit
    ...[48, 49].map((at) =>
        page(
            `U2g ${at}`,
            at,
            withNotes(
                `U2g ${at} ref`,
                footnote(line(`U2g ${at} note para 1`), line(`U2g ${at} note para 2`), line(`U2g ${at} note para 3`)),
            ),
            ...fill(`U2g ${at} after`, 10),
        ),
    ),
    // U2h: a footnote of a line, a table of 4 one-line rows and a line: 3 and 1 of its lines fit
    ...[47, 49].map((at) =>
        page(
            `U2h ${at}`,
            at,
            withNotes(
                `U2h ${at} ref`,
                footnote(
                    line(`U2h ${at} note para`),
                    plainTable(Array.from({ length: 4 }, (_, i) => [[line(`U2h ${at} note row ${i + 1}`)]])),
                    line(`U2h ${at} note end`),
                ),
            ),
            ...fill(`U2h ${at} after`, 10),
        ),
    ),
    // U2j: a 4-line paragraph from line 46, with a reference to an 8-line footnote on its 1st or 3rd line. 3 of its lines
    // fit with 2 of the footnote's, which leaves the last alone on the next page, so widow control would keep 2 on this
    // page: with the reference on the 1st line, the footnote continued after 3 of its lines; on the 3rd, the reference's
    // line held back
    ...[1, 3].map((ref) =>
        page(
            `U2j 46 ref ${ref}`,
            46,
            linesWithNotes(`U2j 46 ref ${ref}`, 4, { [ref]: [footnote(lines(`U2j 46 ref ${ref} note`, 8))] }),
            ...fill(`U2j 46 ref ${ref} after`, 10),
        ),
    ),
    // U2k: a 4-line paragraph kept together from line L, with a reference to an 8-line footnote on its first line: it
    // doesn't fit whole, and only 2 of its lines fit with 2 of the footnote's
    ...[46, 47].map((at) =>
        page(
            `U2k ${at}`,
            at,
            linesWithNotes(`U2k ${at}`, 4, { 1: [footnote(lines(`U2k ${at} note`, 8))] }, { keepLines: true }),
            ...fill(`U2k ${at} after`, 10),
        ),
    ),
    // U2l: a line kept with the next, a one-line paragraph, with a reference to an 8-line footnote, on line L: they fit
    // together with 3 lines of the footnote, or 2
    ...[46, 47].map((at) =>
        page(
            `U2l ${at}`,
            at,
            new Paragraph({
                keepNext: true,
                spacing: { after: 0 },
                children: [new TextRun(`U2l ${at} ref`), footnote(lines(`U2l ${at} note`, 8))],
            }),
            line(`U2l ${at} next`),
            ...fill(`U2l ${at} after`, 10),
        ),
    ),
    // U2m: two references on line L: an 8-line footnote and a one-line one, in each order
    page(
        "U2m 45 long first",
        45,
        withNotes("U2m 45 long first ref", footnote(lines("U2m 45 long first note", 8)), footnote(line("U2m 45 long first short note"))),
        ...fill("U2m 45 long first after", 10),
    ),
    page(
        "U2m 45 short first",
        45,
        withNotes("U2m 45 short first ref", footnote(line("U2m 45 short first short note")), footnote(lines("U2m 45 short first note", 8))),
        ...fill("U2m 45 short first after", 10),
    ),
    // U2n: a reference to an 8-line footnote on line L, and to a one-line one on the next line
    page(
        "U2n 44",
        44,
        withNotes("U2n 44 ref long", footnote(lines("U2n 44 note", 8))),
        withNotes("U2n 44 ref short", footnote(line("U2n 44 short note"))),
        ...fill("U2n 44 after", 10),
    ),
    // U2o: a 120-line footnote referred to from line 5, with 100 lines after
    page("U2o 5", 5, withNotes("U2o 5 ref", footnote(lines("U2o 5 note", 120))), ...fill("U2o 5 after", 100)),
    // U2p: a 30-line footnote referred to from line 40: 10 lines fit, and 20 go on the next page
    page("U2p 40", 40, withNotes("U2p 40 ref", footnote(lines("U2p 40 note", 30))), ...fill("U2p 40 after", 60)),
    // U2q: a 60-line footnote referred to from line 45
    page("U2q 45", 45, withNotes("U2q 45 ref", footnote(lines("U2q 45 note", 60))), ...fill("U2q 45 after", 60)),

    // U3a: a one-line row referring to a one-line footnote on line L: it fits with its footnote on 49, and not on 50 or 51
    ...[49, 50, 51].map((at) =>
        page(
            `U3a ${at}`,
            at,
            plainTable([[[withNotes(`U3a ${at} row`, footnote(line(`U3a ${at} note`)))]]]),
            ...fill(`U3a ${at} after`, 10),
        ),
    ),
    // U3b: a one-line row referring to an 8-line footnote on line 46: 4 lines of the footnote fit below it
    page("U3b 46", 46, plainTable([[[withNotes("U3b 46 row", footnote(lines("U3b 46 note", 8)))]]]), ...fill("U3b 46 after", 10)),
    // U3c: a row of a 6-line cell from line 48, referring to one-line footnotes from its lines 1 and 5
    page(
        "U3c 48",
        48,
        plainTable([[[linesWithNotes("U3c 48", 6, { 1: [footnote(line("U3c 48 note A"))], 5: [footnote(line("U3c 48 note B"))] })]]]),
        ...fill("U3c 48 after", 10),
    ),
    // U3d: a row of a 6-line cell from line 44, referring to an 8-line footnote from its line 2
    page(
        "U3d 44",
        44,
        plainTable([[[linesWithNotes("U3d 44", 6, { 2: [footnote(lines("U3d 44 note", 8))] })]]]),
        ...fill("U3d 44 after", 10),
    ),
    // U3e: a row of two 4-line cells from line 49, the right referring to a one-line footnote from its line 3
    page(
        "U3e 49",
        49,
        plainTable([[[lines("U3e 49 left", 4)], [linesWithNotes("U3e 49 right", 4, { 3: [footnote(line("U3e 49 note"))] })]]]),
        ...fill("U3e 49 after", 10),
    ),

    // U4a: 2 rows, the left cell merged down both with 8 lines, the right cells of one line, from line 47
    page(
        "U4a 47",
        47,
        plainTable(
            [
                [[lines("U4a 47 merged", 8)], [line("U4a 47 right 1")]],
                [[line("")], [line("U4a 47 right 2")]],
            ],
            [],
            (row, cell) => (cell === 0 ? { verticalMerge: row === 0 ? "restart" : "continue" } : {}),
        ),
        line("U4a 47 after"),
        ...fill("U4a 47 after", 10),
    ),
    // U4b: 3 rows, the left cell merged down the first 2 with 3 lines, the first right cell of 6 lines, from line 48
    page(
        "U4b 48",
        48,
        plainTable(
            [
                [[lines("U4b 48 merged", 3)], [lines("U4b 48 right", 6)]],
                [[line("")], [line("U4b 48 right row 2")]],
                [[line("U4b 48 left row 3")], [line("U4b 48 right row 3")]],
            ],
            [],
            (row, cell) => (cell === 0 && row < 2 ? { verticalMerge: row === 0 ? "restart" : "continue" } : {}),
        ),
        ...fill("U4b 48 after", 10),
    ),
    // U4c: a row of a line, a table of 6 one-line rows and a line, from line 47
    page(
        "U4c 47",
        47,
        plainTable([
            [
                [
                    line("U4c 47 before"),
                    plainTable(
                        Array.from({ length: 6 }, (_, i) => [[line(`U4c 47 inner row ${i + 1}`)]]),
                        [],
                        () => ({}),
                        9026,
                    ),
                    line("U4c 47 after table"),
                ],
            ],
        ]),
        ...fill("U4c 47 after", 10),
    ),
    // U4d: a row of a table whose one row has a 4-line cell, from line 49 (the row's 2 lines after its first fit)
    page(
        "U4d 49",
        49,
        plainTable([[[line("U4d 49 before"), plainTable([[[lines("U4d 49 inner", 4)]]]), line("U4d 49 after table")]]]),
        ...fill("U4d 49 after", 10),
    ),
    // U4e: a row of 2 lines at least 2700 high (10 lines), from line 46: its text fits, and not its height
    page(
        "U4e 46",
        46,
        plainTable([[[lines("U4e 46", 2)]]], [{ height: { value: 2700, rule: HeightRule.ATLEAST } }]),
        line("U4e 46 below"),
        ...fill("U4e 46 after", 10),
    ),
    // U4f: a row of 8 lines (2148) at least 2700 high, from line 46: neither fits
    page(
        "U4f 46",
        46,
        plainTable([[[lines("U4f 46", 8)]]], [{ height: { value: 2700, rule: HeightRule.ATLEAST } }]),
        line("U4f 46 below"),
        ...fill("U4f 46 after", 10),
    ),
    // U4g: a row of 2 lines exactly 2700 high, from line 46
    page(
        "U4g 46",
        46,
        plainTable([[[lines("U4g 46", 2)]]], [{ height: { value: 2700, rule: HeightRule.EXACT } }]),
        line("U4g 46 below"),
        ...fill("U4g 46 after", 10),
    ),

    // U5a: a row that can't break, of 60 lines, from line 11
    page("U5a 11", 11, plainTable([[[lines("U5a 11", 60)]]], [{ cantSplit: true }]), line("U5a 11 below"), ...fill("U5a 11 after", 10)),
    // U5b: the same at the top of a page
    { children: [plainTable([[[lines("U5b 1", 60)]]], [{ cantSplit: true }]), line("U5b 1 below"), ...fill("U5b 1 after", 10)] },
    // U5c: a row of 3 lines exactly 15000 high, taller than the page, from line 11
    page(
        "U5c 11",
        11,
        plainTable([[[lines("U5c 11", 3)]]], [{ height: { value: 15000, rule: HeightRule.EXACT } }]),
        line("U5c 11 below"),
        ...fill("U5c 11 after", 10),
    ),
    // U5d: a row of 3 lines at least 15000 high, from line 11
    page(
        "U5d 11",
        11,
        plainTable([[[lines("U5d 11", 3)]]], [{ height: { value: 15000, rule: HeightRule.ATLEAST } }]),
        line("U5d 11 below"),
        ...fill("U5d 11 after", 10),
    ),

    // U6a: 2 columns, with references to one-line footnotes from lines 5 and 10 of the first column only
    {
        properties: { column: TWO },
        children: [
            line("U6a top"),
            ...fill("U6a", 3),
            withNotes("U6a ref one", footnote(line("U6a note one"))),
            ...fill("U6a", 4, 4),
            withNotes("U6a ref two", footnote(line("U6a note two"))),
            ...fill("U6a", 110, 8),
        ],
    },
    // U6b: 2 columns, with a reference to a one-line footnote from line 5 of the second column only
    {
        properties: { column: TWO },
        children: [line("U6b top"), ...fill("U6b", 54), withNotes("U6b ref", footnote(line("U6b note"))), ...fill("U6b", 60, 55)],
    },
    // U6c: 2 columns, with references from line 5 of the first column, and lines 5 and 10 of the second
    {
        properties: { column: TWO },
        children: [
            line("U6c top"),
            ...fill("U6c", 3),
            withNotes("U6c ref one", footnote(line("U6c note one"))),
            ...fill("U6c", 50, 4),
            withNotes("U6c ref two", footnote(line("U6c note two"))),
            ...fill("U6c", 4, 54),
            withNotes("U6c ref three", footnote(line("U6c note three"))),
            ...fill("U6c", 60, 58),
        ],
    },
    // U6d: 3 columns, with a reference from line 5 of the third column only
    {
        properties: { column: THREE },
        children: [line("U6d top"), ...fill("U6d", 105), withNotes("U6d ref", footnote(line("U6d note"))), ...fill("U6d", 60, 106)],
    },
    // U6e: 2 columns, with a reference from line 5 of the first column to a footnote of prose, which wraps at the
    // column's width or the page's
    {
        properties: { column: TWO },
        children: [line("U6e top"), ...fill("U6e", 3), withNotes("U6e ref", footnote(prose("U6e note", 60))), ...fill("U6e", 110, 4)],
    },

    // U7a: a continuous section whose first paragraph has a page break before it and 1440 before, after 5 lines
    { children: [line("U7a top"), ...fill("U7a", 4)] },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("U7a first before 1440", { pageBreakBefore: true, spacing: { before: 1440 } }), line("U7a next")],
    },
    // U7b: the same with 100 before
    { children: [line("U7b top"), ...fill("U7b", 4)] },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("U7b first before 100", { pageBreakBefore: true, spacing: { before: 100 } }), line("U7b next")],
    },
    // U7c: the same with 1440 before, after a last paragraph with 800 after
    { children: [line("U7c top"), ...fill("U7c", 3), line("U7c last after 800", { spacing: { after: 800 } })] },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("U7c first before 1440", { pageBreakBefore: true, spacing: { before: 1440 } }), line("U7c next")],
    },
    // U7d: a continuous section with 1440 before its first paragraph, after a page break at the end of the section before
    {
        children: [
            line("U7d top"),
            ...fill("U7d", 3),
            new Paragraph({ spacing: { after: 0 }, children: [new TextRun("U7d last"), new PageBreak()] }),
        ],
    },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("U7d first before 1440", { spacing: { before: 1440 } }), line("U7d next")],
    },
    // U7e: a new-page section's first paragraph with a page break before it and 1440 before, as word-rules2's Q2c, to
    // compare
    { children: [line("U7e top"), ...fill("U7e", 4)] },
    { children: [line("U7e first before 1440", { pageBreakBefore: true, spacing: { before: 1440 } }), line("U7e next")] },

    // U8a: lines of only spaces ended by a line break, below "U8a top" and above "U8a after", with an 11-point mark
    {
        children: [
            line("U8a top"),
            ...[
                // 1: 20-point spaces, and the break in the same run; 2: 20-point spaces and an 8-point break; 3: 8-point
                // spaces and break; 4: an empty 20-point break; 5: five lines of 20-point spaces and break
                ["U8a1", [new TextRun({ text: "     ", size: 40 }), new TextRun({ break: 1, size: 40 })]],
                ["U8a2", [new TextRun({ text: "     ", size: 40 }), new TextRun({ break: 1, size: 16 })]],
                ["U8a3", [new TextRun({ text: "     ", size: 16 }), new TextRun({ break: 1, size: 16 })]],
                ["U8a4", [new TextRun({ break: 1, size: 40 })]],
                [
                    "U8a5",
                    Array.from({ length: 5 }, () => [new TextRun({ text: "     ", size: 40 }), new TextRun({ break: 1, size: 40 })]).flat(),
                ],
            ].flatMap(([name, runs]) => [
                line(`${name} above`),
                new Paragraph({ spacing: { after: 0 }, children: [...(runs as TextRun[]), new TextRun(`${name} after break`)] }),
            ]),
            line("U8a end"),
        ],
    },
    // U8a6: 28-point spaces before a page break of the paragraph's size, on line 51, where an 11-point line fits and a
    // 28-point one doesn't. U8a7: the same with the page break 28-point too (written over a placeholder run)
    page(
        "U8a6 51",
        51,
        new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "     ", size: 56 }), new PageBreak()] }),
        line("U8a6 51 after page break"),
    ),
    page(
        "U8a7 51",
        51,
        new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: "     ", size: 56 }), new TextRun({ text: PAGE_BREAK_28, size: 56 })],
        }),
        line("U8a7 51 after page break"),
    ),
    // U8b: from line L, a row whose left cell's first line doesn't fit, beside a right cell whose lines do. 1: a left cell
    // of 2 lines of 28-point text, 2: of a line with 900 before, 3: of 28-point text beside a 4-line paragraph without
    // widow control
    page(
        "U8b1 51",
        51,
        plainTable([
            [
                [
                    new Paragraph({
                        spacing: { after: 0 },
                        children: [
                            new TextRun({ text: "U8b1 51 big 1", size: 56 }),
                            new TextRun({ text: "U8b1 51 big 2", size: 56, break: 1 }),
                        ],
                    }),
                ],
                [line("U8b1 51 right 1"), line("U8b1 51 right 2"), line("U8b1 51 right 3")],
            ],
        ]),
        ...fill("U8b1 51 after", 10),
    ),
    page(
        "U8b2 50",
        50,
        plainTable([
            [
                [line("U8b2 50 spaced", { spacing: { before: 900 } })],
                [line("U8b2 50 right 1"), line("U8b2 50 right 2"), line("U8b2 50 right 3"), line("U8b2 50 right 4")],
            ],
        ]),
        ...fill("U8b2 50 after", 10),
    ),
    page(
        "U8b3 51",
        51,
        plainTable([
            [
                [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "U8b3 51 big", size: 56 })] })],
                [lines("U8b3 51 right", 4, { widowControl: false })],
            ],
        ]),
        ...fill("U8b3 51 after", 10),
    ),
    // U8c: a row of a 60-line paragraph kept together. 1: from line 11, 2: at the top of a page, 3: from line 11 beside a
    // one-line cell
    page("U8c1 11", 11, plainTable([[[lines("U8c1 11", 60, { keepLines: true })]]]), line("U8c1 11 below"), ...fill("U8c1 11 after", 10)),
    { children: [plainTable([[[lines("U8c2 1", 60, { keepLines: true })]]]), line("U8c2 1 below"), ...fill("U8c2 1 after", 10)] },
    page(
        "U8c3 11",
        11,
        plainTable([[[lines("U8c3 11", 60, { keepLines: true })], [line("U8c3 11 right")]]]),
        line("U8c3 11 below"),
        ...fill("U8c3 11 after", 10),
    ),
    { children: [line("End of the probes")] },
];

export const probeDocument = (options: Partial<ConstructorParameters<typeof Document>[0]> = {}): Document =>
    new Document({
        ...options,
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
        },
        footnotes,
        sections,
    });

/** The document's file, with the placeholder runs of U8a7 made page breaks */
export const probeBuffer = async (document: Document = probeDocument()): Promise<Buffer> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    const xml = await zip.file("word/document.xml")!.async("string");
    const placeholder = new RegExp(`<w:t xml:space="preserve">${PAGE_BREAK_28}</w:t>`, "g");
    zip.file("word/document.xml", xml.replace(placeholder, '<w:br w:type="page"/>'));
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
};

if (process.argv[1]?.endsWith("word-probes.ts")) {
    const output = process.argv[2] ?? "build/word-probes/word-probes.docx";
    fs.mkdirSync(path.dirname(output), { recursive: true });
    probeBuffer().then((buffer) => fs.writeFileSync(output, buffer));
}
