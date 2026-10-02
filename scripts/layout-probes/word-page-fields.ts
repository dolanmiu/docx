/**
 * Probes of what Word writes for page references, page numbers and numbers of pages where `word-watertight-fields` and
 * `word-watertight-pages` didn't show it. Saved from Word after updating its fields: say Yes when Word asks to update
 * them, then select all and press F9, and save as a PDF. Each field is written with "?" as its result, so one Word
 * didn't update shows "?". Calibri 11 on A4 with 1440 margins, single spaced, 51 lines to a page. word-page-fields.py
 * reads it.
 *
 * PF1: `\p` in two columns: in the second column to a bookmark lower down the first (a), and in the first to one higher
 *      up the second (b): whether "above" and "below" go by where the text is in the document or on the page
 * PF2: `\p` in a table: to a bookmark in the cell before it in its row (a), and in the row above, in the cell to the
 *      right (b)
 * PF3: `\p` to a bookmark on another page, numbered iv (a), with `\* Upper` (b), with `\* Arabic` (c), with `\* Upper` on
 *      the same page (d), and to a bookmark on another page numbered with a chapter number, 1-2 (e)
 * PF4: formats of their own on pages not numbered in figures: to page iv, `\* Arabic` (a), `\* ALPHABETIC` (b),
 *      `\* roman` (c); to page 1-2, `\* roman` (d), `\* Arabic` (e)
 * PF5: capitals and pictures, to page 5: `\* roman \* Upper` (a), `\* ALPHABETIC \* Lower` (b), `\* Ordinal \* Upper` (c),
 *      `\* Ordinal \* FirstCap` (d), `\# "00"` (e), `\# "000"` (f), `\# "0"` (g), `\# "#"` (h); to page 1234,
 *      `\# "#,##0"` (i), `\# "00"` (j); to page 5, `\* Arabic \* MERGEFORMAT` (k)
 * PF6: numbers of pages: `NUMPAGES \* Arabic \* MERGEFORMAT` (a), `NUMPAGES \* ALPHABETIC` (b), `NUMPAGES \# "000"` (c),
 *      `SECTIONPAGES \* Ordinal` (d)
 * PF7: PAGE and SECTION: `PAGE \* roman` (a) and `PAGE \# "00"` (b) on page 1, `PAGE \* Arabic` (c) and a page number
 *      block, `w:pgNum` (d), on page iv, a page number block on page 1-2 (e), `SECTION \* roman` in section 4 (f), PAGE and
 *      SECTION in a footnote (g), in the first part of a footnote continued on the next page and in its rest (h), and in
 *      an endnote referred to from section 6 (i)
 * PF8: bookmarks in notes: page references to a bookmark in the part of a footnote continued on the next page (a), in an
 *      endnote (b), and in a footnote on page 1-2 (c); `\p` in the body to a bookmark in a footnote on the same page,
 *      above the footnote's reference (d) and below it (e); `\p` in a footnote to a bookmark in the body on the same page
 *      (f), and on another page (g)
 */
// cspell:ignore bbox firstcap mergeformat
import { mkdirSync, writeFileSync } from "node:fs";

import {
    AlignmentType,
    Bookmark,
    ColumnBreak,
    Document,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    HeadingLevel,
    type ISectionOptions,
    NumberFormat,
    Packer,
    PageNumber,
    PageNumberElement,
    PageNumberSeparator,
    Paragraph,
    SimpleField,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Child = string | TextRun | Bookmark | SimpleField | FootnoteReferenceRun | EndnoteReferenceRun | ColumnBreak;

const line = (...children: readonly Child[]): Paragraph =>
    new Paragraph({ children: children.map((child) => (typeof child === "string" ? new TextRun(child) : child)) });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
const field = (instruction: string): SimpleField => new SimpleField(instruction, "?");
/** A line with a field, between its probe's name and "end" */
const probe = (name: string, instruction: string): Paragraph => line(`${name} `, field(instruction), " end");
const target = (id: string, text: string): Bookmark => new Bookmark({ id, children: [new TextRun(text)] });
const page = (): TextRun => new TextRun({ children: [PageNumber.CURRENT] });

const sections: ISectionOptions[] = [
    // Section 1, page 1: the references to bookmarks on later pages, and PAGE in formats of its own
    {
        properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        children: [
            probe("PF3a", "PAGEREF pf3 \\p"),
            probe("PF3b", "PAGEREF pf3 \\p \\* Upper"),
            probe("PF3c", "PAGEREF pf3 \\p \\* Arabic"),
            probe("PF3e", "PAGEREF pf3chapter \\p"),
            probe("PF4a", "PAGEREF pf3 \\* Arabic"),
            probe("PF4b", "PAGEREF pf3 \\* ALPHABETIC"),
            probe("PF4c", "PAGEREF pf3 \\* roman"),
            probe("PF4d", "PAGEREF pf3chapter \\* roman"),
            probe("PF4e", "PAGEREF pf3chapter \\* Arabic"),
            probe("PF5a", "PAGEREF pf5 \\* roman \\* Upper"),
            probe("PF5b", "PAGEREF pf5 \\* ALPHABETIC \\* Lower"),
            probe("PF5c", "PAGEREF pf5 \\* Ordinal \\* Upper"),
            probe("PF5d", "PAGEREF pf5 \\* Ordinal \\* FirstCap"),
            probe("PF5e", 'PAGEREF pf5 \\# "00"'),
            probe("PF5f", 'PAGEREF pf5 \\# "000"'),
            probe("PF5g", 'PAGEREF pf5 \\# "0"'),
            probe("PF5h", 'PAGEREF pf5 \\# "#"'),
            probe("PF5i", 'PAGEREF pf1234 \\# "#,##0"'),
            probe("PF5j", 'PAGEREF pf1234 \\# "00"'),
            probe("PF5k", "PAGEREF pf5 \\* Arabic \\* MERGEFORMAT"),
            probe("PF6a", "NUMPAGES \\* Arabic \\* MERGEFORMAT"),
            probe("PF6b", "NUMPAGES \\* ALPHABETIC"),
            probe("PF6c", 'NUMPAGES \\# "000"'),
            probe("PF6d", "SECTIONPAGES \\* Ordinal"),
            probe("PF7a", "PAGE \\* roman"),
            probe("PF7b", 'PAGE \\# "00"'),
            probe("PF8a", "PAGEREF pf8a"),
            probe("PF8b", "PAGEREF pf8b"),
            probe("PF8c", "PAGEREF pf8c"),
        ],
    },
    // Section 2: two columns, each with a reference to a bookmark in the other
    {
        properties: { column: { count: 2, space: 720 } },
        children: [
            ...fill("PF1 first", 4),
            probe("PF1b", "PAGEREF pf1two \\p"),
            ...fill("PF1 first more", 4),
            line(target("pf1one", "PF1 target one")),
            ...fill("PF1 first after", 5),
            line(new ColumnBreak()),
            ...fill("PF1 second", 4),
            probe("PF1a", "PAGEREF pf1one \\p"),
            ...fill("PF1 second more", 14),
            line(target("pf1two", "PF1 target two")),
        ],
    },
    // Section 3: a table with references to bookmarks in other cells
    {
        children: [
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 4513, type: WidthType.DXA }, children: [line(target("pf2a", "PF2 target a"))] }),
                            new TableCell({
                                width: { size: 4513, type: WidthType.DXA },
                                children: [probe("PF2a", "PAGEREF pf2a \\p"), line(target("pf2b", "PF2 target b"))],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 4513, type: WidthType.DXA }, children: [probe("PF2b", "PAGEREF pf2b \\p")] }),
                            new TableCell({ width: { size: 4513, type: WidthType.DXA }, children: [line("PF2 cell")] }),
                        ],
                    }),
                ],
            }),
        ],
    },
    // Section 4, page iv
    {
        properties: { page: { pageNumbers: { start: 4, formatType: NumberFormat.LOWER_ROMAN } } },
        children: [
            line(target("pf3", "PF3 target")),
            probe("PF3d", "PAGEREF pf3 \\p \\* Upper"),
            probe("PF7c", "PAGE \\* Arabic"),
            line("PF7d ", new TextRun({ children: [new PageNumberElement()] }), " end"),
            probe("PF7f", "SECTION \\* roman"),
        ],
    },
    // Section 5, numbered with the chapter number of heading 1: page 1-2
    {
        properties: {
            page: {
                pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL, chapterHeadingLevel: 1, separator: PageNumberSeparator.HYPHEN },
            },
        },
        children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("PF chapter heading")] }),
            ...fill("PF chapter", 55),
            line(target("pf3chapter", "PF3 chapter target")),
            line("PF7e ", new TextRun({ children: [new PageNumberElement()] }), " end"),
            line("PF8 chapter note", new FootnoteReferenceRun(1)),
        ],
    },
    // Section 6, page 5, which refers to the endnote
    {
        properties: { page: { pageNumbers: { start: 5, formatType: NumberFormat.DECIMAL } } },
        children: [line(target("pf5", "PF5 target")), line("PF8 endnote", new EndnoteReferenceRun(1))],
    },
    // Section 7, page 1234
    {
        properties: { page: { pageNumbers: { start: 1234, formatType: NumberFormat.DECIMAL } } },
        children: [line(target("pf1234", "PF5 target 1234"))],
    },
    // Section 8: footnotes, one of which goes on to the next page
    {
        properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        children: [
            probe("PF8d", "PAGEREF pf8d \\p"),
            ...fill("PF8", 3),
            line("PF8 short note", new FootnoteReferenceRun(2)),
            line(target("pf8body", "PF8 body target")),
            probe("PF8e", "PAGEREF pf8d \\p"),
            ...fill("PF8 more", 20),
            line("PF8 long note", new FootnoteReferenceRun(3)),
            ...fill("PF8 after", 40),
        ],
    },
];

/** A footnote or endnote's lines, each a paragraph of its own */
const note = (...lines: readonly Paragraph[]): { readonly children: Paragraph[] } => ({ children: [...lines] });

const doc = new Document({
    features: { updateFields: true },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "Heading1", name: "heading 1", run: { size: 22 }, paragraph: { numbering: { reference: "chapter", level: 0 } } },
            { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
            { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    numbering: {
        config: [
            {
                reference: "chapter",
                levels: [{ level: 0, format: "decimal", text: "Chapter %1", start: 1, alignment: AlignmentType.LEFT }],
            },
        ],
    },
    footnotes: {
        1: note(line(target("pf8c", "PF8 bookmark c"))),
        2: note(
            line(target("pf8d", "PF8 bookmark d")),
            probe("PF8f", "PAGEREF pf8body \\p"),
            probe("PF8g", "PAGEREF pf3 \\p"),
            line("PF7g note page ", page(), " section ", field("SECTION"), " end"),
        ),
        3: note(
            line("PF7h first part page ", page(), " section ", field("SECTION"), " end"),
            ...fill("PF8 long note", 36),
            line(target("pf8a", "PF8 bookmark a")),
            line("PF7h rest page ", page(), " section ", field("SECTION"), " end"),
        ),
    },
    endnotes: {
        1: note(line(target("pf8b", "PF8 bookmark b")), line("PF7i endnote page ", page(), " section ", field("SECTION"), " end")),
    },
    sections,
});

Packer.toBuffer(doc).then((buffer) => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-page-fields.docx", buffer);
});
