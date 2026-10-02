// Page numbers worked out by docx/layout for a document with pictures that its text wraps around, as Word wraps it
// (word-floats.docx in scripts/layout-probes): beside a picture on the right or the left, on both sides of one in the
// middle, and above and below one with top and bottom wrapping. It is one of the documents scripts/compare-layout.sh
// checks against LibreOffice, which wraps them the same way here. No picture is near the bottom of a page, where Word moves
// its paragraph to the next page and LibreOffice moves the picture up (word-floats.docx F20). See docs/usage/layout.md.

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    Paragraph,
    TableOfContents,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "the birds of the estuary feed on the mud at low tide and rest on the shingle when the water comes in".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 11) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const PICTURE = fs.readFileSync("./demo/assets/images/pizza.gif");
// EMUs in a point, which a picture's distances from the text are in
const EMUS_PER_POINT = 12700;

type Placement = "right" | "left" | "middle" | "above and below";

/** A picture of a size, in points, placed at the top of its paragraph as given, 9 points from the text */
const picture = (placement: Placement, width: number, height: number): ImageRun =>
    new ImageRun({
        type: "gif",
        data: PICTURE,
        // In pixels, 96 to the inch
        transformation: { width: (width * 4) / 3, height: (height * 4) / 3 },
        floating: {
            horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.MARGIN,
                align:
                    placement === "left"
                        ? HorizontalPositionAlign.LEFT
                        : placement === "right"
                          ? HorizontalPositionAlign.RIGHT
                          : HorizontalPositionAlign.CENTER,
            },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
            wrap:
                placement === "above and below"
                    ? { type: TextWrappingType.TOP_AND_BOTTOM }
                    : { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
            // None above it, which would reach into the line before its paragraph
            margins: {
                top: 0,
                bottom: 9 * EMUS_PER_POINT,
                left: 9 * EMUS_PER_POINT,
                right: 9 * EMUS_PER_POINT,
            },
        },
    });

/** A paragraph of words with a picture anchored at its start */
const pictured = (words: number, seed: number, placement: Placement, width: number, height: number): Paragraph =>
    new Paragraph({ children: [picture(placement, width, height), new TextRun(text(words, seed))] });

const BIRDS: readonly { readonly name: string; readonly placement: Placement; readonly size: readonly [number, number] }[] = [
    { name: "The heron", placement: "right", size: [150, 110] },
    { name: "The curlew", placement: "left", size: [130, 90] },
    { name: "The oystercatcher", placement: "middle", size: [120, 80] },
    { name: "The redshank", placement: "above and below", size: [220, 70] },
    { name: "The dunlin", placement: "right", size: [180, 140] },
    { name: "The shelduck", placement: "middle", size: [100, 120] },
    { name: "The little egret", placement: "left", size: [160, 100] },
    { name: "The godwit", placement: "above and below", size: [260, 90] },
];

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120 } } },
            heading1: { run: { size: 32 }, paragraph: { spacing: { before: 240, after: 120 } } },
            heading2: { run: { size: 26 }, paragraph: { spacing: { before: 200, after: 80 } } },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                ...BIRDS.map(({ name, placement, size: [width, height] }, bird) => [
                    heading(HeadingLevel.HEADING_1, name),
                    new Paragraph(text(40 + ((bird * 17) % 40), bird)),
                    pictured(120 + ((bird * 29) % 90), bird + 3, placement, width, height),
                    new Paragraph(text(60 + ((bird * 13) % 50), bird + 7)),
                    heading(HeadingLevel.HEADING_2, `Where to see ${name.toLowerCase()}`),
                    new Paragraph(text(80 + ((bird * 31) % 70), bird + 11)),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
