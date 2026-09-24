import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { TextWrappingSide } from "./text-wrapping";
import { createWrapThrough, createWrapTight } from "./wrap-tight";

const boxPolygon = {
    "wp:wrapPolygon": [
        { _attr: { edited: false } },
        { "wp:start": { _attr: { x: 0, y: 0 } } },
        { "wp:lineTo": { _attr: { x: 0, y: 21600 } } },
        { "wp:lineTo": { _attr: { x: 21600, y: 21600 } } },
        { "wp:lineTo": { _attr: { x: 21600, y: 0 } } },
        { "wp:lineTo": { _attr: { x: 0, y: 0 } } },
    ],
};

describe("createWrapTight", () => {
    it("should wrap both sides around a polygon of the drawing's box, which Word replaces with its outline", () => {
        expect(new Formatter().format(createWrapTight())).to.deep.equal({
            "wp:wrapTight": [{ _attr: { wrapText: "bothSides" } }, boxPolygon],
        });
    });

    it("should write the side and the left and right distances", () => {
        const tree = new Formatter().format(
            createWrapTight({ side: TextWrappingSide.LARGEST }, { left: 114300, right: 114300, top: 10, bottom: 10 }),
        );
        expect(tree).to.deep.equal({
            "wp:wrapTight": [{ _attr: { wrapText: "largest", distL: 114300, distR: 114300 } }, boxPolygon],
        });
    });
});

describe("createWrapThrough", () => {
    it("should write a wrapThrough element with a wrap polygon", () => {
        expect(new Formatter().format(createWrapThrough({ side: TextWrappingSide.LEFT }, { left: 5 }))).to.deep.equal({
            "wp:wrapThrough": [{ _attr: { wrapText: "left", distL: 5 } }, boxPolygon],
        });
    });
});
