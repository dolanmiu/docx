// cspell:ignore anchorx anchory allowoverlap
import { describe, expect, it } from "vitest";

import { readVmlFloating, readVmlStyle, vmlLength, vmlShapeOf } from "./vml-drawings";

/** A VML shape of an element and style, with its children */
const shape = (style: string, children: readonly object[] = [], name = "v:rect"): object => ({
    [name]: [{ _attr: { style } }, ...children],
});

/** The shape of a `w:pict` of one shape, read */
const shapeOf = (style: string, children: readonly object[] = []): Exclude<ReturnType<typeof vmlShapeOf>, string> => {
    const read = vmlShapeOf([shape(style, children)]);
    if (typeof read === "string") {
        throw new Error(read);
    }
    return read;
};

const SQUARE = { _attr: { type: "square" } };

describe("readVmlStyle", () => {
    it("should read a style's properties by their names in lower case, and leave out what isn't a property", () => {
        const style = readVmlStyle("Width:100pt; height : 50pt;;position:absolute;broken");
        expect([...style]).to.deep.equal([
            ["width", "100pt"],
            ["height", "50pt"],
            ["position", "absolute"],
        ]);
        expect(readVmlStyle(undefined).size).to.equal(0);
    });
});

describe("vmlLength", () => {
    it("should read lengths in points, inches, centimeters, millimeters and picas", () => {
        expect(vmlLength("100pt")).to.equal(100);
        expect(vmlLength("1.5in")).to.equal(108);
        expect(vmlLength("2.54cm")).to.be.closeTo(72, 1e-9);
        expect(vmlLength("25.4mm")).to.be.closeTo(72, 1e-9);
        expect(vmlLength("2pc")).to.equal(24);
        expect(vmlLength("-.5in")).to.equal(-36);
        expect(vmlLength("0")).to.equal(0);
        expect(vmlLength(undefined)).to.equal(undefined);
    });

    it("should say why a length in pixels, ems or a share, a number with no unit, or what isn't a number can't be read", () => {
        expect(vmlLength("100px")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("2em")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("50%")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("400")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("auto")).to.equal("a VML drawing with a length that isn't a number");
    });
});

describe("vmlShapeOf", () => {
    it("should read the one shape a drawing draws, past the types of shapes it defines", () => {
        const read = vmlShapeOf([{ "v:shapetype": [{ _attr: { id: "_x0000_t75" } }] }, shape("width:72pt;height:36pt", [], "v:shape")]);
        expect(typeof read === "string" ? read : [...read.style]).to.deep.equal([
            ["width", "72pt"],
            ["height", "36pt"],
        ]);
    });

    it("should read a text box's style and content", () => {
        const paragraph = { "w:p": [{ "w:r": [{ "w:t": ["Hi"] }] }] };
        const read = shapeOf("width:200pt", [
            { "v:textbox": [{ _attr: { style: "mso-fit-shape-to-text:t" } }, { "w:txbxContent": [paragraph] }] },
        ]);
        expect(read.text).to.deep.equal([paragraph]);
        expect(read.textStyle?.get("mso-fit-shape-to-text")).to.equal("t");
        // A shape with no text box has neither
        expect(shapeOf("width:200pt").text).to.equal(undefined);
    });

    it("should say why a drawing of no shape, or of more than one, can't be laid out", () => {
        expect(vmlShapeOf([{ "v:shapetype": [] }])).to.equal("a VML drawing with no shape");
        expect(vmlShapeOf({})).to.equal("a VML drawing with no shape");
        expect(vmlShapeOf([shape(""), shape("")])).to.equal("a VML drawing of more than one shape");
    });
});

describe("readVmlFloating", () => {
    it("should read a shape placed at a distance from the column and the paragraph, with VML's distances from the text", () => {
        const read = readVmlFloating(shapeOf("position:absolute;margin-left:10pt;margin-top:20pt"), SQUARE, 100, 72);
        expect(read).to.deep.equal({
            wrap: "square",
            side: "bothSides",
            width: 100,
            height: 72,
            effects: { top: 0, bottom: 0, left: 0, right: 0 },
            distances: { top: 0, bottom: 0, left: 9, right: 9 },
            horizontal: { from: "column", offset: 10 },
            vertical: { from: "paragraph", offset: 20 },
            mayOverlap: true,
        });
    });

    it("should read whether a shape may overlap other drawings, which it may unless it says not", () => {
        const overlapOf = (attributes: Record<string, unknown>): unknown => {
            const read = vmlShapeOf([{ "v:rect": [{ _attr: { style: "", ...attributes } }] }]);
            return typeof read === "string" ? read : (readVmlFloating(read, SQUARE, 1, 1) as { readonly mayOverlap: boolean }).mayOverlap;
        };
        expect(overlapOf({})).to.equal(true);
        expect(overlapOf({ "o:allowoverlap": "t" })).to.equal(true);
        expect(overlapOf({ "o:allowoverlap": "f" })).to.equal(false);
        expect(overlapOf({ "o:allowoverlap": "false" })).to.equal(false);
    });

    it("should read what a shape is placed against, how it lines up with it, its distances and its wrapping", () => {
        const read = readVmlFloating(
            shapeOf(
                "mso-position-horizontal:right;mso-position-horizontal-relative:margin;mso-position-vertical:top;" +
                    "mso-position-vertical-relative:page;mso-wrap-distance-left:0;mso-wrap-distance-top:1pt;" +
                    "mso-wrap-distance-right:2pt;mso-wrap-distance-bottom:3pt",
            ),
            { _attr: { type: "topAndBottom", side: "largest" } },
            100,
            72,
        );
        expect(read).to.deep.include({
            wrap: "topAndBottom",
            side: "largest",
            distances: { top: 1, bottom: 3, left: 0, right: 2 },
            horizontal: { from: "margin", align: "right" },
            vertical: { from: "page", align: "top" },
        });
        // What it is placed against, from the wrapping's anchors when the style doesn't say, as older versions of Word wrote
        expect(readVmlFloating(shapeOf(""), { _attr: { type: "square", anchorx: "page", anchory: "margin" } }, 1, 1)).to.deep.include({
            horizontal: { from: "page", offset: 0 },
            vertical: { from: "margin", offset: 0 },
        });
        // Word places a shape against "paragraph" against its paragraph (VM9, VM10), as it does "text"
        for (const relative of ["line", "paragraph", "text"]) {
            expect(readVmlFloating(shapeOf(`mso-position-vertical-relative:${relative}`), SQUARE, 1, 1)).to.deep.include({
                vertical: { from: relative === "line" ? "line" : "paragraph", offset: 0 },
            });
        }
    });

    it("should say why a shape that is turned, sized by a share, or placed or wrapped in a way not yet followed can't be laid out", () => {
        const reasonOf = (style: string, wrap: Record<string, unknown> = SQUARE): unknown => readVmlFloating(shapeOf(style), wrap, 1, 1);
        expect(reasonOf("", { _attr: { type: "none" } })).to.equal("a VML drawing that text flows around in a way not yet followed");
        // Word wraps tightly round a rectangle closer than square wrapping does (VM14)
        expect(reasonOf("", { _attr: { type: "tight" } })).to.equal("a VML drawing that text flows around in a way not yet followed");
        expect(reasonOf("", { _attr: { type: "through" } })).to.equal("a VML drawing that text flows around in a way not yet followed");
        expect(reasonOf("", { _attr: { type: "square", side: "inside" } })).to.equal(
            "a VML drawing that text flows around in a way not yet followed",
        );
        expect(reasonOf("rotation:20")).to.equal("a turned VML drawing that text flows around");
        expect(reasonOf("mso-width-percent:500")).to.equal("a VML drawing sized by a share of what it is placed against");
        expect(reasonOf("mso-position-horizontal-relative:cell")).to.equal("a VML drawing placed against what isn't followed yet");
        expect(reasonOf("mso-position-vertical:inline")).to.equal("a VML drawing lined up in a way not yet followed");
        expect(reasonOf("left:10pt")).to.equal("a VML drawing placed by its left or top");
        expect(reasonOf("margin-top:10px")).to.equal("a VML drawing with a length in units not yet followed");
        expect(reasonOf("mso-wrap-distance-left:2em")).to.equal("a VML drawing with a length in units not yet followed");
    });
});
