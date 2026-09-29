import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createExtent } from "./extent";

describe("createExtent", () => {
    it("should write the width and height in EMUs", () => {
        const tree = new Formatter().format(createExtent({ x: 5029200, y: 2828925 }));

        expect(tree).to.deep.equal({ "wp:extent": { _attr: { cx: 5029200, cy: 2828925 } } });
    });

    it("should allow the largest size Word opens", () => {
        const tree = new Formatter().format(createExtent({ x: 2147483647, y: 2147483647 }));

        expect(tree).to.deep.equal({ "wp:extent": { _attr: { cx: 2147483647, cy: 2147483647 } } });
    });

    it("should throw for a width Word won't open", () => {
        expect(() => createExtent({ x: 2147483648, y: 914400 })).toThrow(
            "Invalid drawing width 2147483648 EMUs (225458 pixels). Word won't open a drawing with a width over 2147483647 EMUs (225457 pixels). Sizes such as an ImageRun's transformation are in pixels, not EMUs",
        );
    });

    it("should throw for a height Word won't open", () => {
        expect(() => createExtent({ x: 914400, y: 2147483648 })).toThrow(
            "Invalid drawing height 2147483648 EMUs (225458 pixels). Word won't open a drawing with a height over 2147483647 EMUs (225457 pixels). Sizes such as an ImageRun's transformation are in pixels, not EMUs",
        );
    });
});
