import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeTextProperties } from "./shape-text";

describe("createShapeTextProperties", () => {
    it("should write empty body properties by default", () => {
        expect(new Formatter().format(createShapeTextProperties())).to.deep.equal({ "wps:bodyPr": { _attr: {} } });
    });

    it("should write the vertical alignment with its OOXML name", () => {
        const anchor = (verticalAlignment: "top" | "center" | "bottom"): unknown =>
            new Formatter().format(createShapeTextProperties({ verticalAlignment }))["wps:bodyPr"]._attr.anchor;
        expect(anchor("top")).to.equal("t");
        expect(anchor("center")).to.equal("ctr");
        expect(anchor("bottom")).to.equal("b");
    });

    it("should write margins in EMUs from points", () => {
        const tree = new Formatter().format(createShapeTextProperties({ margins: { top: 3.6, right: 0, bottom: 1, left: 7.2 } }));
        expect(tree).to.deep.equal({ "wps:bodyPr": { _attr: { lIns: 91440, tIns: 45720, rIns: 0, bIns: 12700 } } });
    });

    it("should reject a negative margin", () => {
        expect(() => createShapeTextProperties({ margins: { left: -1 } })).to.throw("Invalid left text margin -1");
    });

    it("should write whether text wraps", () => {
        expect(new Formatter().format(createShapeTextProperties({ wrap: true }))).to.deep.equal({
            "wps:bodyPr": { _attr: { wrap: "square" } },
        });
        expect(new Formatter().format(createShapeTextProperties({ wrap: false }))).to.deep.equal({
            "wps:bodyPr": { _attr: { wrap: "none" } },
        });
    });

    it("should resize the shape to fit the text", () => {
        expect(new Formatter().format(createShapeTextProperties({ resizeShapeToFitText: true }))).to.deep.equal({
            "wps:bodyPr": [{ _attr: {} }, { "a:spAutoFit": {} }],
        });
    });

    it("should shrink text that overflows", () => {
        expect(new Formatter().format(createShapeTextProperties({ shrinkTextOnOverflow: true }))).to.deep.equal({
            "wps:bodyPr": [{ _attr: {} }, { "a:normAutofit": {} }],
        });
    });

    it("should reject resizing the shape and shrinking the text together", () => {
        expect(() => createShapeTextProperties({ resizeShapeToFitText: true, shrinkTextOnOverflow: true })).to.throw(
            "A shape can't both resize to fit its text and shrink its text",
        );
    });

    it("should write the text direction with its OOXML name", () => {
        const direction = (value: Parameters<typeof createShapeTextProperties>[0]): unknown =>
            new Formatter().format(createShapeTextProperties(value))["wps:bodyPr"]._attr.vert;
        expect(direction({ direction: "horizontal" })).to.equal("horz");
        expect(direction({ direction: "topToBottom" })).to.equal("vert");
        expect(direction({ direction: "bottomToTop" })).to.equal("vert270");
        expect(direction({ direction: "stacked" })).to.equal("wordArtVert");
        expect(direction({ direction: "eastAsianVertical" })).to.equal("eaVert");
    });

    it("should write text columns, with their spacing in EMUs from points", () => {
        expect(new Formatter().format(createShapeTextProperties({ columns: { count: 2, spacing: 18 } }))).to.deep.equal({
            "wps:bodyPr": { _attr: { numCol: 2, spcCol: 228600 } },
        });
        expect(new Formatter().format(createShapeTextProperties({ columns: { count: 16 } }))).to.deep.equal({
            "wps:bodyPr": { _attr: { numCol: 16 } },
        });
    });

    it("should reject a column count that isn't a whole number from 1 to 16", () => {
        expect(() => createShapeTextProperties({ columns: { count: 0 } })).to.throw("Invalid text column count 0");
        expect(() => createShapeTextProperties({ columns: { count: 17 } })).to.throw("Invalid text column count 17");
        expect(() => createShapeTextProperties({ columns: { count: 1.5 } })).to.throw("Invalid text column count 1.5");
    });

    it("should write a warp as WordArt, before the autofit", () => {
        expect(new Formatter().format(createShapeTextProperties({ warp: "archUp", shrinkTextOnOverflow: true }))).to.deep.equal({
            "wps:bodyPr": [
                { _attr: { fromWordArt: true } },
                { "a:prstTxWarp": [{ _attr: { prst: "textArchUp" } }, { "a:avLst": {} }] },
                { "a:normAutofit": {} },
            ],
        });
    });

    it("should write the OOXML names of the numbered waves", () => {
        const warp = (value: Parameters<typeof createShapeTextProperties>[0]): unknown =>
            new Formatter().format(createShapeTextProperties(value))["wps:bodyPr"][1]["a:prstTxWarp"][0]._attr.prst;
        expect(warp({ warp: "wave" })).to.equal("textWave1");
        expect(warp({ warp: "waveInverted" })).to.equal("textWave2");
        expect(warp({ warp: "doubleWave" })).to.equal("textDoubleWave1");
        expect(warp({ warp: "doubleWaveInverted" })).to.equal("textWave4");
        expect(warp({ warp: "square" })).to.equal("textPlain");
    });
});
