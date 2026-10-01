// Probes of how Word lays out footnotes in columns, after word-rules2.ts Q6, which showed one footnote referred to from
// each of 2 columns going below its column. Each line's text names its probe, so word-footnotes-in-columns.py can find
// the lines in the HTML pdftotext writes of a PDF saved from Word, with where each one is. Calibri 11, single spaced, A4
// with 1440 margins: 51 lines to a page, and 2 columns of 4153 twips with 720 between them. Every probe line has no
// space after, but Normal has 200 after, so the empty paragraph docx writes at the end of each section has 200 after.
//
// N1: a footnote referred to from the first column only, with both columns full: whether the second ends above it
// N2: a footnote of 3 lines below the first column and of 1 below the second: whether each column ends above its own
// N3: a footnote referred to from the second column only: whether it goes below the second column, or the first
// N4: two footnotes referred to from the first column: whether both go below it
// N5: columns that start below a paragraph across the page, with a footnote referred to from each: whether they are
//     side by side below the columns, or one above the other across the page
// N6: columns evened out before a continuous section break, with a footnote referred to from each, and the text after
//     them filling the page: whether the text ends above footnotes side by side, or one above the other
// N7: the same with one footnote that wraps in a column but not across the page: which width it is laid out in
// N8: a footnote referred to from a paragraph across the page, and another from the columns below it
// N9: a footnote of 8 lines referred to from near the bottom of the first column: where the lines that don't fit go
// N10: a line whose footnote doesn't fit below the first column: whether it moves to the second with it
// N11: two footnotes referred to from a paragraph across the page, with columns below it filling the page: whether they
//      are laid out across the page, or in the columns
// N12: columns evened out before a continuous section break, with a footnote referred to from the second column only
//
// What Word showed, in word-footnotes-in-columns.pdf, saved from Word 16 for Mac on 2026-10-01. Word lays out a page's
// footnotes in the section's columns, as their own text below the columns: one after the other from the first column,
// evened out as columns before a continuous section break are, with widow control. Every column ends above the tallest,
// whichever column the footnotes are referred to from.
//
// N1: both columns end 2 lines up, above the footnote below the first. N2: both end 4 lines up, above the footnote of
// 3 lines, which isn't split 2 and 1, and the other goes beside it, at the top. N3: the footnote goes below the first
// column, and both end 2 lines up. N4: one goes below each column. N5: side by side below the columns. N6: side by side,
// and the text across the page ends 2 lines up. N7: laid out in the width of a column, in 2 lines. N8 and N11: across
// the page, one below the other, and both columns end 3 lines up. N9: 4 of its lines below each column. N10: the line
// starts the second column, and its footnote goes below the first. N12: below the first column.
//
// LibreOffice 26.8 puts each footnote below the column its reference is in instead, and only that column ends above it
// (N1 to N4), and below columns evened out, it puts them across the page (N6, N7 and N12).
import * as fs from "fs";
import { Document, FootnoteReferenceRun, ISectionOptions, Packer, Paragraph, SectionType, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { after: 0, ...options.spacing }, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number): Paragraph =>
    new Paragraph({
        spacing: { after: 0 },
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
/** A line that refers to a footnote of this paragraph */
const reference = (text: string, note: Paragraph): Paragraph => {
    footnoteId++;
    footnotes[footnoteId] = { children: [note] };
    return new Paragraph({ spacing: { after: 0 }, children: [new TextRun(text), new FootnoteReferenceRun(footnoteId)] });
};

const TWO = { count: 2, space: 720 };
const columns = (children: Paragraph[]): ISectionOptions => ({ properties: { column: TWO }, children });
const continuous = (children: Paragraph[], column?: typeof TWO): ISectionOptions => ({
    properties: { type: SectionType.CONTINUOUS, ...(column ? { column } : {}) },
    children,
});

const sections: ISectionOptions[] = [
    // N1 to N4: a page of 2 columns full of lines, with footnotes referred to from the 5th line of a column (the 2nd
    // column starts with the 52nd line, less those the footnotes take)
    columns([line("N1 top"), ...fill("N1", 3), reference("N1 ref one", line("N1 note one")), ...fill("N1", 110, 4)]),
    columns([
        line("N2 top"),
        ...fill("N2", 3),
        reference("N2 ref one", lines("N2 note one", 3)),
        ...fill("N2", 50, 4),
        reference("N2 ref two", line("N2 note two")),
        ...fill("N2", 60, 54),
    ]),
    columns([line("N3 top"), ...fill("N3", 54), reference("N3 ref one", line("N3 note one")), ...fill("N3", 60, 55)]),
    columns([
        line("N4 top"),
        ...fill("N4", 1),
        reference("N4 ref one", line("N4 note one")),
        ...fill("N4", 2, 2),
        reference("N4 ref two", line("N4 note two")),
        ...fill("N4", 110, 4),
    ]),

    // N5: 5 lines across the page, then 2 columns, with a footnote referred to from the 3rd line of each
    { children: [line("N5 top"), ...fill("N5 across", 4)] },
    continuous(
        [
            ...fill("N5", 2),
            reference("N5 ref one", line("N5 note one")),
            ...fill("N5", 45, 3),
            reference("N5 ref two", line("N5 note two")),
            ...fill("N5", 60, 48),
        ],
        TWO,
    ),

    // N6: 10 lines in 2 columns, evened out 5 and 5, with a footnote referred to from the 2nd and the 8th, then 60 lines
    // across the page, which fill it
    { children: [line("N6 top")] },
    continuous(
        [
            line("N6 line 1"),
            reference("N6 ref one", line("N6 note one")),
            ...fill("N6", 5, 3),
            reference("N6 ref two", line("N6 note two")),
            ...fill("N6", 2, 9),
        ],
        TWO,
    ),
    continuous(fill("N6 after", 60)),

    // N7: the same with one footnote, of 11 words, which wraps in a column of 4153 twips but not across the page
    { children: [line("N7 top")] },
    continuous(
        [
            line("N7 line 1"),
            reference("N7 ref one", line("N7 note one the survey of the coast was made in the summer by boat")),
            ...fill("N7", 8, 3),
        ],
        TWO,
    ),
    continuous(fill("N7 after", 60)),

    // N8: a footnote referred to from the 2nd of 3 lines across the page, then 2 columns with one referred to from the
    // 5th line of the first
    { children: [line("N8 top"), reference("N8 ref one", line("N8 note one")), line("N8 across 3")] },
    continuous([...fill("N8", 4), reference("N8 ref two", line("N8 note two")), ...fill("N8", 100, 5)], TWO),

    // N9: a footnote of 8 lines referred to from the 46th line of the first column
    columns([line("N9 top"), ...fill("N9", 44), reference("N9 ref one", lines("N9 note one", 8)), ...fill("N9", 110, 45)]),

    // N10: a footnote of 1 line referred to from the 50th line of the first column, which fits there only without it
    columns([line("N10 top"), ...fill("N10", 48), reference("N10 ref one", line("N10 note one")), ...fill("N10", 110, 49)]),

    // N11: two footnotes referred to from the 2nd and 3rd of 4 lines across the page, then 2 columns that fill it
    {
        children: [
            line("N11 top"),
            reference("N11 ref one", line("N11 note one")),
            reference("N11 ref two", line("N11 note two")),
            line("N11 across 4"),
        ],
    },
    continuous(fill("N11", 110), TWO),

    // N12: 10 lines in 2 columns, evened out 5 and 5, with a footnote referred to from the 8th, in the second column
    { children: [line("N12 top")] },
    continuous([...fill("N12", 7), reference("N12 ref one", line("N12 note one")), ...fill("N12", 2, 9)], TWO),
    continuous([line("N12 after")]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
    },
    footnotes,
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-footnotes-in-columns.docx", buffer));
