// cspell:ignore anchorx anchory allowoverlap wrapcoords
import { describe, expect, it } from "vitest";

import { groupOutlined, outlineEffects, readVmlFloating, readVmlStyle, vmlLength, vmlOutline, vmlShapeOf } from "./vml-drawings";

/** A VML shape of an element and style, with its attributes and children */
const shape = (style: string, children: readonly object[] = [], name = "v:rect", attributes: object = {}): object => ({
    [name]: [{ _attr: { style, ...attributes } }, ...children],
});

/** The shape of a `w:pict` of one shape, read */
const shapeOf = (style: string, children: readonly object[] = []): Exclude<ReturnType<typeof vmlShapeOf>, string | undefined> => {
    const read = vmlShapeOf([shape(style, children)]);
    if (read === undefined || typeof read === "string") {
        throw new Error(read ?? "no shape");
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
    it("should read lengths in points, inches, centimeters, millimeters, picas and pixels, and a number with no unit as pixels", () => {
        expect(vmlLength("100pt")).to.equal(100);
        expect(vmlLength("1.5in")).to.equal(108);
        expect(vmlLength("2.54cm")).to.be.closeTo(72, 1e-9);
        expect(vmlLength("25.4mm")).to.be.closeTo(72, 1e-9);
        expect(vmlLength("2pc")).to.equal(24);
        // CSS's pixels, 96 to the inch
        expect(vmlLength("100px")).to.equal(75);
        // A number with no unit is in pixels (`word-stops-vml-shapes.docx` VM29c: a shape of 100 by 20 is 75 by 15 points)
        expect(vmlLength("100")).to.equal(75);
        expect(vmlLength("20")).to.equal(15);
        expect(vmlLength("-.5in")).to.equal(-36);
        expect(vmlLength("0")).to.equal(0);
        expect(vmlLength(undefined)).to.equal(undefined);
    });

    it("should say why a length in ems or a share, or what isn't a number, can't be read", () => {
        // Word drew a shape of 10 by 2 ems 8 by 1.6 points (VM29b), by no rule found
        expect(vmlLength("2em")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("50%")).to.equal("a VML drawing with a length in units not yet followed");
        expect(vmlLength("auto")).to.equal("a VML drawing with a length that isn't a number");
    });
});

describe("vmlOutline", () => {
    it("should read whether a shape has an outline, its weight, 0.72 points unless given, and whether it is drawn", () => {
        expect(vmlOutline({}, readVmlStyle(""))).to.deep.equal({ weight: 0.72, drawn: true });
        expect(vmlOutline({ strokeweight: "3pt" }, readVmlStyle(""))).to.deep.equal({ weight: 3, drawn: true });
        expect(vmlOutline({ stroked: "f" }, readVmlStyle(""))).to.deep.equal({ weight: 0, drawn: false });
        // A hidden shape's outline isn't drawn, though it has one (`word-vml.docx` VM4)
        expect(vmlOutline({}, readVmlStyle("visibility:hidden"))).to.deep.equal({ weight: 0.72, drawn: false });
        expect(vmlOutline({ strokeweight: "2em" }, readVmlStyle(""))).to.equal("a VML drawing with a length in units not yet followed");
    });
});

describe("outlineEffects", () => {
    it("should take half the outline's weight on each side, in whole points across the page, down on the left and up on the right", () => {
        // VM24a, VM24b, VM24c: none on the left and one on the right of 0.72 and 1 point, one and two of 3 points
        expect(outlineEffects(0.72)).to.deep.equal({ top: 0.36, bottom: 0.36, left: 0, right: 1 });
        expect(outlineEffects(1)).to.deep.equal({ top: 0.5, bottom: 0.5, left: 0, right: 1 });
        expect(outlineEffects(3)).to.deep.equal({ top: 1.5, bottom: 1.5, left: 1, right: 2 });
        expect(outlineEffects(0)).to.deep.equal({ top: 0, bottom: 0, left: 0, right: 0 });
    });
});

describe("vmlShapeOf", () => {
    it("should read the one shape a drawing draws, past the types of shapes it defines", () => {
        const read = vmlShapeOf([{ "v:shapetype": [{ _attr: { id: "_x0000_t75" } }] }, shape("width:72pt;height:36pt", [], "v:shape")]);
        expect(read === undefined || typeof read === "string" ? read : [...read.style]).to.deep.equal([
            ["width", "72pt"],
            ["height", "36pt"],
        ]);
        // A shape of a type has the type's attributes where it doesn't give its own, as Word's type for pictures gives them no
        // outline (`word-stops-vml-pictures2.docx` VM30a to VM30h), and not another type's
        const typed = vmlShapeOf([
            { "v:shapetype": [{ _attr: { id: "_x0000_t75", stroked: "f", strokeweight: "2pt" } }] },
            { "v:shapetype": [{ _attr: { id: "_x0000_t1", filled: "f" } }] },
            shape("width:72pt;height:36pt", [], "v:shape", { type: "#_x0000_t75", strokeweight: "3pt" }),
        ]);
        expect(typeof typed === "object" && typed.attributes).to.deep.equal({
            stroked: "f",
            strokeweight: "3pt",
            style: "width:72pt;height:36pt",
            type: "#_x0000_t75",
        });
        expect(shapeOf("width:1pt").attributes).to.deep.equal({ style: "width:1pt" });
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

    it("should read a drawing of no shape as nothing, and say why one of more than one can't be laid out", () => {
        // A `w:pict` of a shape type alone draws nothing (`word-stops-vml-shape-type.docx` VM29e)
        expect(vmlShapeOf([{ "v:shapetype": [] }])).to.equal(undefined);
        expect(vmlShapeOf({})).to.equal(undefined);
        expect(vmlShapeOf([shape(""), shape("")])).to.equal("a VML drawing of more than one shape");
    });
});

describe("groupOutlined", () => {
    it("should say whether any shape of a group, or of a group in it, has an outline that is drawn", () => {
        const plain = shape("width:90;height:50", [], "v:rect", { stroked: "f" });
        const group = (...shapes: readonly object[]): Readonly<Record<string, unknown>> => ({
            "v:group": [{ _attr: { style: "width:200pt;height:50pt" } }, ...shapes],
        });
        // A group draws no outline of its own (`word-stops-vml-shapes.docx` VM29f)
        expect(groupOutlined(group(plain, plain))).to.equal(false);
        expect(groupOutlined(group(plain, shape("width:90;height:50")))).to.equal(true);
        expect(groupOutlined(group(plain, shape("width:90;height:50;visibility:hidden")))).to.equal(false);
        expect(groupOutlined(group(group(plain, shape("", [], "v:oval"))))).to.equal(true);
        expect(groupOutlined(group(shape("", [], "v:rect", { strokeweight: "2em" })))).to.equal(true);
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
            keptOnPage: true,
        });
        // One placed by its left and top, which Word reads as its margins (VM27f)
        expect(readVmlFloating(shapeOf("position:absolute;left:10pt;top:20pt"), SQUARE, 100, 72)).to.deep.include({
            horizontal: { from: "column", offset: 10 },
            vertical: { from: "paragraph", offset: 20 },
        });
        // With an outline, the room it takes beside it
        expect(readVmlFloating(shapeOf("position:absolute"), SQUARE, 100, 72, 3)).to.deep.include({
            effects: { top: 1.5, bottom: 1.5, left: 1, right: 2 },
        });
    });

    it("should read whether a shape may overlap other drawings, which it may unless it says not", () => {
        const overlapOf = (attributes: Record<string, unknown>): unknown => {
            const read = vmlShapeOf([{ "v:rect": [{ _attr: { style: "", ...attributes } }] }]);
            return read === undefined || typeof read === "string"
                ? read
                : (readVmlFloating(read, SQUARE, 1, 1) as { readonly mayOverlap: boolean }).mayOverlap;
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
        // Against the inside and outside margins (VM28a, VM28b)
        expect(readVmlFloating(shapeOf("mso-position-horizontal-relative:inner-margin-area"), SQUARE, 1, 1)).to.deep.include({
            horizontal: { from: "insideMargin", offset: 0 },
        });
        expect(readVmlFloating(shapeOf("mso-position-horizontal-relative:outer-margin-area"), SQUARE, 1, 1)).to.deep.include({
            horizontal: { from: "outsideMargin", offset: 0 },
        });
    });

    it("should wrap the text tightly or through as square, one point nearer on the right (VM14, VM27a, VM27b)", () => {
        for (const type of ["tight", "through"]) {
            expect(readVmlFloating(shapeOf(""), { _attr: { type } }, 100, 72)).to.deep.include({
                wrap: "square",
                distances: { top: 0, bottom: 0, left: 9, right: 8 },
            });
        }
        expect(readVmlFloating(shapeOf("mso-wrap-distance-right:0.5pt"), { _attr: { type: "tight" } }, 100, 72)).to.deep.include({
            distances: { top: 0, bottom: 0, left: 9, right: 0 },
        });
    });

    it("should size a shape by a share of the margins (VM27e)", () => {
        expect(readVmlFloating(shapeOf("mso-width-percent:300;mso-width-relative:margin"), SQUARE, 100, 72)).to.deep.include({
            width: 100,
            relativeWidth: { from: "margin", share: 0.3 },
        });
        // Of the margins when it doesn't say what
        expect(readVmlFloating(shapeOf("mso-height-percent:250"), SQUARE, 100, 72)).to.deep.include({
            relativeHeight: { from: "margin", share: 0.25 },
        });
    });

    it("should say why a shape that is turned, sized by a share of what isn't the margins, or placed or wrapped in a way not yet followed can't be laid out", () => {
        const reasonOf = (style: string, wrap: Record<string, unknown> = SQUARE, attributes: object = {}): unknown => {
            const read = vmlShapeOf([shape(style, [], "v:rect", attributes)]);
            return read === undefined || typeof read === "string" ? read : readVmlFloating(read, wrap, 1, 1);
        };
        expect(reasonOf("", { _attr: { type: "none" } })).to.equal("a VML drawing that text flows around in a way not yet followed");
        // Word keeps the text from a polygon's edge at each line's top (VM27c), in a way not yet followed
        expect(reasonOf("", { _attr: { type: "tight" } }, { wrapcoords: "0 0 21600 0 21600 21600 10800 21600 0 0" })).to.equal(
            "a VML drawing wrapped tightly round a polygon of its own",
        );
        expect(reasonOf("", { _attr: { type: "square", side: "inside" } })).to.equal(
            "a VML drawing that text flows around in a way not yet followed",
        );
        // Word wraps the text round the box of a turned shape, about 7 twips nearer than that box (VM27d)
        expect(reasonOf("rotation:20")).to.equal("a turned VML drawing that text flows around");
        expect(reasonOf("mso-width-percent:500;mso-width-relative:page")).to.equal(
            "a VML drawing sized by a share of what it is placed against, other than the margins",
        );
        expect(reasonOf("mso-height-percent:x")).to.equal("a VML drawing with a length that isn't a number");
        expect(reasonOf("mso-position-horizontal-relative:cell")).to.equal("a VML drawing placed against what isn't followed yet");
        expect(reasonOf("mso-position-vertical:inline")).to.equal("a VML drawing lined up in a way not yet followed");
        expect(reasonOf("left:10pt;margin-left:20pt")).to.equal("a VML drawing placed by its left or top and its margins");
        expect(reasonOf("margin-top:10%")).to.equal("a VML drawing with a length in units not yet followed");
        expect(reasonOf("mso-wrap-distance-left:2em")).to.equal("a VML drawing with a length in units not yet followed");
    });
});
