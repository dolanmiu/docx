/**
 * Probes of what Word writes for the page references docx/layout leaves blank or may get wrong, for the watertight
 * inventory. Unlike the other probes, this one is saved from Word after updating its fields (select all, then F9), so
 * each field shows what Word works out. Calibri 11 on A4 with 1440 margins, single spaced, 51 lines to a page.
 * word-watertight.py reads it.
 *
 * FD1: a bookmark that starts on the last line of page 1 and ends on page 2: which page a page reference to it gives
 * FD2: page references with `\p` to a bookmark on another page, above on the same page, and below on the same page
 * FD3: page references and page counts in formats of their own: `\* roman`, `\* ALPHABETIC`, `\* Ordinal`, `\# "00"`
 * FD4: a page reference to a bookmark in a footnote, whose page docx/layout doesn't give
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    Bookmark,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    Packer,
    PageNumber,
    PageReference,
    Paragraph,
    SimpleField,
    TextRun,
} from "docx";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
/** A line with a page reference to a bookmark, with these switches, and the page it is on */
const reference = (label: string, bookmark: string, switches = ""): Paragraph =>
    new Paragraph({
        children: [
            new TextRun(`${label} `),
            ...(switches === "" ? [new PageReference(bookmark)] : [new SimpleField(`PAGEREF ${bookmark} ${switches}`, "?")]),
            new TextRun({ children: [" on page ", PageNumber.CURRENT] }),
        ],
    });

const sections: ISectionOptions[] = [
    // FD1: the bookmark spans the last line of page 1 and the first of page 2, then the reference on page 3
    {
        children: [
            ...fill("FD1", 50),
            // Without widow control, so its first line stays on page 1 and its second goes to page 2
            new Paragraph({
                widowControl: false,
                children: [
                    new Bookmark({
                        id: "fd1span",
                        children: [new TextRun("FD1 bookmark starts"), new TextRun({ text: "FD1 bookmark ends", break: 1 })],
                    }),
                ],
            }),
            ...fill("FD1 after", 60),
            reference("FD1 reference", "fd1span"),
        ],
    },
    // FD2: a bookmark on page 1 of the probe, a reference to it on page 2, and references above and below it on page 1
    {
        children: [
            reference("FD2 above", "fd2target", "\\p"),
            ...fill("FD2", 10),
            new Paragraph({ children: [new Bookmark({ id: "fd2target", children: [new TextRun("FD2 target")] })] }),
            reference("FD2 below", "fd2target", "\\p"),
            ...fill("FD2 after", 50),
            reference("FD2 other page", "fd2target", "\\p"),
        ],
    },
    // FD3: on page 5 of the probe or later, so the formats differ from decimal
    {
        children: [
            ...fill("FD3", 51 * 4),
            new Paragraph({ children: [new Bookmark({ id: "fd3target", children: [new TextRun("FD3 target")] })] }),
            reference("FD3 roman", "fd3target", "\\* roman"),
            reference("FD3 ALPHABETIC", "fd3target", "\\* ALPHABETIC"),
            reference("FD3 Ordinal", "fd3target", "\\* Ordinal"),
            reference("FD3 picture", "fd3target", '\\# "00"'),
            new Paragraph({ children: [new TextRun("FD3 numpages roman "), new SimpleField("NUMPAGES \\* roman", "?")] }),
            new Paragraph({ children: [new TextRun("FD3 sectionpages roman "), new SimpleField("SECTIONPAGES \\* roman", "?")] }),
        ],
    },
    // FD4: a footnote on page 1 of the probe with a bookmark in it, and a reference to it on page 2
    {
        children: [
            new Paragraph({ children: [new TextRun("FD4 note here"), new FootnoteReferenceRun(1)] }),
            ...fill("FD4", 60),
            reference("FD4 reference", "fd4note"),
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
    footnotes: {
        1: {
            children: [
                new Paragraph({ children: [new Bookmark({ id: "fd4note", children: [new TextRun("FD4 bookmark in the footnote")] })] }),
            ],
        },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-fields.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
