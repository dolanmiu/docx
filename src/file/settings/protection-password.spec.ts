// cspell:words unstub
import { afterEach, describe, expect, it, vi } from "vitest";

import { PROTECTION_PASSWORD_SPIN_COUNT, hashProtectionPassword, legacyPasswordKey, randomSalt } from "./protection-password";

const fromBase64 = (text: string): readonly number[] => [...atob(text)].map((character) => character.charCodeAt(0));
const toBase64 = (bytes: readonly number[]): string => btoa(String.fromCharCode(...bytes));

describe("legacyPasswordKey", () => {
    it("should give the standard's example key, in reversed byte order", () => {
        // ECMA-376 Part 4 2.15.1.28: "Example" gives 0x64CEED7E, written 7EEDCE64
        expect(legacyPasswordKey("Example")).to.equal("7EEDCE64");
    });

    it("should only read the first 15 characters", () => {
        expect(legacyPasswordKey("abcdefghijklmnopqrstuvwxyz")).to.equal(legacyPasswordKey("abcdefghijklmno"));
        expect(legacyPasswordKey("abcdefghijklmn")).not.to.equal(legacyPasswordKey("abcdefghijklmno"));
    });

    it("should read a character's high byte when its low byte is 0", () => {
        // U+4E00 has the low byte 0x00 and the high byte 0x4E, which is "N"
        expect(legacyPasswordKey("一")).to.equal(legacyPasswordKey("N"));
    });
});

describe("hashProtectionPassword", () => {
    // Word for Mac 16 turned off the protection of a document with each salt and hash below when given the password,
    // and refused a wrong one. Word writes SHA-512 itself, so the hashes are docx's, checked in Word
    it("should hash a password so that Word accepts it", () => {
        const hash = hashProtectionPassword("Example", fromBase64("E7Z4pK9vZJtgEIUrL2UL3w=="), PROTECTION_PASSWORD_SPIN_COUNT);

        expect(toBase64(hash)).to.equal("MZHm/PwSL2XqNHWnrQFREO8SwF9ZeosDyD3uS3/jbiU=");
    });

    it("should hash a long password with characters outside ASCII so that Word accepts it", () => {
        const hash = hashProtectionPassword(
            /* cspell:disable-next-line */
            "Pässwort密码abcdefghijklmnop",
            fromBase64("v61srLQZvvOFtTTJHbPd+Q=="),
            PROTECTION_PASSWORD_SPIN_COUNT,
        );

        expect(toBase64(hash)).to.equal("3vCPYtiBiMryITfhIFJ0JYH+jZYaqN13ShVrlgN3vwQ=");
    });

    it("should give a 32-byte SHA-256 hash that depends on the salt and the spin count", () => {
        const salt = Array.from({ length: 16 }, (_, index) => index);
        const hash = hashProtectionPassword("secret", salt, 10);

        expect(hash).to.have.length(32);
        expect(hashProtectionPassword("secret", salt, 10)).to.deep.equal(hash);
        expect(hashProtectionPassword("secret", salt, 11)).not.to.deep.equal(hash);
        expect(hashProtectionPassword("secret", [...salt].reverse(), 10)).not.to.deep.equal(hash);
    });
});

describe("randomSalt", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should give bytes from the platform's secure random numbers", () => {
        const getRandomValues = vi.spyOn(globalThis.crypto, "getRandomValues");

        const salt = randomSalt(16);

        expect(salt).to.have.length(16);
        expect(getRandomValues).toHaveBeenCalledOnce();
        getRandomValues.mockRestore();
    });

    it("should give random bytes without the platform's secure random numbers, as on Node.js before 19", () => {
        vi.stubGlobal("crypto", undefined);

        const salt = randomSalt(16);

        expect(salt).to.have.length(16);
        expect(salt.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)).to.equal(true);
        expect(randomSalt(16)).not.to.deep.equal(salt);
    });
});
