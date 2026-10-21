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
    // Each salt and hash below is what Word for Mac 16 wrote when it protected a document with the password
    it("should hash a password as Word does", () => {
        const hash = hashProtectionPassword("Example", fromBase64("RtEaIE+V6X78XzRte+874Q=="), PROTECTION_PASSWORD_SPIN_COUNT);

        expect(toBase64(hash)).to.equal("P9vAWTa+XzjQvDiLfHPwEWuAhuyAi+3UW3ccWu/IzaMVWJtTZhT6PHyIylX4V5uzUNmKqSlmWIQo0N6pbPwWkQ==");
    });

    it("should hash a long password with characters outside ASCII as Word does", () => {
        const hash = hashProtectionPassword(
            /* cspell:disable-next-line */
            "Pässwort密码abcdefghijklmnop",
            /* cspell:disable-next-line */
            fromBase64("JnIzYkQKINNmgebBzeWVvw=="),
            PROTECTION_PASSWORD_SPIN_COUNT,
        );

        expect(toBase64(hash)).to.equal("DIqTQCjCey679aCOk6tO4LkmSFgOukmk6DA3add/Z8Nhw7OGgrlCik+xoS8BBQ/QuyYaG2qunwoHcNpPRcXGIQ==");
    });

    it("should give a 64-byte SHA-512 hash that depends on the salt and the spin count", () => {
        const salt = Array.from({ length: 16 }, (_, index) => index);
        const hash = hashProtectionPassword("secret", salt, 10);

        expect(hash).to.have.length(64);
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
