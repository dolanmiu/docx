import { describe, expect, it } from "vitest";

import { obfuscate } from "./obfuscate-ttf-to-odttf";

describe("obfuscate", () => {
    it("should work", () => {
        const buffer = obfuscate(Buffer.from(""), "00000000-0000-0000-0000-000000000000");
        expect(buffer).toBeDefined();
    });

    it("should throw error if uuid is not correct", () => {
        expect(() => obfuscate(Buffer.from(""), "bad-uuid")).toThrowError();
    });
});
