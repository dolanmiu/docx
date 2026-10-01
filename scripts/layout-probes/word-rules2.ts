// cspell:ignore bbox
// More probes of Word's layout rules, after word-rules.ts. Each line's text names its probe, so the lines can be found in
// a PDF saved from Word with pdftotext -bbox-layout. Calibri 11, single spaced. Every probe line has no space after, but
// Normal has 200 after, so the empty paragraph docx writes at the end of each section has 200 after.
//
// Q1: contextual spacing, 200 after and 400 before, contextual on each in turn
// Q2: the space before the first paragraph of a section that starts on a new page, after the empty paragraph's 200 after
// Q3: keepLines, and cells of different lengths, in a table row that breaks across pages
// Q4: a table's header rows in the second column
// Q5: sections that start in the next column
// Q6: footnotes in columns
// Q7: columns of different widths, and evened out before a continuous section break
import * as fs from "fs";
import {
    Column,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    Packer,
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

const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { after: 0, ...options.spacing }, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0 },
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
/** A paragraph of words that wraps, starting with its probe's name */
const prose = (probe: string, words: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0 },
        children: [new TextRun(`${probe} ${Array.from({ length: words }, (_, i) => WORDS[(i * 5) % WORDS.length]).join(" ")}`)],
    });

/** A table without borders or cell margins, of rows of cells of these paragraphs */
const table = (width: number, rows: readonly (readonly (readonly Paragraph[])[])[], header = 0): Table => {
    const cells = rows[0].length;
    return new Table({
        width: { size: width, type: WidthType.DXA },
        columnWidths: Array.from({ length: cells }, () => Math.floor(width / cells)),
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (row, index) =>
                new TableRow({
                    tableHeader: index < header,
                    children: row.map(
                        (children) =>
                            new TableCell({ width: { size: Math.floor(width / cells), type: WidthType.DXA }, children: [...children] }),
                    ),
                }),
        ),
    });
};

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
const footnote = (paragraph: Paragraph): FootnoteReferenceRun => {
    footnoteId++;
    footnotes[footnoteId] = { children: [paragraph] };
    return new FootnoteReferenceRun(footnoteId);
};

// A4 with 1440 margins: 9026 twips of text, 51 lines of Calibri 11 to a page
const TWO = { count: 2, space: 720 };
const THREE = { count: 3, space: 360 };
const HALF = (9026 - 720) / 2;
const UNEQUAL = { count: 2, equalWidth: false, children: [new Column({ width: 2000, space: 720 }), new Column({ width: 6306 })] };

const sections: ISectionOptions[] = [
    // Q1: the space between two paragraphs of the same style, with contextual spacing on one of them. The paragraphs of
    // each probe follow each other, and a line with no space around it follows each probe
    {
        children: [
            line("Q1 top"),
            line("Q1a first after 200 contextual", { spacing: { after: 200 }, contextualSpacing: true }),
            line("Q1a second before 400", { spacing: { before: 400 } }),
            line("Q1b first after 200", { spacing: { after: 200 } }),
            line("Q1b second before 400 contextual", { spacing: { before: 400 }, contextualSpacing: true }),
            line("Q1c first after 400 contextual", { spacing: { after: 400 }, contextualSpacing: true }),
            line("Q1c second before 400", { spacing: { before: 400 } }),
            line("Q1d first after 400", { spacing: { after: 400 } }),
            line("Q1d second before 400 contextual", { spacing: { before: 400 }, contextualSpacing: true }),
            line("Q1e first after 200", { spacing: { after: 200 } }),
            line("Q1e second before 400", { spacing: { before: 400 } }),
            line("Q1 end"),
        ],
    },

    // Q2: the first paragraph of a section on a new page, below the empty paragraph that ends the section before, with
    // its 200 after
    { children: [line("Q2a section start before 1440", { spacing: { before: 1440 } }), line("Q2a next")] },
    { children: [line("Q2b section start before 100", { spacing: { before: 100 } }), line("Q2b next")] },
    { children: [line("Q2c page break before, before 1440", { pageBreakBefore: true, spacing: { before: 1440 } }), line("Q2c next")] },

    // Q3: a row of 4 lines that breaks across pages after k lines. a: keepLines without widow control, b: neither, c: a
    // cell of a 4-line paragraph beside one of 3 one-line paragraphs, with widow control, after 50 lines
    {
        children: [
            line("Q3a top"),
            ...fill("Q3a", 47),
            table(9026, [[[lines("Q3a", 4, { keepLines: true, widowControl: false })]]]),
            line("Q3a after"),
        ],
    },
    {
        children: [line("Q3b top"), ...fill("Q3b", 47), table(9026, [[[lines("Q3b", 4, { widowControl: false })]]]), line("Q3b after")],
    },
    {
        children: [
            line("Q3c top"),
            ...fill("Q3c", 49),
            table(9026, [[[lines("Q3c left", 4)], [line("Q3c right 1"), line("Q3c right 2"), line("Q3c right 3")]]]),
            line("Q3c after"),
        ],
    },

    // Q4: a table with a header row, of 70 one-line rows in 2 columns: whether the header is repeated in the second
    {
        properties: { column: TWO },
        children: [
            table(HALF, [[[line("Q4 header")]], ...Array.from({ length: 70 }, (_, i) => [[line(`Q4 row ${i + 1}`)]])], 1),
            line("Q4 after"),
        ],
    },

    // Q5: a section that starts in the next column. a: 2 columns after 2, b: 3 after 2, c: 2 after 1, d: 2 after 2 whose
    // second column is already started
    { properties: { column: TWO }, children: fill("Q5a first", 5) },
    { properties: { type: SectionType.NEXT_COLUMN, column: TWO }, children: fill("Q5a second", 3) },
    { properties: { column: TWO }, children: fill("Q5b first", 5) },
    { properties: { type: SectionType.NEXT_COLUMN, column: THREE }, children: fill("Q5b second", 3) },
    { children: fill("Q5c first", 5) },
    { properties: { type: SectionType.NEXT_COLUMN, column: TWO }, children: fill("Q5c second", 3) },
    { properties: { column: TWO }, children: fill("Q5d first", 55) },
    { properties: { type: SectionType.NEXT_COLUMN, column: TWO }, children: fill("Q5d second", 3) },

    // Q6: footnotes in columns. a: a reference on the 5th line of each of 2 columns of a full page, b: one on the 2nd of
    // 10 lines in 2 columns evened out before a continuous section break
    {
        properties: { column: TWO },
        children: [
            line("Q6a top"),
            ...fill("Q6a", 3),
            new Paragraph({ spacing: { after: 0 }, children: [new TextRun("Q6a ref one"), footnote(line("Q6a note one"))] }),
            ...fill("Q6a", 50, 4),
            new Paragraph({ spacing: { after: 0 }, children: [new TextRun("Q6a ref two"), footnote(line("Q6a note two"))] }),
            ...fill("Q6a", 60, 54),
        ],
    },
    { children: [line("Q6b top")] },
    {
        properties: { type: SectionType.CONTINUOUS, column: TWO },
        children: [
            line("Q6b line 1"),
            new Paragraph({ spacing: { after: 0 }, children: [new TextRun("Q6b ref"), footnote(line("Q6b note"))] }),
            ...fill("Q6b", 8, 3),
        ],
    },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("Q6b after")] },

    // Q7: 2 columns of 2000 and 6306 twips. a: a page of text across both, b: 12 one-line paragraphs evened out before a
    // continuous section break, c: a paragraph that wraps, evened out the same way
    { properties: { column: UNEQUAL }, children: [prose("Q7a", 900)] },
    { children: [line("Q7b top")] },
    { properties: { type: SectionType.CONTINUOUS, column: UNEQUAL }, children: fill("Q7b", 12) },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("Q7b after")] },
    { children: [line("Q7c top")] },
    { properties: { type: SectionType.CONTINUOUS, column: UNEQUAL }, children: [prose("Q7c", 150)] },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("Q7c after")] },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
    },
    footnotes,
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-rules2.docx", buffer));
