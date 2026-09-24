import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeEffects, getShapeEffectsOverhang } from "./shape-effects";

const blackAt40Percent = { "a:srgbClr": [{ _attr: { val: "000000" } }, { "a:alpha": { _attr: { val: 40000 } } }] };

describe("createShapeEffects", () => {
    it("should write Word's offset shadow, down and to the right, by default", () => {
        expect(new Formatter().format(createShapeEffects({ shadow: {} }))).to.deep.equal({
            "a:effectLst": [
                {
                    "a:outerShdw": [{ _attr: { blurRad: 50800, dist: 38100, dir: 2700000, rotWithShape: false } }, blackAt40Percent],
                },
            ],
        });
    });

    it("should write a shadow's colour, transparency, blur, distance and angle", () => {
        const tree = new Formatter().format(
            createShapeEffects({ shadow: { color: "1F4E79", transparency: 0, blur: 0, distance: 6, angle: -90 } }),
        );
        expect(tree).to.deep.equal({
            "a:effectLst": [
                {
                    "a:outerShdw": [
                        { _attr: { blurRad: 0, dist: 76200, dir: 16200000, rotWithShape: false } },
                        { "a:srgbClr": { _attr: { val: "1F4E79" } } },
                    ],
                },
            ],
        });
    });

    it("should write an inner shadow", () => {
        expect(new Formatter().format(createShapeEffects({ innerShadow: { angle: 270 } }))).to.deep.equal({
            "a:effectLst": [{ "a:innerShdw": [{ _attr: { blurRad: 50800, dist: 38100, dir: 16200000 } }, blackAt40Percent] }],
        });
    });

    it("should write a glow 5pt wide and 60% transparent by default", () => {
        expect(new Formatter().format(createShapeEffects({ glow: { color: "FFC000" } }))).to.deep.equal({
            "a:effectLst": [
                {
                    "a:glow": [
                        { _attr: { rad: 63500 } },
                        { "a:srgbClr": [{ _attr: { val: "FFC000" } }, { "a:alpha": { _attr: { val: 40000 } } }] },
                    ],
                },
            ],
        });
    });

    it("should write soft edges in EMUs", () => {
        expect(new Formatter().format(createShapeEffects({ softEdges: 2.5 }))).to.deep.equal({
            "a:effectLst": [{ "a:softEdge": { _attr: { rad: 31750 } } }],
        });
    });

    it("should write a half reflection, touching the shape, by default", () => {
        expect(new Formatter().format(createShapeEffects({ reflection: {} }))).to.deep.equal({
            "a:effectLst": [
                {
                    "a:reflection": {
                        _attr: {
                            blurRad: 6350,
                            stA: 50000,
                            endA: 300,
                            endPos: 50000,
                            dist: 0,
                            dir: 5400000,
                            sy: -100000,
                            algn: "bl",
                            rotWithShape: false,
                        },
                    },
                },
            ],
        });
    });

    it("should write a reflection's transparency, size, distance and blur", () => {
        const tree = new Formatter().format(createShapeEffects({ reflection: { transparency: 20, size: 90, distance: 4, blur: 0 } }));
        expect(tree["a:effectLst"][0]["a:reflection"]._attr).to.include({ blurRad: 0, stA: 80000, endPos: 90000, dist: 50800 });
    });

    it("should write the effects in the order the schema requires", () => {
        const tree = new Formatter().format(
            createShapeEffects({ softEdges: 1, reflection: {}, shadow: {}, innerShadow: {}, glow: { color: "FF0000" } }),
        );
        expect(tree["a:effectLst"].map((effect: object) => Object.keys(effect)[0])).to.deep.equal([
            "a:glow",
            "a:innerShdw",
            "a:outerShdw",
            "a:reflection",
            "a:softEdge",
        ]);
    });

    it("should write an empty effect list without effects", () => {
        expect(new Formatter().format(createShapeEffects({}))).to.deep.equal({ "a:effectLst": {} });
    });

    it("should reject lengths outside 0 to 1584 points and percentages outside 0 to 100", () => {
        expect(() => createShapeEffects({ shadow: { blur: -1 } })).to.throw("Invalid shadow blur -1");
        expect(() => createShapeEffects({ shadow: { distance: 2000 } })).to.throw("Invalid shadow distance 2000");
        expect(() => createShapeEffects({ glow: { color: "FF0000", size: -2 } })).to.throw("Invalid glow size -2");
        expect(() => createShapeEffects({ softEdges: Number.NaN })).to.throw("Invalid soft edges radius NaN");
        expect(() => createShapeEffects({ reflection: { size: 150 } })).to.throw("Invalid reflection size 150");
        expect(() => createShapeEffects({ reflection: { transparency: -5 } })).to.throw("Invalid reflection transparency -5");
    });
});

describe("getShapeEffectsOverhang", () => {
    it("should be nothing without effects", () => {
        expect(getShapeEffectsOverhang(undefined, 1000)).to.deep.equal({ top: 0, right: 0, bottom: 0, left: 0 });
        expect(getShapeEffectsOverhang({ softEdges: 4, innerShadow: {} }, 1000)).to.deep.equal({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it("should reach further on the side a shadow falls to", () => {
        // A 4pt blur, moved 3pt down and to the right
        const offset = 38100 * Math.SQRT1_2;
        expect(getShapeEffectsOverhang({ shadow: {} }, 1000)).to.deep.equal({
            top: Math.ceil(50800 - offset),
            right: Math.ceil(50800 + offset),
            bottom: Math.ceil(50800 + offset),
            left: Math.ceil(50800 - offset),
        });
    });

    it("should not reach past a side a shadow moves further away from than its blur", () => {
        expect(getShapeEffectsOverhang({ shadow: { blur: 1, distance: 10, angle: 0 } }, 1000)).to.deep.equal({
            top: 12700,
            right: 139700,
            bottom: 12700,
            left: 0,
        });
    });

    it("should reach the glow's size past every side", () => {
        expect(getShapeEffectsOverhang({ glow: { color: "FF0000", size: 10 } }, 1000)).to.deep.equal({
            top: 127000,
            right: 127000,
            bottom: 127000,
            left: 127000,
        });
        expect(getShapeEffectsOverhang({ glow: { color: "FF0000" } }, 1000).top).to.equal(63500);
    });

    it("should reach below the shape by the part of it that is reflected", () => {
        expect(getShapeEffectsOverhang({ reflection: { size: 40, distance: 2, blur: 0 } }, 1000000)).to.deep.equal({
            top: 0,
            right: 0,
            bottom: 25400 + 400000,
            left: 0,
        });
    });

    it("should take the furthest reach of each side when effects are combined", () => {
        expect(getShapeEffectsOverhang({ glow: { color: "FF0000", size: 1 }, reflection: { blur: 0 } }, 100000)).to.deep.equal({
            top: 12700,
            right: 12700,
            bottom: 50000,
            left: 12700,
        });
    });

    it("should allow for the furthest reach on every side of a rotated shape", () => {
        expect(getShapeEffectsOverhang({ reflection: { blur: 0 } }, 100000, 30)).to.deep.equal({
            top: 50000,
            right: 50000,
            bottom: 50000,
            left: 50000,
        });
        expect(getShapeEffectsOverhang({ reflection: { blur: 0 } }, 100000, 360).top).to.equal(0);
    });
});
