import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { measureLineHeight, measureTextWidth } from "@file/drawing/inline/graphic/graphic-data/wps";

import { ExternalHyperlink, InternalHyperlink } from "../links";
import { Paragraph } from "../paragraph";
import { Tab } from "./empty-children";
import { ImageRun } from "./image-run";
import { createTextParagraphs, getParagraphSpans, resolveShapeSize } from "./shape-text-size";
import { TextRun } from "./text-run";

const PIXELS_PER_POINT = 4 / 3;

describe("createTextParagraphs", () => {
    it("should make a centred paragraph for each line", () => {
        const paragraphs = createTextParagraphs("One\nTwo");
        expect(paragraphs).to.have.length(2);
        const tree = new Formatter().format(paragraphs[1]);
        expect(tree).to.deep.equal({
            "w:p": [
                { "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }] },
                { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Two"] }] },
            ],
        });
    });
});

describe("getParagraphSpans", () => {
    it("should read the text and font of each run", () => {
        const spans = getParagraphSpans([
            new Paragraph({
                children: [
                    new TextRun("Plain"),
                    new TextRun({ text: "Big", font: "Arial", size: 24, bold: true }),
                    new TextRun({ text: "Not bold", font: { ascii: "Calibri" }, bold: false }),
                    new TextRun({ text: "caps", allCaps: true }),
                ],
            }),
        ]);
        expect(spans).to.deep.equal([
            [
                { text: "Plain", font: undefined, size: undefined, bold: undefined },
                { text: "Big", font: "Arial", size: 12, bold: true },
                { text: "Not bold", font: "Calibri", size: undefined, bold: false },
                { text: "CAPS", font: undefined, size: undefined, bold: undefined },
            ],
        ]);
    });

    it("should read tabs and line breaks", () => {
        const [[span]] = getParagraphSpans([
            new Paragraph({ children: [new TextRun({ text: "a", break: 1 }), new TextRun({ children: [new Tab(), "b"] })] }),
        ]);
        expect(span.text).to.equal("\na");
        expect(getParagraphSpans([new Paragraph({ children: [new TextRun({ children: [new Tab(), "b"] })] })])[0][0].text).to.equal("\tb");
    });

    it("should read the text of hyperlinks, and leave out runs without text", () => {
        const image = new ImageRun({ type: "png", data: Buffer.from(""), transformation: { width: 10, height: 10 } });
        const spans = getParagraphSpans([
            new Paragraph({
                children: [
                    new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("web")] }),
                    new InternalHyperlink({ anchor: "top", children: [new TextRun("inside")] }),
                    image,
                ],
            }),
        ]);
        expect(spans[0].map(({ text }) => text)).to.deep.equal(["web", "inside"]);
    });
});

describe("resolveShapeSize", () => {
    const lineHeight = measureLineHeight() * PIXELS_PER_POINT;

    it("should keep sizes given in pixels", () => {
        const transformation = { width: 100, height: 50, rotation: 10 };
        expect(resolveShapeSize({ type: "rectangle", transformation })).to.deep.equal(transformation);
    });

    it("should fit the width to the longest line, with the margins and a little room", () => {
        const { width, height } = resolveShapeSize({
            type: "rectangle",
            text: "Hello\nHi",
            transformation: { width: "fitText", height: 40 },
        });
        // 7.2pt margins on each side, and 2 pixels of room
        expect(width).to.equal(Math.ceil(measureTextWidth("Hello") * PIXELS_PER_POINT + 14.4 * PIXELS_PER_POINT + 2));
        expect(height).to.equal(40);
    });

    it("should fit the height to the lines of text, wrapped at the width", () => {
        const { height } = resolveShapeSize({
            type: "rectangle",
            children: [new Paragraph("word word word word")],
            transformation: { width: 60, height: "fitText" },
            textOptions: { margins: { top: 0, bottom: 0, left: 0, right: 0 } },
        });
        // About two words fit on each 60 pixel line
        expect(height).to.equal(Math.ceil(2 * lineHeight));
    });

    it("should not wrap text that doesn't wrap", () => {
        const { height } = resolveShapeSize({
            type: "rectangle",
            text: "word word word word",
            transformation: { width: 20, height: "fitText" },
            textOptions: { wrap: false, margins: { top: 0, bottom: 0 } },
        });
        expect(height).to.equal(Math.ceil(lineHeight));
    });

    it("should be one line tall without text", () => {
        const { width, height } = resolveShapeSize({ type: "rectangle", transformation: { width: "fitText", height: "fitText" } });
        expect(height).to.equal(Math.ceil(lineHeight + 7.2 * PIXELS_PER_POINT));
        expect(width).to.equal(Math.ceil(14.4 * PIXELS_PER_POINT + 2));
    });

    it("should grow shapes whose text box is smaller than the shape", () => {
        const square = resolveShapeSize({ type: "rectangle", text: "Approved?", transformation: { width: "fitText", height: 60 } });
        const diamond = resolveShapeSize({ type: "diamond", text: "Approved?", transformation: { width: "fitText", height: 60 } });
        // A diamond's text box is half its width
        expect(diamond.width).to.be.closeTo(square.width * 2, 2);

        const rounded = resolveShapeSize({
            type: "roundedRectangle",
            adjustments: { cornerRadius: 50 },
            text: "Rounded",
            transformation: { width: "fitText", height: "fitText" },
        });
        expect(rounded.width).to.be.greaterThan(
            resolveShapeSize({ type: "rectangle", text: "Rounded", transformation: { width: "fitText", height: 40 } }).width,
        );
    });

    it("should fit a custom shape like a rectangle", () => {
        expect(resolveShapeSize({ type: "custom", text: "Hi", transformation: { width: "fitText", height: 20 } })).to.deep.equal(
            resolveShapeSize({ type: "rectangle", text: "Hi", transformation: { width: "fitText", height: 20 } }),
        );
    });

    it("should measure text that runs up or down the shape across its height", () => {
        const { width, height } = resolveShapeSize({
            type: "rectangle",
            text: "Sideways",
            transformation: { width: "fitText", height: "fitText" },
            textOptions: { direction: "topToBottom" },
        });
        expect(height).to.equal(Math.ceil(measureTextWidth("Sideways") * PIXELS_PER_POINT + 7.2 * PIXELS_PER_POINT + 2));
        expect(width).to.equal(Math.ceil(lineHeight + 14.4 * PIXELS_PER_POINT));
        expect(
            resolveShapeSize({
                type: "rectangle",
                text: "Sideways",
                transformation: { width: 40, height: 30 },
                textOptions: { direction: "horizontal" },
            }),
        ).to.deep.equal({ width: 40, height: 30 });
    });

    it("should grow a shape whose text box is a fixed length smaller", () => {
        // A rounded rectangle's text box is inset by part of its corner radius, which depends on its shorter side
        const { width } = resolveShapeSize({
            type: "flowChartAlternateProcess",
            text: "Alternate",
            transformation: { width: "fitText", height: 30 },
        });
        expect(width).to.be.greaterThan(
            resolveShapeSize({ type: "rectangle", text: "Alternate", transformation: { width: "fitText", height: 30 } }).width,
        );
    });

    it("should grow a shape whose text box is empty at first", () => {
        // A pie's text box is empty when the pie is much wider than it is tall
        const { width } = resolveShapeSize({ type: "pie", text: "Slice", transformation: { width: "fitText", height: 20 } });
        expect(Number.isFinite(width) && width > 0).to.equal(true);
    });

    it("should give up on a text box that doesn't grow with the shape", () => {
        // A line's text box doesn't grow with its height, so its height can't be fitted and stops growing
        const { height } = resolveShapeSize({ type: "line", text: "a", transformation: { width: 50, height: "fitText" } });
        expect(height).to.be.greaterThan(0);
    });
});
