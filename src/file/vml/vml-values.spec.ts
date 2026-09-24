import { describe, expect, it } from "vitest";

import { vmlTrueFalse } from "./vml-values";

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
