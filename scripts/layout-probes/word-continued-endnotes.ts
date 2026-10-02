/**
 * Probes of how Word fills a page of endnotes after the first, below the continuation separator, where
 * word-watertight-endnotes.ts left it open. There, 48 lines exactly 288 tall went below the continuation separator, whether
 * it was a line of Calibri 11 or written exactly 1100 tall (EN1, EN2), and a line of 183 and 47 of 288 (EN3): as many as
 * fit on the page without the separator, the last up to 134.55 past the margin. Two readings fit all three: the
 * separator's room is left out, so lines go past the margin by up to its height, or a line goes on the page while its top
 * is above the margin. These tell them apart, and say how tall Word makes the continuation separator, which was a line of
 * Calibri 11 in EN2 though written 1100 tall, and in SC4 of word-watertight-sections.ts though written with 537 after.
 *
 * Calibri 11 on A4 with 1440 margins, so the page's text is 13958 twips tall. In each, a line refers to two endnotes. The
 * first takes the rest of the first page, to 9.9 twips above the margin, with 45 lines and one exactly 451 twips tall, as
 * in word-watertight-endnotes.ts, so the second starts the next page, below the continuation separator. Each line of the
 * endnotes is exactly as tall as it says, and its text names its probe, as word-continued-endnotes.py reads them.
 * Endnotes are at the end of a document, so each probe is a document of its own.
 *
 * CE1: 47 lines of 288, then one of 600, then 20 of 288. With the separator's room left out, the 600 doesn't fit
 *      (47 * 288 + 600 = 14136) and starts the next page. Going on while its top is above the margin, it is on the page:
 *      its top is 268.55 + 47 * 288 = 13804.55 down
 * CE2: a line of 299, then 111 lines of 150 in Calibri 6. With the separator's room left out, 91 of the 150 fit
 *      (299 + 91 * 150 = 13949). Going on while its top is above the margin, 90: the 91st starts 109.55 past it
 * CE3: as CE1 without the 600, the continuation separator in Calibri 20 (488.28 tall at single spacing). With its room
 *      left out, 48 lines of 288 fit, the last 354.28 past the margin. Going on while its top is above the margin, 47.
 *      Where the first line starts says whether the separator's size counts
 * CE4: as CE3, both separators in Calibri 11 with 400 before: where the first endnote starts on the first page, and the
 *      second on the next, say whether the space before is kept
 * CE5: the separator written exactly 1100 tall, and the continuation separator double spaced, with a first endnote of 5
 *      lines: where the endnotes start on each page says whether their line spacing is kept
 *
 * Word (word-continued-endnotes1.pdf to 5.pdf, Word 16 for Mac, read with word-continued-endnotes.py):
 * CE1: the 600 starts the next page, below 47 lines: the separator's room is left out, and a line doesn't go on because
 *      its top is above the margin
 * CE2: the line of 299 and 91 of 150 on the page, the last 259.55 past the margin
 * CE3: 48 lines, from 268.55 down: the separator is a line of Calibri 11, and drawn where CE1's is, in 20 points too
 * CE4: both separators a line tall, without their 400 before: the first endnote starts where it does in CE1
 * CE5: the same, though the separator is written 1100 tall and the continuation separator double spaced
 * So Word lays out both separators a line of the document's text tall, whatever their own formatting, and fills each page
 * after the first with as many lines as fit on it without the continuation separator
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-continued-endnotes.ts, which writes
 * build/word-probes/word-continued-endnotes1.docx to 5.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import { Document, EndnoteReferenceRun, LineRuleType, Packer, Paragraph, TextRun } from "docx";

/** A line of an endnote, exactly this tall, in Calibri of this size in half points */
const noteLine = (text: string, height = 288, size = 22): Paragraph =>
    new Paragraph({
        style: "EndnoteText",
        spacing: { line: height, lineRule: LineRuleType.EXACT },
        children: [new TextRun({ text, size })],
    });

const lines = (name: string, count: number, from = 1, height = 288, size = 22): Paragraph[] =>
    Array.from({ length: count }, (_, i) => noteLine(`${name} note 2 line ${from + i}`, height, size));

/** The first endnote: 45 lines and one of 451, which end 9.9 above the margin below a line and the separator */
const fillsFirstPage = (name: string): Paragraph[] => [
    ...Array.from({ length: 45 }, (_, i) => noteLine(`${name} note 1 line ${i + 1}`)),
    noteLine(`${name} note 1 line 46`, 451),
];

const probe = (name: string, first: readonly Paragraph[], second: readonly Paragraph[]): Document =>
    new Document({
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
            paragraphStyles: [
                { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0 } } },
            ],
        },
        endnotes: { 1: { children: [...first] }, 2: { children: [...second] } },
        sections: [
            {
                children: [
                    new Paragraph({ children: [new TextRun(`${name} refs`), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2)] }),
                ],
            },
        ],
    });

/** The paragraph properties of a separator as docx writes them, which `changed` replaces */
const SPACING = '<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>';
const SEPARATOR = '<w:endnote w:type="separator" w:id="-1"><w:p>';
const CONTINUATION = '<w:endnote w:type="continuationSeparator" w:id="0"><w:p>';

/** Changes the endnotes' XML, failing when a change finds nothing to change */
const changed = (xml: string, from: string, to: string, name: string): string => {
    if (!xml.includes(from)) {
        throw new Error(`${name}: ${from} isn't in the endnotes`);
    }
    return xml.replace(from, to);
};

/** Gives a separator (`which`) other paragraph properties */
const separatorWith = (xml: string, which: string, properties: string, name: string): string =>
    changed(xml, which + SPACING, which + properties, name);

const write = async (document: Document, name: string, change?: (endnotes: string) => string): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    if (change) {
        zip.file("word/endnotes.xml", change(await zip.file("word/endnotes.xml")!.async("string")));
    }
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

const main = async (): Promise<void> => {
    await write(
        probe("CE1", fillsFirstPage("CE1"), [...lines("CE1", 47), noteLine("CE1 note 2 tall line 48", 600), ...lines("CE1", 20, 49)]),
        "word-continued-endnotes1",
    );
    await write(
        probe("CE2", fillsFirstPage("CE2"), [noteLine("CE2 note 2 line 0", 299), ...lines("CE2", 111, 1, 150, 12)]),
        "word-continued-endnotes2",
    );
    // CE3: the continuation separator's text and mark in Calibri 20
    const size40 = '<w:rPr><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr>';
    await write(probe("CE3", fillsFirstPage("CE3"), lines("CE3", 150)), "word-continued-endnotes3", (xml) =>
        changed(
            separatorWith(xml, CONTINUATION, `<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>${size40}</w:pPr>`, "CE3"),
            "<w:r><w:continuationSeparator/></w:r>",
            `<w:r>${size40}<w:continuationSeparator/></w:r>`,
            "CE3",
        ),
    );
    // CE4: both separators with 400 before
    const before400 = '<w:pPr><w:spacing w:before="400" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>';
    await write(probe("CE4", fillsFirstPage("CE4"), lines("CE4", 150)), "word-continued-endnotes4", (xml) =>
        separatorWith(separatorWith(xml, SEPARATOR, before400, "CE4"), CONTINUATION, before400, "CE4"),
    );
    // CE5: the separator exactly 1100 tall, the continuation separator double spaced
    await write(
        probe(
            "CE5",
            Array.from({ length: 5 }, (_, i) => noteLine(`CE5 note 1 line ${i + 1}`)),
            lines("CE5", 150),
        ),
        "word-continued-endnotes5",
        (xml) =>
            separatorWith(
                separatorWith(xml, SEPARATOR, '<w:pPr><w:spacing w:after="0" w:line="1100" w:lineRule="exact"/></w:pPr>', "CE5"),
                CONTINUATION,
                '<w:pPr><w:spacing w:after="0" w:line="480" w:lineRule="auto"/></w:pPr>',
                "CE5",
            ),
    );
};

void main();
