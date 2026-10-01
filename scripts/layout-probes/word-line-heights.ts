/**
 * Probes of how tall Word makes lines, and how it breaks table rows across pages, for docx/layout. Each probe starts a
 * page, and each line's text names its probe, so the lines can be found in a PDF saved from Word with
 * pdftotext -bbox-layout, which word-line-heights.py reads. Calibri 11, single spaced, no space before or after, on A4
 * with 1440 margins, so the text is 1440 to 15398 twips down the page and Word's lines are 268.55 twips.
 *
 * H: a page of one-line paragraphs in each font, size and line spacing, whose lines are measured over the page
 * T1: a row that breaks across pages where its 4th line fits, but not with a border below it, and which border
 * T2: a cell's paragraph whose lines fit on the page, but not its space after
 * T3: rows of an at-least height that break across pages, with less room than their height, and more
 * T4: a page that ends between rows, with less room below the last than a border
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    BorderStyle,
    Document,
    HeightRule,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

// Calibri 11's lines in Word, in twips
const LINE = (2500 / 2048) * 220;
const TOP = 1440;
const BOTTOM = 16838 - 1440;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

/**
 * The first lines of a probe, which put what follows them `at` twips down the page: a line naming the probe, and lines
 * after it, the last of them with the space after that makes up the rest
 */
const lead = (probe: string, at: number): Paragraph[] => {
    const count = Math.floor((at - TOP) / LINE);
    const after = Math.round(at - TOP - count * LINE);
    return Array.from({ length: count }, (_, i) =>
        line(i === 0 ? `${probe} top` : `${probe} fill ${i}`, i === count - 1 ? { spacing: { after } } : {}),
    );
};

/** Borders of these widths, in eighths of a point */
const borders = (top: number, between: number, bottom: number) => {
    const border = (size: number) =>
        size === 0 ? { style: BorderStyle.NONE, size: 0, color: "auto" } : { style: BorderStyle.SINGLE, size, color: "000000" };
    return {
        top: border(top),
        bottom: border(bottom),
        left: border(4),
        right: border(4),
        insideHorizontal: border(between),
        insideVertical: border(4),
    };
};
const EIGHTHS_IN_TWIPS = 20 / 8;

/** A table of rows of cells of these paragraphs, without cell margins */
const table = (
    rows: readonly (readonly Paragraph[][])[],
    options: { readonly borders?: ReturnType<typeof borders>; readonly height?: number } = {},
): Table => {
    const width = Math.floor(9026 / rows[0].length);
    return new Table({
        width: { size: width * rows[0].length, type: WidthType.DXA },
        columnWidths: rows[0].map(() => width),
        borders: options.borders ?? TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (cells) =>
                new TableRow({
                    ...(options.height === undefined ? {} : { height: { value: options.height, rule: HeightRule.ATLEAST } }),
                    children: cells.map((children) => new TableCell({ width: { size: width, type: WidthType.DXA }, children })),
                }),
        ),
    });
};

// More lines than fit on a page of the smallest of them
const FILL = 80;
const page = (probe: string, options: Options, run: { readonly font?: string; readonly size?: number } = {}): ISectionOptions => ({
    children: Array.from(
        { length: FILL },
        (_, i) => new Paragraph({ ...options, run, children: [new TextRun({ text: `${probe} ${i + 1}`, ...run })] }),
    ),
});

/**
 * T1: a row of 6 lines after a one-line row, with borders of these widths in eighths of a point, which puts its 4th line
 * `slack` twips above the bottom of the page
 */
const breakBorder = (probe: string, top: number, between: number, bottom: number, slack: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - slack - 5 * LINE - (top + between) * EIGHTHS_IN_TWIPS),
        table([[[line(`${probe} row 1`)]], [[lines(probe, 6)]], [[line(`${probe} row 3`)]]], { borders: borders(top, between, bottom) }),
        line(`${probe} after`),
    ],
});

/** T2: a row whose first cell's paragraph of 4 lines, with `after` twips after it, ends 200 twips above the bottom */
const spaceAfter = (probe: string, after: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - 200 - 4 * LINE),
        table([[[lines(`${probe} left`, 4, { spacing: { after } }), line(`${probe} left next`)], [lines(`${probe} right`, 10)]]]),
        line(`${probe} after`),
    ],
});

/** T3: a row of an at-least height of 2000 twips, of a cell of these lines, with `room` twips for it on the page */
const atLeast = (probe: string, count: number, room: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - room),
        table([[[lines(probe, count)], [line(`${probe} right`)]]], { height: 2000 }),
        line(`${probe} after`),
    ],
});

/** T4: one-line rows with borders of this width between them, the 5th of which ends `slack` twips above the bottom */
const betweenRows = (probe: string, size: number, slack: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - slack - 5 * (LINE + size * EIGHTHS_IN_TWIPS)),
        table(
            Array.from({ length: 8 }, (_, i) => [[line(`${probe} row ${i + 1}`)]]),
            { borders: borders(size, size, size) },
        ),
        line(`${probe} after`),
    ],
});

const sections: ISectionOptions[] = [
    // H: a page of lines of each font and line spacing, with the paragraph marks in the same font
    page("Ha Times New Roman 10", {}, { font: "Times New Roman", size: 20 }),
    page("Hb Cambria 11", {}, { font: "Cambria", size: 22 }),
    page("Hc Arial 11", {}, { font: "Arial", size: 22 }),
    page("Hd Courier New 11", {}, { font: "Courier New", size: 22 }),
    page("He Calibri 8", {}, { size: 16 }),
    page("Hf multiple 1.15", { spacing: { line: 276, lineRule: LineRuleType.AUTO } }),
    page("Hg multiple 1.5", { spacing: { line: 360, lineRule: LineRuleType.AUTO } }),
    page(
        "Hh Times New Roman 10 multiple 1.15",
        { spacing: { line: 276, lineRule: LineRuleType.AUTO } },
        { font: "Times New Roman", size: 20 },
    ),

    // T1: a: 3-point borders and 30 twips to spare, b: 90 to spare, c: half-point borders and 5 to spare, d: 3 points
    // between rows and half a point at the bottom, e: the other way round
    breakBorder("T1a", 24, 24, 24, 30),
    breakBorder("T1b", 24, 24, 24, 90),
    breakBorder("T1c", 4, 4, 4, 5),
    breakBorder("T1d", 24, 24, 4, 30),
    breakBorder("T1e", 4, 4, 24, 30),

    // T2: a: 400 after, more than the 200 to spare, b: 100 after
    spaceAfter("T2a", 400),
    spaceAfter("T2b", 100),
    // T2c: the same paragraph with 400 after outside a table
    { children: [...lead("T2c", BOTTOM - 200 - 4 * LINE), lines("T2c", 4, { spacing: { after: 400 } }), line("T2c after")] },

    // T3: a: 10 lines with room for 4, b: room for 8, more than the row's height, c: 8 lines with room for 7, which
    // widow control makes 6, less than its height, d: 3 lines, shorter than its height, with room for 4
    atLeast("T3a", 10, 1300),
    atLeast("T3b", 10, 2200),
    atLeast("T3c", 8, 2100),
    atLeast("T3d", 3, 1300),

    // T4: a: 3-point borders and 30 twips to spare below the 5th row, b: half-point borders and 5 to spare
    betweenRows("T4a", 24, 30),
    betweenRows("T4b", 4, 5),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-line-heights.docx", buffer));
