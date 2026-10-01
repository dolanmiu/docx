/**
 * Probes of how Word lays out a paragraph kept together (keepLines) that is taller than a column, after word-balance.ts's
 * W3, where Word moved a paragraph of 60 lines in 2 columns to a new page and broke it across only the first column of
 * each page. Each line's text names its probe, and word-balance.py reads them. Calibri 11, single spaced, no space
 * after: 51 lines to a page of A4 with 1440 margins. Each probe starts on a new page.
 *
 * K1: what follows the paragraph in its section. a: the paragraph at the top of a page, then 70 lines; b: as W3, after a
 *     line above the columns, then 10 lines, evened out before a continuous section break
 * K2: a paragraph that starts in the second column. a: below 9 lines in it; b: at its top, after a full first column
 * K3: the paragraph after 5 lines in the first column, in a section on a new page
 * K4: in 3 columns, a paragraph of 120 lines at the top of a page, then 5 lines
 * K5: in one column, the paragraph after 5 lines, then 5 lines
 *
 * What Word showed (word-keep-together.pdf, from Word 16 for Mac on 2026-10-01): the paragraph goes down only the
 * first column of each page, and starts on a new page unless it is at the top of the page's first column: below lines in
 * either column, at the top of an empty second column, and below a line above the columns (K1b to K3). What follows it
 * goes on below it in the first column of its last page, and into the next column, so the other columns of the pages
 * before are left empty (K1a), and those columns are evened out as any others are, with the paragraph's last lines
 * together: 9 and a line, then 9 (K1b). In 3 columns it is the same (K4), and in one column it moves to a new page (K5).
 * LibreOffice 26.8 breaks it across all the columns, as docx/layout did before.
 */
import * as fs from "fs";

import { Document, type ISectionOptions, Packer, Paragraph, SectionType, TextRun } from "docx";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph kept together, of lines split by line breaks */
const kept = (probe: string, count: number): Paragraph =>
    new Paragraph({
        keepLines: true,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} kept ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

const TWO = { count: 2, space: 720 };
const THREE = { count: 3, space: 360 };

const sections: ISectionOptions[] = [
    { properties: { column: TWO }, children: [kept("K1a", 60), ...fill("K1a", 70)] },

    { children: [line("K1b top")] },
    { properties: { type: SectionType.CONTINUOUS, column: TWO }, children: [kept("K1b", 60), ...fill("K1b", 10)] },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("K1b after")] },

    { properties: { column: TWO }, children: [...fill("K2a", 60), kept("K2a", 60), ...fill("K2a", 5, 61)] },
    { properties: { column: TWO }, children: [...fill("K2b", 51), kept("K2b", 60), ...fill("K2b", 5, 52)] },

    { properties: { column: TWO }, children: [...fill("K3", 5), kept("K3", 60), ...fill("K3", 5, 6)] },

    { properties: { column: THREE }, children: [kept("K4", 120), ...fill("K4", 5)] },

    { children: [...fill("K5", 5), kept("K5", 60), ...fill("K5", 5, 6)] },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections,
});

Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-keep-together.docx", buffer));
