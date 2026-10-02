// Probes of what Word does where docx/layout still stops in columns after word-watertight-stops.ts's SP10, SP12 and
// SP13 showed the plain cases. Each line's text names its probe, or is prose of a paragraph that does, so
// word-column-stops.py can find the lines in pdftotext's HTML of a PDF saved from Word. Calibri 11, single spaced, no
// space before or after, on A4 with 1440 margins: 51 lines to a column. Each probe starts on a new page.
//
// CS1: a section that starts in the next column of 2000 and 6306 twips after 2 of the same width, which Word lays out in
//      the columns of the page (SP10), and goes on to the next page: which columns it is in there
// CS2: a footnote in such a section, on the page it starts on: which columns the footnote is laid out in
// CS3: a paragraph kept together, in columns of 2000 and 6306, taller than the narrow first column but not the wide second,
//      at the top of the page
// CS4: the same below a line
// CS5: the same in columns of 6306 and 2000, below 40 lines, where it doesn't fit in the room left in the wide first
//      column and is taller than the narrow second
// CS6: the same below 5 lines, where it fits in the room left in the wide first column
// CS7: two lines kept with the next, before a 60-line paragraph kept together, in 2 columns (SP13 had one)
// CS8: a line kept with the next at the top of a page, before a 60-line paragraph kept together, in 2 columns
// CS9: a line kept with the next at the top of the second column, before a 60-line paragraph kept together
//
// Usage: npm run run-ts -- scripts/layout-probes/word-column-stops.ts, which writes build/word-probes/word-column-stops.docx
import * as fs from "fs";

import { Column, Document, FootnoteReferenceRun, type ISectionOptions, Packer, Paragraph, SectionType, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks, each "<probe> line <n>" */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const TWO = { count: 2, space: 720 };
const NARROW_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 2000, space: 720 }), new Column({ width: 6306 })] };
const WIDE_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 6306, space: 720 }), new Column({ width: 2000 })] };

const sections: ISectionOptions[] = [
    // CS1: 5 lines in the first of 2 columns, then a section in the next column whose paragraph fills the second and goes
    // on to the next page, with 5 lines after it
    { properties: { column: TWO }, children: fill("CS1 first", 5) },
    {
        properties: { type: SectionType.NEXT_COLUMN, column: NARROW_FIRST },
        children: [line(`CS1 next ${prose(560)}`), ...fill("CS1 after", 5)],
    },

    // CS2: the same with a footnote of 40 words from the section's first line
    { properties: { column: TWO }, children: fill("CS2 first", 5) },
    {
        properties: { type: SectionType.NEXT_COLUMN, column: NARROW_FIRST },
        children: [new Paragraph({ children: [new TextRun("CS2 ref"), new FootnoteReferenceRun(1)] }), ...fill("CS2 next", 3)],
    },

    // CS3: a paragraph of 300 words kept together at the top of the page, in columns of 2000 and 6306
    { properties: { column: NARROW_FIRST }, children: [line(`CS3 kept ${prose(300)}`, { keepLines: true }), ...fill("CS3 after", 5)] },
    // CS4: a line, then the same paragraph
    {
        properties: { column: NARROW_FIRST },
        children: [line("CS4 top"), line(`CS4 kept ${prose(300)}`, { keepLines: true }), ...fill("CS4 after", 5)],
    },
    // CS5: 40 lines, then the same paragraph, in columns of 6306 and 2000
    {
        properties: { column: WIDE_FIRST },
        children: [...fill("CS5", 40), line(`CS5 kept ${prose(300)}`, { keepLines: true }), ...fill("CS5 after", 5)],
    },
    // CS6: 5 lines, then the same paragraph, in columns of 6306 and 2000
    {
        properties: { column: WIDE_FIRST },
        children: [...fill("CS6", 5), line(`CS6 kept ${prose(300)}`, { keepLines: true }), ...fill("CS6 after", 5)],
    },

    // CS7: 10 lines, two lines kept with the next, then a 60-line paragraph kept together, in 2 columns
    {
        properties: { column: TWO },
        children: [
            ...fill("CS7", 10),
            line("CS7 kept 1", { keepNext: true }),
            line("CS7 kept 2", { keepNext: true }),
            lines("CS7", 60, { keepLines: true }),
            ...fill("CS7 after", 5),
        ],
    },
    // CS8: a line kept with the next at the top of the page, then a 60-line paragraph kept together
    {
        properties: { column: TWO },
        children: [line("CS8 kept", { keepNext: true }), lines("CS8", 60, { keepLines: true }), ...fill("CS8 after", 5)],
    },
    // CS9: 51 lines that fill the first column, a line kept with the next at the top of the second, then a 60-line
    // paragraph kept together
    {
        properties: { column: TWO },
        children: [
            ...fill("CS9", 51),
            line("CS9 kept", { keepNext: true }),
            lines("CS9", 60, { keepLines: true }),
            ...fill("CS9 after", 5),
        ],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    footnotes: { 1: { children: [new Paragraph(`CS2 note ${prose(40)}`)] } },
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-column-stops.docx", buffer));
