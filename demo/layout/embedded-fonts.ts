// Page numbers worked out by docx/layout for text in a font the document embeds, which it measures from the embedded
// file, as Word draws the text in it, with nothing more given to estimatePageNumbers. The text is in Pacifico, which isn't
// in the width tables, so without the file the layout would stop at it. It is one of the documents
// scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.
// cspell:ignore Pacifico

import * as fs from "fs";
import { CharacterSet, Document, HeadingLevel, Packer, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "a postcard from the island told of the ferry that ran late and the gulls that followed it into the harbour".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 3) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    fonts: [{ name: "Pacifico", data: fs.readFileSync("./demo/assets/Pacifico.ttf"), characterSet: CharacterSet.ANSI }],
    styles: {
        default: {
            document: { run: { font: "Pacifico", size: 22 }, paragraph: { spacing: { after: 160 } } },
            heading1: {
                run: { font: "Calibri", size: 32, color: "2F5496" },
                paragraph: { spacing: { before: 240, after: 0 }, keepNext: true },
            },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                ...[12, 10, 15, 11, 13].flatMap((size, index) => [
                    heading(`Postcard ${index + 1}, at ${size} points`),
                    ...[0, 1].map(
                        (paragraph) =>
                            new Paragraph({
                                children: [new TextRun({ text: text(90 + paragraph * 40, index + paragraph), size: size * 2 })],
                            }),
                    ),
                ]),
                heading("The end"),
                new Paragraph({ children: [new TextRun(text(30, 7))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
