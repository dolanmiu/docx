/**
 * Probes of how Word numbers the pages of sections that start on a page another section is on, where a gutter at the top
 * meets a header taller than the margin, and which separator is above endnotes that go on to the next page. They follow
 * PG2 and PG8 of word-watertight-pages.ts and ST3 of word-watertight-settings.ts. Each probe starts a page, and each
 * line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which
 * word-watertight.py reads. Calibri 11, single spaced, no space before or after, on A4 with 1440 margins: 51 lines to a
 * page. It writes two documents, as a document's endnotes are all at its end.
 *
 * word-watertight-sections.docx, with `w:gutterAtTop`:
 * SC1: a section that starts in the next column and numbers its pages from 7, after 30 lines in the first of 2 columns:
 *      the number of the page after
 * SC2: a continuous section numbered from 7: after 51 lines, so the empty paragraph that ends the section before is at
 *      the top of the next page (SC2a); after 50 lines, so it ends the page and the section starts at the top of the next
 *      (SC2b); after 51 lines, the last of which ends the section, as Word writes a section's end (SC2c); and two
 *      continuous sections, numbered from 7 and from 20, starting on one page (SC2d)
 * SC3: a gutter of 1440 at the top, with a header of 5 lines (SC3a) and of 10 (SC3b), which go below the top margin:
 *      where the header and the body start. SC3a's prose shows how wide the lines are
 * SC4: endnotes after a line, the first of which ends at the bottom of the page: whether a separator is above the next
 *      endnote on the next page, and which. The continuation separator is written with 537 after, so it is 3 lines tall,
 *      and the separator 1
 *
 * word-watertight-sections2.docx:
 * SC5: endnotes after 50 lines, so the separator fits on the page and no line of an endnote does: where the separator
 *      goes, and what is above the endnotes on the next page. The separators are as in SC4
 *
 * Word (word-watertight-sections.pdf and word-watertight-sections2.pdf, Word 16 for Mac):
 * SC1: page 1, then 2: the restart is left out where the section starts in the next column of the page
 * SC2a and SC2c: the section starts at the top of page 2, which is 7, then 8. SC2b: the page it starts on keeps its number,
 *      9, then 8. SC2d: 9, then 21
 * SC3: the header stays at 708, and the body starts at the margin and gutter, 2880, or below the header, 3393.5
 * SC4: the continuation separator, a line across the page, above the endnote that starts page 2, and on page 3, a line
 *      tall: its space after is left out. 51 lines of endnotes fit below it, the last 6.6 twips past the margin by
 *      docx/layout's heights, where 52 lines of text don't fit (word-watertight-endnotes.ts follows this up)
 * SC5: the separator goes to the next page with the endnotes, where it is the 2-inch separator
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    Document,
    EndnoteReferenceRun,
    Footer,
    Header,
    type ISectionOptions,
    Packer,
    PageNumber,
    Paragraph,
    SectionType,
    TextRun,
} from "docx";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const numbered = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} ${i + 1}`));

/** A line with the number of the page it is on, from a PAGE field */
const paged = (text: string): Paragraph => new Paragraph({ children: [new TextRun({ children: [`${text} page `, PageNumber.CURRENT] })] });
const pagedLines = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => paged(`${probe} ${i + 1}`));

const footer = (probe: string): Footer =>
    new Footer({ children: [new Paragraph({ children: [new TextRun({ children: [`${probe} footer page `, PageNumber.CURRENT] })] })] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const TWO = { count: 2, space: 720 };

/** A section numbered from 7, which starts on the page the one before ends on */
const restarted = (probe: string, type: (typeof SectionType)[keyof typeof SectionType], count: number, start = 7): ISectionOptions => ({
    properties: { type, page: { pageNumbers: { start } } },
    footers: { default: footer(probe) },
    children: pagedLines(`${probe} B`, count),
});

const sections: ISectionOptions[] = [
    // SC1: 30 lines in the first of 2 columns, then a section in the next column numbered from 7
    { properties: { column: TWO }, footers: { default: footer("SC1") }, children: pagedLines("SC1 A", 30) },
    {
        ...restarted("SC1", SectionType.NEXT_COLUMN, 120),
        properties: { type: SectionType.NEXT_COLUMN, column: TWO, page: { pageNumbers: { start: 7 } } },
    },

    // SC2a: 51 lines, so the empty paragraph that ends the section goes to the top of the next page
    { footers: { default: footer("SC2a") }, children: pagedLines("SC2a A", 51) },
    restarted("SC2a", SectionType.CONTINUOUS, 80),
    // SC2b: 50 lines, so the empty paragraph ends the page
    { footers: { default: footer("SC2b") }, children: pagedLines("SC2b A", 50) },
    restarted("SC2b", SectionType.CONTINUOUS, 80),
    // SC2c: 51 lines, the last of which ends the section (INJECTIONS moves the section's properties into it)
    { footers: { default: footer("SC2c") }, children: pagedLines("SC2c A", 51) },
    restarted("SC2c", SectionType.CONTINUOUS, 80),
    // SC2d: 10 lines, 10 numbered from 7, then 80 numbered from 20, on one page
    { footers: { default: footer("SC2d") }, children: pagedLines("SC2d A", 10) },
    restarted("SC2d", SectionType.CONTINUOUS, 10),
    { ...restarted("SC2d", SectionType.CONTINUOUS, 0, 20), children: pagedLines("SC2d C", 80) },

    // SC3: a gutter of 1440 at the top, with a header taller than the top margin
    {
        properties: { page: { margin: { gutter: 1440 }, pageNumbers: { start: 1 } } },
        headers: { default: new Header({ children: numbered("SC3a header", 5) }) },
        footers: { default: new Footer({ children: [] }) },
        children: [...numbered("SC3a", 40), line(`SC3a prose ${prose(200)}`)],
    },
    {
        properties: { page: { margin: { gutter: 1440 } } },
        headers: { default: new Header({ children: numbered("SC3b header", 10) }) },
        children: numbered("SC3b", 60),
    },

    // SC4: a line referring to 3 endnotes: 49 lines, which end the page with the separator, 60 and 10
    {
        headers: { default: new Header({ children: [] }) },
        children: [
            new Paragraph({
                children: [new TextRun("SC4 refs"), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2), new EndnoteReferenceRun(3)],
            }),
        ],
    },
];

const endnoteStyles = {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    paragraphStyles: [
        { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
    ],
};

const endnotes = (probe: string, lengths: readonly number[]): Record<number, { readonly children: Paragraph[] }> =>
    Object.fromEntries(
        lengths.map((length, index) => [
            index + 1,
            {
                children: Array.from(
                    { length },
                    (_, i) => new Paragraph({ style: "EndnoteText", children: [new TextRun(`${probe} note ${index + 1} line ${i + 1}`)] }),
                ),
            },
        ]),
    );

const doc = new Document({ styles: endnoteStyles, endnotes: endnotes("SC4", [49, 60, 10]), sections });

// SC5: 49 lines, then a line referring to 2 endnotes of 5 lines, at the 50th line of the page
const doc2 = new Document({
    styles: endnoteStyles,
    endnotes: endnotes("SC5", [5, 5]),
    sections: [
        {
            children: [
                ...numbered("SC5", 49),
                new Paragraph({ children: [new TextRun("SC5 refs"), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2)] }),
            ],
        },
    ],
});

/** The continuation separator, written with 537 after, so it is as tall as 3 lines and the separator as 1 */
const tallerContinuation = (endnotesXml: string): string =>
    endnotesXml.replace(/(<w:endnote w:type="continuationSeparator" w:id="0"><w:p><w:pPr><w:spacing w:after=")0"/, '$1537"');

const INJECTIONS: readonly { readonly part: string; readonly change: (xml: string) => string }[] = [
    // gutterAtTop goes after displayBackgroundShape and before evenAndOddHeaders, in the schema's order
    { part: "word/settings.xml", change: (xml) => xml.replace(/(<w:displayBackgroundShape\/>)/, "$1<w:gutterAtTop/>") },
    // SC2c: the section's properties in its last line, rather than in an empty paragraph after it
    {
        part: "word/document.xml",
        change: (xml) =>
            xml.replace(
                /<w:p>((?:(?!<w:p>).)*?SC2c A 51 page .*?)<\/w:p><w:p><w:pPr>(<w:sectPr>.*?<\/w:sectPr>)<\/w:pPr><\/w:p>/,
                "<w:p><w:pPr>$2</w:pPr>$1</w:p>",
            ),
    },
    { part: "word/endnotes.xml", change: tallerContinuation },
];

const write = async (document: Document, name: string, injections: typeof INJECTIONS): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    for (const { part, change } of injections) {
        const before = await zip.file(part)!.async("string");
        const after = change(before);
        if (after === before) {
            throw new Error(`${name}: the injection into ${part} found nothing to change`);
        }
        zip.file(part, after);
    }
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

const main = async (): Promise<void> => {
    await write(doc, "word-watertight-sections", INJECTIONS);
    await write(doc2, "word-watertight-sections2", [{ part: "word/endnotes.xml", change: tallerContinuation }]);
};

void main();
