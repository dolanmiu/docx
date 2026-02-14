import { describe, expect, it } from "vitest";

import {
    abstractNumUniqueNumericIdGen,
    bookmarkUniqueNumericIdGen,
    concreteNumUniqueNumericIdGen,
    convertInchesToTwip,
    convertMillimetersToTwip,
    docPropertiesUniqueNumericIdGen,
    encodeUtf8,
    hashedId,
    uniqueId,
    uniqueNumericIdCreator,
    uniqueUuid,
} from "./convenience-functions";

describe("Utility", () => {
    describe("#convertMillimetersToTwip", () => {
        it("should convert millimeters to TWIP", () => {
            expect(convertMillimetersToTwip(1000)).to.equal(56692);
        });
    });

    describe("#convertInchesToTwip", () => {
        it("should convert inches to TWIP", () => {
            expect(convertInchesToTwip(1)).to.equal(1440);
            expect(convertInchesToTwip(0.5)).to.equal(720);
            expect(convertInchesToTwip(0.25)).to.equal(360);
        });
    });

    describe("#uniqueNumericIdCreator", () => {
        it("should generate a unique incrementing ID", () => {
            const uniqueNumericId = uniqueNumericIdCreator();
            expect(uniqueNumericId()).to.not.be.undefined;
        });
    });

    describe("#abstractNumUniqueNumericIdGen", () => {
        it("should generate a unique incrementing ID", () => {
            const uniqueNumericId = abstractNumUniqueNumericIdGen();
            expect(uniqueNumericId()).to.equal(1);
            expect(uniqueNumericId()).to.equal(2);
        });
    });

    describe("#concreteNumUniqueNumericIdGen", () => {
        it("should generate a unique incrementing ID", () => {
            const uniqueNumericId = concreteNumUniqueNumericIdGen();
            expect(uniqueNumericId()).to.equal(2);
            expect(uniqueNumericId()).to.equal(3);
        });
    });

    describe("#docPropertiesUniqueNumericIdGen", () => {
        it("should generate a unique incrementing ID", () => {
            const uniqueNumericId = docPropertiesUniqueNumericIdGen();
            expect(uniqueNumericId()).to.equal(1);
            expect(uniqueNumericId()).to.equal(2);
        });
    });

    describe("#bookmarkUniqueNumericIdGen", () => {
        it("should generate a unique incrementing ID", () => {
            const uniqueNumericId = bookmarkUniqueNumericIdGen();
            expect(uniqueNumericId()).to.equal(1);
            expect(uniqueNumericId()).to.equal(2);
        });
    });

    describe("#uniqueId", () => {
        it("should generate a unique pseudorandom ID", () => {
            expect(uniqueId()).to.not.be.empty;
        });
    });

    describe("#hashedId", () => {
        it("should generate a hex string", () => {
            expect(hashedId("")).to.equal("da39a3ee5e6b4b0d3255bfef95601890afd80709");
        });

        it("should work with string, Uint8Array, Buffer and ArrayBuffer", () => {
            const stringInput = "DATA";
            const uint8ArrayInput = new Uint8Array(new TextEncoder().encode(stringInput));
            const bufferInput = Buffer.from(uint8ArrayInput);
            const arrayBufferInput = uint8ArrayInput.buffer;

            const expectedHash = "580393f5a94fb469585f5dd2a6859a4aab899f37";

            expect(hashedId(stringInput)).to.equal(expectedHash);
            expect(hashedId(uint8ArrayInput)).to.equal(expectedHash);
            expect(hashedId(bufferInput)).to.equal(expectedHash);
            expect(hashedId(arrayBufferInput)).to.equal(expectedHash);
        });
    });

    describe("#uniqueUuid", () => {
        it("should generate a unique pseudorandom ID", () => {
            expect(uniqueUuid()).to.not.be.empty;
        });
    });

    describe("#encodeUtf8", () => {
        it("should encode ASCII strings correctly", () => {
            const result = encodeUtf8("hello");
            expect(result).to.have.lengthOf(5);
            expect(Array.from(result)).to.deep.equal([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        });

        it("should encode multi-byte characters correctly", () => {
            // "é" is U+00E9, encoded as C3 A9 in UTF-8
            const result = encodeUtf8("é");
            expect(Array.from(result)).to.deep.equal([0xc3, 0xa9]);
        });

        it("should encode emoji (surrogate pairs) correctly as 4-byte UTF-8", () => {
            // U+1F600 (😀) should be encoded as F0 9F 98 80, NOT as CESU-8 (ED xx xx ED xx xx)
            const emoji = String.fromCodePoint(0x1f600);
            const result = encodeUtf8(emoji);

            // Verify it's 4 bytes (proper UTF-8), not 6 bytes (CESU-8)
            expect(result).to.have.lengthOf(4);
            expect(Array.from(result)).to.deep.equal([0xf0, 0x9f, 0x98, 0x80]);
        });

        it("should encode Material Design Icons (high code points) correctly", () => {
            // U+F0219 is a Material Design Icon, encoded as F3 B0 88 99 in UTF-8
            const icon = String.fromCodePoint(0xf0219);
            const result = encodeUtf8(icon);

            // Verify it's 4 bytes (proper UTF-8), not 6 bytes (CESU-8)
            expect(result).to.have.lengthOf(4);
            expect(Array.from(result)).to.deep.equal([0xf3, 0xb0, 0x88, 0x99]);
        });

        it("should encode mixed content with astral characters correctly", () => {
            const mixed = "Hello 😀 World";
            const result = encodeUtf8(mixed);

            // "Hello " (6 bytes) + 😀 (4 bytes) + " World" (6 bytes) = 16 bytes
            expect(result).to.have.lengthOf(16);
        });
    });
});
