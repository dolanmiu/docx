// Page numbers worked out by docx/layout for text in a font it measures from the font's file, rather than as the most
// similar font it knows. The text is in Kaushan Script, which the document embeds so it is drawn in it, with kerning on
// in some paragraphs. It is one of the documents scripts/compare-layout.sh checks against LibreOffice. See
// docs/usage/layout.md.
// cspell:ignore Kaushan

import * as fs from "fs";
import { CharacterSet, Document, HeadingLevel, Packer, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbersWith } from "docx/layout";

const kaushan = fs.readFileSync("./demo/assets/KaushanScript-Regular.ttf");

const WORDS =
    "the lighthouse keeper wrote to the harbour master about the storm that took the jetty and the boats that came back to the bay".split(
        " ",
    );
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 3) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });

const doc = new Document({
    pageNumbers: estimatePageNumbersWith({ fonts: [{ data: kaushan }] }),
    fonts: [{ name: "Kaushan Script", data: kaushan, characterSet: CharacterSet.ANSI }],
    styles: {
        default: {
            document: { run: { font: "Kaushan Script", size: 22 }, paragraph: { spacing: { after: 160 } } },
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
                ...[11, 14, 9, 12, 11, 16].flatMap((size, index) => [
                    heading(`Letter ${index + 1}, at ${size} points`),
                    ...[0, 1, 2].map(
                        (paragraph) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: text(70 + paragraph * 30, index + paragraph),
                                        size: size * 2,
                                        // Kerned from 1 point, as Word's own Normal template kerns text
                                        ...(paragraph === 1 ? { kern: 2 } : {}),
                                    }),
                                ],
                            }),
                    ),
                ]),
                heading("The end"),
                new Paragraph({ children: [new TextRun(text(40, 9))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
