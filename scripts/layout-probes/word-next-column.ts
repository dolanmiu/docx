// Probes of how Word starts a section in the next column (SectionType.NEXT_COLUMN), after word-rules2.ts's Q5. Each
// line's text names its probe, so word-next-column.py can find the lines in pdftotext's HTML of a PDF saved from Word.
// Calibri 11, single spaced, on A4 with 1440 margins. Every probe line has no space after, but Normal has 200 after, so
// the empty paragraph docx writes at the end of each section has 200 after. Each probe starts on a new page.
//
// N1: the space before the first paragraph of a section in the next column: 1440 before, after the empty paragraph's 200
// N2: the same with 100 before
// N3: 2 columns after 3, with columns left
// N4: 2 columns after 2 of other widths, 720 and 1440 apart
// N5: 3 columns after 3, and then 3 more after those, in the second and third columns
// N6: a section in the next column after columns that start below a line, and a continuous section after it
//
// Usage: npm run run-ts -- scripts/layout-probes/word-next-column.ts, which writes build/word-probes/word-next-column.docx
import * as fs from "fs";
import { Document, type ISectionOptions, Packer, Paragraph, SectionType, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { after: 0, ...options.spacing }, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));

const TWO = { count: 2, space: 720 };
const TWO_WIDE = { count: 2, space: 1440 };
const THREE = { count: 3, space: 360 };
const NEXT_COLUMN = SectionType.NEXT_COLUMN;

const sections: ISectionOptions[] = [
    { properties: { column: TWO }, children: fill("N1 first", 5) },
    {
        properties: { type: NEXT_COLUMN, column: TWO },
        children: [line("N1 second before 1440", { spacing: { before: 1440 } }), ...fill("N1 second", 2)],
    },
    { properties: { column: TWO }, children: fill("N2 first", 5) },
    {
        properties: { type: NEXT_COLUMN, column: TWO },
        children: [line("N2 second before 100", { spacing: { before: 100 } }), ...fill("N2 second", 2)],
    },
    { properties: { column: THREE }, children: fill("N3 first", 5) },
    { properties: { type: NEXT_COLUMN, column: TWO }, children: fill("N3 second", 3) },
    { properties: { column: TWO }, children: fill("N4 first", 5) },
    { properties: { type: NEXT_COLUMN, column: TWO_WIDE }, children: fill("N4 second", 3) },
    { properties: { column: THREE }, children: fill("N5 first", 5) },
    { properties: { type: NEXT_COLUMN, column: THREE }, children: fill("N5 second", 3) },
    { properties: { type: NEXT_COLUMN, column: THREE }, children: fill("N5 third", 3) },
    { children: [line("N6 top")] },
    { properties: { type: SectionType.CONTINUOUS, column: TWO }, children: fill("N6 first", 5) },
    { properties: { type: NEXT_COLUMN, column: TWO }, children: fill("N6 second", 3) },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("N6 after")] },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
    },
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-next-column.docx", buffer));
