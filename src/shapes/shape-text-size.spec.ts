import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { type IContext, Paragraph } from "docx";

import { createTextParagraphs, resolveShapeSize } from "./shape-text-size";
import { type TextStyles, getTextStyles } from "./shape-text-styles";
import { measureLineHeight, measureTextWidth } from "./text-metrics";

const PIXELS_PER_POINT = 4 / 3;

const stylesOf = (document: object): TextStyles =>
    getTextStyles({ file: new File({ styles: { default: { document } }, sections: [] }), stack: [] } as unknown as IContext);

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

    it("should leave out the space the document puts before and after paragraphs", () => {
        const [paragraph] = createTextParagraphs("One", stylesOf({ paragraph: { spacing: { after: 160 } } }));
        expect(new Formatter().format(paragraph)["w:p"][0]).to.deep.equal({
            "w:pPr": [{ "w:spacing": { _attr: { "w:before": 0, "w:after": 0 } } }, { "w:jc": { _attr: { "w:val": "center" } } }],
        });
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

    it("should fit the text of a custom shape in its text area", () => {
        const rectangle = resolveShapeSize({ type: "rectangle", text: "Hello", transformation: { width: "fitText", height: "fitText" } });
        // The text area is the middle half of the shape across, and its top half down
        const { width, height } = resolveShapeSize({
            type: "custom",
            path: "M 0 0 H 100 V 100 H 0 Z",
            textArea: { left: 25, top: 0, right: 75, bottom: 50 },
            text: "Hello",
            transformation: { width: "fitText", height: "fitText" },
        });
        expect(width).to.be.closeTo(rectangle.width * 2, 2);
        expect(height).to.be.closeTo(rectangle.height * 2, 2);
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

    it("should measure text in the document's styles", () => {
        const options = { type: "rectangle", text: "Hello", transformation: { width: "fitText", height: "fitText" } } as const;
        const styles = stylesOf({ run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 160, line: 480 } } });
        const { width, height } = resolveShapeSize(options, styles);
        expect(width).to.equal(Math.ceil((measureTextWidth("Hello", { font: "Calibri", size: 11 }) + 14.4) * PIXELS_PER_POINT + 2));
        // Double spacing, and no space after: the text's paragraph leaves it out
        expect(height).to.equal(Math.ceil((2 * measureLineHeight({ font: "Calibri", size: 11 }) + 7.2) * PIXELS_PER_POINT));

        // Paragraphs of the shape's own keep the document's spacing
        const own = resolveShapeSize(
            { type: "rectangle", children: [new Paragraph("Hello")], transformation: { width: 100, height: "fitText" } },
            styles,
        );
        expect(own.height).to.equal(Math.ceil((2 * measureLineHeight({ font: "Calibri", size: 11 }) + 8 + 7.2) * PIXELS_PER_POINT));
    });

    it("should make a shape without text as tall as an empty paragraph in the document's styles", () => {
        const { height } = resolveShapeSize(
            { type: "rectangle", transformation: { width: 40, height: "fitText" } },
            stylesOf({ run: { size: 40 } }),
        );
        expect(height).to.equal(Math.ceil((measureLineHeight({ size: 20 }) + 7.2) * PIXELS_PER_POINT));
    });

    it("should give up on a text box that doesn't grow with the shape", () => {
        // A line's text box doesn't grow with its height, so its height can't be fitted and stops growing
        const { height } = resolveShapeSize({ type: "line", text: "a", transformation: { width: 50, height: "fitText" } });
        expect(height).to.be.greaterThan(0);
    });
});
