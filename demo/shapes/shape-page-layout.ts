// cspell:ignore DEEBF
// Shapes placed by the page: rules as wide as the text, a sidebar sized and placed as percentages of the page, and an
// article whose text flows from one text box into the next.
// See docs/usage/shapes.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    HorizontalPositionRelativeFrom,
    Packer,
    Paragraph,
    TextRun,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";
import { type ShapePercentage, ShapeRun } from "docx/shapes";

// A rule as wide as the space between the margins, whatever the page's size, just below the paragraph's first line
const rule = (color: string): ShapeRun =>
    new ShapeRun({
        type: "line",
        transformation: { width: "100%", height: 0 },
        line: { color, width: 2 },
        floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: 0 },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 380000 },
            allowOverlap: true,
        },
    });

const article = [
    "Shapes can hold text that flows from one to the next, as the columns of a newsletter do. The text starts in the first shape of the flow, and what doesn't fit carries on in the next one, wherever it is in the document. Word lays the text out when it opens the document, so the flow follows the fonts and styles the document uses, and if one of the boxes changes size in Word, the text moves between them.",
    "This article starts in the box on the left and carries on in the box on the right.",
].map(
    (text) =>
        new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text, size: 20 })],
        }),
);

// A column of the article: a box a third of the text's width, below the heading
const column = (offset: ShapePercentage): ShapeRun =>
    new ShapeRun({
        type: "rectangle",
        transformation: { width: "31%", height: 180 },
        line: { color: "BFBFBF", width: 0.75 },
        textFlow: "article",
        children: offset === "0%" ? article : undefined,
        textOptions: { margins: { top: 6, right: 6, bottom: 6, left: 6 } },
        floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
            wrap: { type: TextWrappingType.SQUARE },
        },
    });

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Page layout"), rule("2E74B5")] }),
                new Paragraph(
                    "The rule under the heading is as wide as the space between the margins, and stays so if the page or its margins change.",
                ),
                new Paragraph({
                    spacing: { before: 240 },
                    children: [
                        // A sidebar a quarter of the text's width, 75% of the way across it
                        new ShapeRun({
                            type: "roundedRectangle",
                            transformation: { width: "25%", height: 110 },
                            fill: "DEEBF7",
                            line: "none",
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: "A sidebar, placed and sized as percentages of the text's width",
                                            italics: true,
                                        }),
                                    ],
                                }),
                            ],
                            floating: {
                                horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: "75%" },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE },
                            },
                        }),
                        new TextRun(
                            "A floating shape's size and offsets can be percentages of the page, its margins, or the space between the margins. Word keeps them as percentages, so the shape moves and grows with the page. Other applications draw it as it would be on an A4 page with 1-inch margins.",
                        ),
                    ],
                }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 480 }, children: [new TextRun("Text that flows")] }),
                new Paragraph({ children: [column("0%"), column("34%")] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
