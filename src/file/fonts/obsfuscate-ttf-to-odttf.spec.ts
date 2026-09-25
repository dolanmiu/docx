import { describe, expect, it } from "vitest";

import { obfuscate } from "./obfuscate-ttf-to-odttf";

describe("obfuscate", () => {
    it("should work", () => {
        const buffer = obfuscate(Buffer.from(""), "00000000-0000-0000-0000-000000000000");
        expect(buffer).toBeDefined();
    });

    it("should XOR the first 32 bytes of the buffer with the reversed GUID bytes", () => {
        const input = new Uint8Array(64).fill(0xff);
        const buffer = obfuscate(input, "00000000-0000-0000-0000-000000000000");
        expect(buffer).toBeDefined();
        expect(buffer.length).toBe(64);
        // With all-zero GUID bytes, XOR with 0xFF should produce 0xFF
        expect(buffer[0]).toBe(0xff);
    });

    it("should obfuscate the same way with a lower-case key as with the upper-case key written in the font table", () => {
        const input = new Uint8Array(64).map((_, i) => i);
        expect(obfuscate(input, "8fe2cf26-5e68-f0dc-37a8-b5d5c909da91")).toEqual(obfuscate(input, "8FE2CF26-5E68-F0DC-37A8-B5D5C909DA91"));
    });

    it("should throw error if uuid is not correct", () => {
        expect(() => obfuscate(Buffer.from(""), "bad-uuid")).toThrowError();
    });
});
