import { describe, expect, it } from "vitest";

import { percentageValue, pointsToEmus, positiveFixedAngle } from "./shape-units";

describe("percentageValue", () => {
    it("should return values from 0 to 100", () => {
        expect(percentageValue(0, "value")).to.equal(0);
        expect(percentageValue(100, "value")).to.equal(100);
    });

    it("should reject NaN", () => {
        expect(() => percentageValue(Number.NaN, "value")).to.throw("Invalid value NaN");
    });
});

describe("pointsToEmus", () => {
    it("should convert points to EMUs, rounded to a whole EMU", () => {
        expect(pointsToEmus(0, "size")).to.equal(0);
        expect(pointsToEmus(1.5, "size")).to.equal(19050);
        expect(pointsToEmus(1584, "size")).to.equal(20116800);
    });

    it("should name the option when the length is out of range", () => {
        expect(() => pointsToEmus(-1, "glow size")).to.throw("Invalid glow size -1. Expected a number of points from 0 to 1584");
        expect(() => pointsToEmus(1585, "glow size")).to.throw("Invalid glow size 1585");
        expect(() => pointsToEmus(Number.NaN, "glow size")).to.throw("Invalid glow size NaN");
    });
});

describe("positiveFixedAngle", () => {
    it("should convert degrees to 60000ths of a degree", () => {
        expect(positiveFixedAngle(45)).to.equal(2700000);
    });

    it("should bring angles into 0 up to 360 degrees", () => {
        expect(positiveFixedAngle(-90)).to.equal(16200000);
        expect(positiveFixedAngle(360)).to.equal(0);
        expect(positiveFixedAngle(450)).to.equal(5400000);
        expect(positiveFixedAngle(359.9999999)).to.equal(0);
    });
});
