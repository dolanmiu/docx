// cspell:ignore bbox
// Probes of where Word puts things on a page, for layoutDocument from docx/layout, which gives each line's position. Each
// line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout. Calibri
// 11, single spaced, no space after, on A4 with 1440 margins: 9026 twips of text.
//
// H1 to H3: the header and footer of the blank page Word adds so a section starts on an odd or even page. Each header and
// footer names its section and the pages it is for, and each footer shows its page's number.
//   H1: section 1 ends on page 1, and section 2 starts on an odd page, with a first page header of its own: page 2 is blank
//   H2: section 2 ends on page 4, and section 3 starts on an even page: page 5 is blank
//   H3: section 4 starts on an even page and its numbers start at 2, after section 3 ends on page 6: whether Word adds a
//       blank page by the page's number, which is even, or by its place, which is odd
// X1 to X9: where the lines start across the page
//   X1: left indent 720, first line 360. X2: left 720, hanging 360. X3: right indent 1440
//   X4: centred. X5: right aligned. X6: a numbered list item. X7: a right tab stop at the margin, typed as \t in the text
//   X8: a table of 2 columns, with borders and Word's cell margins. X9: 2 columns, 720 apart, evened out
// Y1: a footnote, at the bottom of the page
//
// What Word showed, in word-positions.pdf, saved from Word 16 for Mac on 2026-10-01 and read with word-positions.py:
//
// - H1, H2: the blank pages 2 and 5 have no header or footer. Page 3, the first of a section with a first page header, has
//   it, where LibreOffice has the default one
// - H3: Word adds a blank page 7, so section 4 starts on page 8, numbered 2. LibreOffice does the same
// - X1 to X9 and Y1: each line starts where its paragraph's indents, its column and the margin put it, to within 0.2
//   points. Centred and right-aligned lines start where their room and their text's width put them, and the right tab's
//   text ends at the margin. The second column starts at 315.6 points, the margin, a column and the space between. The
//   footnote's last line ends at the bottom margin. Each line's top is within 3 twips of docx/layout's, which Word's PDF
//   puts text on a grid of 4.8 twips to. Before #3616, when docx/layout rounded line heights to whole twips, they drifted
//   up from it by 0.45 twips a line, as Word's Calibri 11 is 268.55 twips tall
//
// Usage: npm run run-ts -- scripts/layout-probes/word-positions.ts
import * as fs from "fs";
import {
    AlignmentType,
    Document,
    Footer,
    FootnoteReferenceRun,
    Header,
    type ISectionOptions,
    LevelFormat,
    Packer,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TabStopType,
    TextRun,
    WidthType,
} from "docx";

import { layoutDocument } from "../../src/layout";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
/** A paragraph of words that wraps, starting with its probe's name */
const prose = (probe: string, words: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: [new TextRun(`${probe} ${Array.from({ length: words }, (_, i) => WORDS[(i * 5) % WORDS.length]).join(" ")}`)],
    });

/** The headers and footers of a section, each naming the section and the pages it is for, and the footers the page */
const parts = (section: string, kinds: readonly ("default" | "first" | "even")[]): Pick<ISectionOptions, "headers" | "footers"> => ({
    headers: Object.fromEntries(kinds.map((kind) => [kind, new Header({ children: [line(`${section} header ${kind}`)] })])),
    footers: Object.fromEntries(
        kinds.map((kind) => [
            kind,
            new Footer({
                children: [
                    new Paragraph({ children: [new TextRun({ children: [`${section} footer ${kind} page `, PageNumber.CURRENT] })] }),
                ],
            }),
        ]),
    ),
});

const cell = (...texts: readonly string[]): TableCell =>
    new TableCell({ width: { size: 4513, type: WidthType.DXA }, children: texts.map((text) => line(text)) });

const sections: ISectionOptions[] = [
    { ...parts("S1", ["default", "even"]), children: [line("H1 section 1 page 1")] },
    {
        properties: { type: SectionType.ODD_PAGE, titlePage: true },
        ...parts("S2", ["default", "even", "first"]),
        children: [line("H1 section 2 first page"), line("H2 section 2 second page", { pageBreakBefore: true })],
    },
    {
        properties: { type: SectionType.EVEN_PAGE },
        ...parts("S3", ["default", "even"]),
        children: [line("H2 section 3 first page")],
    },
    {
        properties: { type: SectionType.EVEN_PAGE, page: { pageNumbers: { start: 2 } } },
        ...parts("S4", ["default", "even"]),
        children: [line("H3 section 4 first page")],
    },
    {
        ...parts("S5", ["default", "even"]),
        children: [
            prose("X1", 40, { indent: { left: 720, firstLine: 360 } }),
            prose("X2", 40, { indent: { left: 720, hanging: 360 } }),
            prose("X3", 40, { indent: { right: 1440 } }),
            prose("X4", 30, { alignment: AlignmentType.CENTER }),
            prose("X5", 30, { alignment: AlignmentType.RIGHT }),
            prose("X6", 30, { numbering: { reference: "x6", level: 0 } }),
            new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [new TextRun("X7 left\tX7 right")] }),
            new Table({
                columnWidths: [4513, 4513],
                rows: [
                    new TableRow({ children: [cell("X8 row 1 left"), cell("X8 row 1 right")] }),
                    new TableRow({ children: [cell("X8 row 2 left 1", "X8 row 2 left 2"), cell("X8 row 2 right")] }),
                    new TableRow({ children: [cell("X8 row 3 left"), cell("X8 row 3 right")] }),
                ],
            }),
            new Paragraph({ children: [new TextRun("Y1 reference"), new FootnoteReferenceRun(1), new TextRun(" after it")] }),
            line("X9 top"),
        ],
    },
    { properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } }, children: [prose("X9", 120)] },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("X9 after")] },
];

const doc = new Document({
    evenAndOddHeaderAndFooters: true,
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    numbering: {
        config: [
            {
                reference: "x6",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                    },
                ],
            },
        ],
    },
    footnotes: { 1: { children: [prose("Y1 note", 30)] } },
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
// What docx/layout puts on each page, which word-positions.py compares with a PDF of the document
fs.writeFileSync("build/word-probes/word-positions.layout.json", JSON.stringify(layoutDocument(doc), undefined, 1));
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-positions.docx", buffer));
