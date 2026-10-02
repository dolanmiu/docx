/**
 * Probes of how many lines of endnotes Word puts on a page after the first page of endnotes, below the continuation
 * separator. SC4 of word-watertight-sections.ts had 51 lines of Calibri 11 (268.55 twips each) below it, where a page of
 * body text has 51 lines in all, so the last went 6.6 twips below the bottom margin, as no line of the body or of the
 * first page of endnotes does. These say whether the continuation separator's room is left out, or how far a line may go
 * below the margin. Calibri 11 on A4 with 1440 margins, so the page's text is 13958 twips tall. The endnotes' lines are
 * exactly 288 twips tall (60 of the 1/300 inch Word's PDFs are drawn on). Each line's text names its probe, as
 * word-watertight.py reads them. Endnotes are at the end of a document, so each probe is a document of its own.
 *
 * In each, a line refers to two endnotes. The first takes the rest of the first page, to 9.9 twips above the margin, with
 * 45 lines and one exactly 451 twips tall, so the second starts the next page, below the continuation separator, and
 * goes on over three more pages.
 *
 * EN1: the continuation separator as docx writes it, a line of Calibri 11. With its 268.55 counted, 47 of the endnote's
 *      lines fit on a page and the 48th goes 134.55 below the margin. Without it, 48 fit
 * EN2: the continuation separator exactly 1100 tall. With it counted, 44 lines fit; with its height left out, 48. When the
 *      endnote's lines start 268.55 down, its height isn't taken from its paragraph
 * EN3: as EN1, with the second endnote's first line 183 tall, so with the separator counted its 48th line goes 29.55 below
 *      the margin
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import { Document, EndnoteReferenceRun, LineRuleType, Packer, Paragraph, TextRun } from "docx";

/** A line of an endnote, exactly this tall */
const noteLine = (text: string, height = 288): Paragraph =>
    new Paragraph({ style: "EndnoteText", spacing: { line: height, lineRule: LineRuleType.EXACT }, children: [new TextRun(text)] });

const probe = (name: string, firstLine?: number): Document =>
    new Document({
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
            paragraphStyles: [
                { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0 } } },
            ],
        },
        endnotes: {
            // 45 lines of 288 and one of 451: the first page's 13958 less its refs line, the separator and 9.9
            1: {
                children: [
                    ...Array.from({ length: 45 }, (_, i) => noteLine(`${name} note 1 line ${i + 1}`)),
                    noteLine(`${name} note 1 line 46`, 451),
                ],
            },
            2: {
                children: [
                    ...(firstLine === undefined ? [] : [noteLine(`${name} note 2 line 0`, firstLine)]),
                    ...Array.from({ length: 150 }, (_, i) => noteLine(`${name} note 2 line ${i + 1}`)),
                ],
            },
        },
        sections: [
            {
                children: [
                    new Paragraph({ children: [new TextRun(`${name} refs`), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2)] }),
                ],
            },
        ],
    });

const write = async (document: Document, name: string, change?: (endnotes: string) => string): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    if (change) {
        const before = await zip.file("word/endnotes.xml")!.async("string");
        const after = change(before);
        if (after === before) {
            throw new Error(`${name}: the change to the endnotes found nothing to change`);
        }
        zip.file("word/endnotes.xml", after);
    }
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

const main = async (): Promise<void> => {
    await write(probe("EN1"), "word-watertight-endnotes1");
    // EN2: the continuation separator's line exactly 1100 tall
    await write(probe("EN2"), "word-watertight-endnotes2", (xml) =>
        xml.replace(
            /(<w:endnote w:type="continuationSeparator" w:id="0"><w:p><w:pPr><w:spacing w:after="0" w:line=")240" w:lineRule="auto"/,
            '$11100" w:lineRule="exact"',
        ),
    );
    await write(probe("EN3", 183), "word-watertight-endnotes3");
};

void main();
