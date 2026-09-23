import { describe, expect, it } from "vitest";

import { vmlColorValue, vmlFixedPoint, vmlTrueFalse } from "./vml-values";

describe("vmlTrueFalse", () => {
    it("should convert true to t", () => {
        expect(vmlTrueFalse(true)).toBe("t");
    });

    it("should convert false to f", () => {
        expect(vmlTrueFalse(false)).toBe("f");
    });

    it("should pass undefined through so optional attributes are omitted", () => {
        expect(vmlTrueFalse(undefined)).toBeUndefined();
    });
});

describe("vmlColorValue", () => {
    it("should prefix a bare hex colour with #", () => {
        expect(vmlColorValue("C0C0C0")).toBe("#C0C0C0");
    });

    it("should keep a hex colour that already has a # prefix", () => {
        expect(vmlColorValue("#ff0000")).toBe("#ff0000");
    });

    it("should pass named colours through unchanged", () => {
        expect(vmlColorValue("silver")).toBe("silver");
    });
});

describe("vmlFixedPoint", () => {
    it("should scale by 65536 and append f", () => {
        expect(vmlFixedPoint(0.5)).toBe("32768f");
    });

    it("should round to the nearest integer", () => {
        expect(vmlFixedPoint(0.3)).toBe("19661f");
        expect(vmlFixedPoint(0.35)).toBe("22938f");
    });
});
