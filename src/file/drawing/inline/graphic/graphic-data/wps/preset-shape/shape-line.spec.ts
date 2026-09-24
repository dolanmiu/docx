import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeLine, getShapeLineOverhang } from "./shape-line";

const black = { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "000000" } } }] };

describe("createShapeLine", () => {
    it("should write a solid black line 1pt wide by default", () => {
        expect(new Formatter().format(createShapeLine())).to.deep.equal({
            "a:ln": [{ _attr: { w: 12700 } }, black],
        });
    });

    it("should write no line for none", () => {
        expect(new Formatter().format(createShapeLine("none"))).to.deep.equal({
            "a:ln": [{ "a:noFill": {} }],
        });
    });

    it("should write a 1pt line in the given colour", () => {
        expect(new Formatter().format(createShapeLine("C00000"))).to.deep.equal({
            "a:ln": [{ _attr: { w: 12700 } }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "C00000" } } }] }],
        });
    });

    it("should write every option in schema order", () => {
        const tree = new Formatter().format(
            createShapeLine({
                color: "C00000",
                width: 2.5,
                transparency: 10,
                dash: "sysDot",
                startArrow: "oval",
                endArrow: { type: "triangle", width: "lg", length: "sm" },
            }),
        );
        expect(tree).to.deep.equal({
            "a:ln": [
                { _attr: { w: 31750 } },
                { "a:solidFill": [{ "a:srgbClr": [{ _attr: { val: "C00000" } }, { "a:alpha": { _attr: { val: 90000 } } }] }] },
                { "a:prstDash": { _attr: { val: "sysDot" } } },
                { "a:headEnd": { _attr: { type: "oval" } } },
                { "a:tailEnd": { _attr: { type: "triangle", w: "lg", len: "sm" } } },
            ],
        });
    });

    it("should default the colour to black when other options are given", () => {
        expect(new Formatter().format(createShapeLine({ width: 0 }))).to.deep.equal({
            "a:ln": [{ _attr: { w: 0 } }, black],
        });
    });

    it("should reject a width outside 0 to 1584 points", () => {
        expect(() => createShapeLine({ width: -1 })).to.throw("Invalid line width -1");
        expect(() => createShapeLine({ width: 12700 })).to.throw("Invalid line width 12700");
    });
});

describe("getShapeLineOverhang", () => {
    it("should be half the default 1pt line", () => {
        expect(getShapeLineOverhang()).to.equal(6350);
    });

    it("should be 0 without a line", () => {
        expect(getShapeLineOverhang("none")).to.equal(0);
    });

    it("should be half the line width for a colour or options without arrowheads", () => {
        expect(getShapeLineOverhang("C00000")).to.equal(6350);
        expect(getShapeLineOverhang({ width: 3 })).to.equal(19050);
    });

    it("should grow with the largest arrowhead", () => {
        expect(getShapeLineOverhang({ width: 2, endArrow: "triangle" })).to.equal(38100);
        expect(getShapeLineOverhang({ width: 2, startArrow: { type: "oval", width: "sm", length: "lg" }, endArrow: "arrow" })).to.equal(
            63500,
        );
        expect(getShapeLineOverhang({ width: 2, startArrow: { type: "diamond", width: "sm", length: "sm" } })).to.equal(25400);
    });
});
