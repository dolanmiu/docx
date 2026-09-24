import { describe, expect, it } from "vitest";

import { getTextRectangle } from "./text-rectangle";

describe("getTextRectangle", () => {
    it("should fill a rectangle", () => {
        expect(getTextRectangle("rectangle", 100, 50)).to.deep.equal({ left: 0, top: 0, right: 100, bottom: 50 });
    });

    it("should fill a custom shape", () => {
        expect(getTextRectangle("custom", 100, 50)).to.deep.equal({ left: 0, top: 0, right: 100, bottom: 50 });
    });

    it("should be the middle half of a diamond", () => {
        expect(getTextRectangle("diamond", 100, 40)).to.deep.equal({ left: 25, top: 10, right: 75, bottom: 30 });
    });

    it("should be the box inside an ellipse", () => {
        const { left, right } = getTextRectangle("ellipse", 1000, 1000);
        expect(right - left).to.be.closeTo(1000 * Math.SQRT1_2, 1);
    });

    it("should follow the shape's adjustments", () => {
        const rounded = getTextRectangle("roundedRectangle", 100, 100);
        const rounder = getTextRectangle("roundedRectangle", 100, 100, { adj: 50000 });
        expect(rounder.left).to.be.greaterThan(rounded.left);
    });
});
