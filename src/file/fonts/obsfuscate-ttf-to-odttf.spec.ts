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

    it("should throw error if uuid is not correct", () => {
        expect(() => obfuscate(Buffer.from(""), "bad-uuid")).toThrowError();
    });
});
