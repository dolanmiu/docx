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
                dash: "shortDot",
                startArrow: "oval",
                endArrow: { type: "triangle", width: "large", length: "small" },
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

    it("should write the cap, compound line and join with their OOXML names", () => {
        const tree = new Formatter().format(createShapeLine({ cap: "round", compound: "thickThin", join: "bevel", dash: "longDash" }));
        expect(tree).to.deep.equal({
            "a:ln": [
                { _attr: { w: 12700, cap: "rnd", cmpd: "thickThin" } },
                black,
                { "a:prstDash": { _attr: { val: "lgDash" } } },
                { "a:bevel": {} },
            ],
        });
    });

    it("should write each cap and compound line", () => {
        const attributes = (options: Parameters<typeof createShapeLine>[0]): unknown =>
            new Formatter().format(createShapeLine(options))["a:ln"][0]._attr;
        expect(attributes({ cap: "flat" })).to.deep.equal({ w: 12700, cap: "flat" });
        expect(attributes({ cap: "square" })).to.deep.equal({ w: 12700, cap: "sq" });
        expect(attributes({ compound: "single" })).to.deep.equal({ w: 12700, cmpd: "sng" });
        expect(attributes({ compound: "double" })).to.deep.equal({ w: 12700, cmpd: "dbl" });
        expect(attributes({ compound: "thinThick" })).to.deep.equal({ w: 12700, cmpd: "thinThick" });
        expect(attributes({ compound: "triple" })).to.deep.equal({ w: 12700, cmpd: "tri" });
    });

    it("should write round joins, and miter joins with Word's limit", () => {
        expect(new Formatter().format(createShapeLine({ join: "round" }))["a:ln"][2]).to.deep.equal({ "a:round": {} });
        expect(new Formatter().format(createShapeLine({ join: "miter" }))["a:ln"][2]).to.deep.equal({
            "a:miter": { _attr: { lim: 800000 } },
        });
    });

    it("should write a custom dash in thousandths of a percent of the line width", () => {
        const tree = new Formatter().format(
            createShapeLine({
                dash: [
                    { length: 4, gap: 1.5 },
                    { length: 0.5, gap: 1.5 },
                ],
            }),
        );
        expect(tree["a:ln"][2]).to.deep.equal({
            "a:custDash": [{ "a:ds": { _attr: { d: 400000, sp: 150000 } } }, { "a:ds": { _attr: { d: 50000, sp: 150000 } } }],
        });
    });

    it("should reject a custom dash without dashes, or with negative lengths", () => {
        expect(() => createShapeLine({ dash: [] })).to.throw("Invalid custom line dash. Expected at least 1 dash");
        expect(() => createShapeLine({ dash: [{ length: -1, gap: 1 }] })).to.throw("Invalid custom line dash { length: -1, gap: 1 }");
        expect(() => createShapeLine({ dash: [{ length: 1, gap: Number.NaN }] })).to.throw("Invalid custom line dash");
    });

    it("should colour the line with a gradient instead of its colour", () => {
        const tree = new Formatter().format(
            createShapeLine({
                color: "FF0000",
                width: 3,
                gradient: {
                    angle: 90,
                    stops: [
                        { position: 0, color: "4472C4" },
                        { position: 100, color: "70AD47" },
                    ],
                },
            }),
        );
        expect(tree).to.deep.equal({
            "a:ln": [
                { _attr: { w: 38100 } },
                {
                    "a:gradFill": [
                        { _attr: { rotWithShape: true } },
                        {
                            "a:gsLst": [
                                { "a:gs": [{ _attr: { pos: 0 } }, { "a:srgbClr": { _attr: { val: "4472C4" } } }] },
                                { "a:gs": [{ _attr: { pos: 100000 } }, { "a:srgbClr": { _attr: { val: "70AD47" } } }] },
                            ],
                        },
                        { "a:lin": { _attr: { ang: 5400000 } } },
                    ],
                },
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
        expect(
            getShapeLineOverhang({ width: 2, startArrow: { type: "oval", width: "small", length: "large" }, endArrow: "arrow" }),
        ).to.equal(63500);
        expect(getShapeLineOverhang({ width: 2, startArrow: { type: "diamond", width: "small", length: "small" } })).to.equal(25400);
    });
});
