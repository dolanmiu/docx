// Page numbers worked out by docx/layout for kerned text, which Word draws with each font's kerning: pairs such as "To",
// "AV" and "Ty" nearer, and in Arial and Times New Roman an A, T, V, W or Y nearer the space beside it. Text is kerned
// from the size `kern` gives, in half-points, and `kern: 2` kerns it from 1 point, as Word's own Normal template does. It
// is one of the documents scripts/compare-layout.sh checks against LibreOffice, so its text is in Times New Roman and
// Arial, which LibreOffice kerns as Word does, with Liberation Serif and Sans: LibreOffice joins the ligatures of Carlito,
// as wide as Calibri, where Word doesn't, and Caladea, as wide as Cambria, kerns fewer pairs than Cambria. See
// docs/usage/layout.md.
// cspell:ignore Yvonne Tyrone Caladea

import * as fs from "fs";
import { Document, HeadingLevel, LineRuleType, Packer, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = (
    "To Wyatt, Tyrone and Yvonne, the travel agents at AVA Tours: your vouchers for Venice, Tokyo and Yellowstone are " +
    "ready. We may wait at the Avenue Lodge, where the TV in the lounge shows a WAVY yellow map of every way to travel " +
    "today. Your taxi to the airport, a Volvo, leaves at seven; PLEASE AVOID the town TOWER at rush hour."
).split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 3) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });

/** Paragraphs of text in a font, kerned from the size given, in half-points, or not when none is given */
const paragraphs = (font: string, size: number, seed: number, kern?: number): readonly Paragraph[] =>
    [0, 1, 2].map(
        (index) =>
            new Paragraph({
                children: [
                    new TextRun({
                        text: text(90 + index * 40, seed + index),
                        font,
                        size: size * 2,
                        ...(kern === undefined ? {} : { kern }),
                    }),
                ],
            }),
    );

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: {
                run: { font: "Times New Roman", size: 22 },
                paragraph: { spacing: { after: 160, line: 259, lineRule: LineRuleType.AUTO } },
            },
            heading1: {
                run: { font: "Arial", size: 32, color: "2F5496", kern: 2 },
                paragraph: { spacing: { before: 240, after: 0 }, keepNext: true },
            },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                heading("TRAVEL WAYS: Times New Roman, kerned from 1 point"),
                ...paragraphs("Times New Roman", 11, 0, 2),
                heading("AVAILABILITY: Arial, kerned from 1 point"),
                ...paragraphs("Arial", 11, 1, 2),
                heading("Times New Roman at 14 points, kerned"),
                ...paragraphs("Times New Roman", 14, 2, 2),
                heading("Arial at 9 points, kerned from 10, so not at all"),
                ...paragraphs("Arial", 9, 3, 20),
                heading("Times New Roman, not kerned"),
                ...paragraphs("Times New Roman", 11, 4),
                heading("Arial at 12 points, kerned from 12"),
                ...paragraphs("Arial", 12, 5, 24),
                heading("YOUR VOYAGE: Times New Roman at 16 points, kerned"),
                ...paragraphs("Times New Roman", 16, 6, 2),
                heading("The end"),
                new Paragraph({ children: [new TextRun({ text: text(40, 7), kern: 2 })] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
