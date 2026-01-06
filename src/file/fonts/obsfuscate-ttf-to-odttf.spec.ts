import { describe, expect, it } from "vitest";

import { obfuscate } from "./obfuscate-ttf-to-odttf";

describe("obfuscate", () => {
    it("should work", () => {
        const buffer = obfuscate(Buffer.from(""), "00000000-0000-0000-0000-000000000000");
        expect(buffer).toBeDefined();
    });

    it("should obfuscate first 32 bytes of buffer", () => {
        // Create a buffer with 64 bytes (enough to test obfuscation)
        const input = Uint8Array.from({ length: 64 }, (_, i) => i);

        const fontKey = "12345678-90ab-cdef-1234-567890abcdef";
        const result = obfuscate(input, fontKey);

        // Should return a buffer of the same length
        expect(result.length).toBe(64);

        // First 32 bytes should be obfuscated (different from original)
        let hasObfuscated = false;
        for (let i = 0; i < 32; i++) {
            if (result[i] !== input[i]) {
                hasObfuscated = true;
                break;
            }
        }
        expect(hasObfuscated).toBe(true);

        // Bytes after 32 should be unchanged
        for (let i = 32; i < 64; i++) {
            expect(result[i]).toBe(input[i]);
        }
    });

    it("should throw error if uuid is not correct", () => {
        expect(() => obfuscate(Buffer.from(""), "bad-uuid")).toThrowError();
    });
});
