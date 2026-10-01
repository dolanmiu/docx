/**
 * Checks docx/layout against Word for the space before the first paragraph of a section that starts on a new page,
 * below the empty paragraph docx writes at the end of the section before, which has Normal's 200 after. These are the
 * probes Q2a to Q2c of word-rules2.docx, each followed by 50 lines of Calibri 11 (268.55 twips each in Word, 51 to a
 * page of A4 with 1440 margins), so how much space is kept shows in which of them go on the next page.
 *
 * What Word showed, in word-rules2.pdf, saved from Word 16 for Mac on 2026-09-30 and read with word-rules2.py (twips
 * below the top of the body):
 *
 * - Q2a, 1440 before: 1238.4, so 1440 less 200
 * - Q2b, 100 before: 0.0, as 100 is less than 200
 * - Q2c, a page break before it and 1440 before: 1238.4, as without the break
 *
 * LibreOffice has the same for Q2a and Q2c. The .docx is written to build/word-probes/section-start-space.docx, to lay
 * out in Word or LibreOffice again. Each probe's first fill line that docx/layout puts on the next page is printed, and
 * the script fails where it isn't the one Word's space puts there.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/section-start-space.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { Bookmark, Document, Packer, Paragraph, TextRun } from "../../src";
import { paginate } from "../../src/layout/paginate";
import { readDocument } from "../../src/layout/read-document";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const FILL = 50;
// Word's pitch of Calibri 11, and the height of the body of A4 with 1440 margins
const PITCH = 268.55;
const BODY = 16838 - 2 * 1440;
const PROBES = [
    { name: "Q2a", options: { spacing: { before: 1440 } }, word: 1238.4 },
    { name: "Q2b", options: { spacing: { before: 100 } }, word: 0 },
    { name: "Q2c", options: { pageBreakBefore: true, spacing: { before: 1440 } }, word: 1238.4 },
] as const;

/** A line of no space after, bookmarked with its text */
const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        spacing: { after: 0, ...options.spacing },
        children: [new Bookmark({ id: text.replace(/ /g, "_"), children: [new TextRun(text)] })],
    });

let pages: ReadonlyMap<string, string> = new Map();
const document = new Document({
    pageNumbers: (body, context) => {
        pages = paginate(readDocument(body, context)).bookmarks;
        return { bookmarks: pages };
    },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
    },
    sections: [
        { children: [line("start")] },
        ...PROBES.map(({ name, options }) => ({
            children: [line(`${name} first`, options), ...Array.from({ length: FILL }, (_, i) => line(`${name} fill ${i + 1}`))],
        })),
    ],
});

const buffer = await Packer.toBuffer(document);
mkdirSync("build/word-probes", { recursive: true });
writeFileSync("build/word-probes/section-start-space.docx", buffer);

let failed = false;
for (const { name, word } of PROBES) {
    const firstPage = pages.get(`${name}_first`);
    const moved = Array.from({ length: FILL }, (_, i) => i + 1).find((fill) => pages.get(`${name}_fill_${fill}`) !== firstPage);
    // The lines that fit below Word's space, the first and the fill lines, so the fill line of that number is the first
    // on the next page
    const expected = Math.floor((BODY - word) / PITCH);
    const wordMoved = expected <= FILL ? expected : undefined;
    console.log(`${name}: docx/layout moves fill ${moved ?? "none"} to the next page, Word's space moves fill ${wordMoved ?? "none"}`);
    failed ||= moved !== wordMoved;
}
process.exitCode = failed ? 1 : 0;
