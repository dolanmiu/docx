import { describe, expect, it } from "vitest";

import { encodeUtf8 } from "./convenience-functions";
import { sha1, sha256 } from "./sha";

const hex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

// The examples of FIPS 180-4, from NIST's Cryptographic Standards and Guidelines, and the empty message
const ABC = encodeUtf8("abc");
const TWO_BLOCKS = encodeUtf8("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
const MILLION_AS = new Uint8Array(1000000).fill(0x61);

describe("sha", () => {
    describe("#sha1", () => {
        it("hashes FIPS 180-4's examples, which fit in one block, need a second for the padding, and are long", () => {
            expect(hex(sha1(new Uint8Array()))).to.equal("da39a3ee5e6b4b0d3255bfef95601890afd80709");
            expect(hex(sha1(ABC))).to.equal("a9993e364706816aba3e25717850c26c9cd0d89d");
            expect(hex(sha1(TWO_BLOCKS))).to.equal("84983e441c3bd26ebaae4aa1f95129e5e54670f1");
            expect(hex(sha1(MILLION_AS))).to.equal("34aa973cd4c4daa4f61eeb2bdbad27316534016f");
        });

        it("pads messages whose length leaves too little room for the length in their last block", () => {
            // 55 bytes is the most that fits with the padding in one block, and 56 the least that needs another
            expect(hex(sha1(new Uint8Array(55).fill(0x61)))).to.equal("c1c8bbdc22796e28c0e15163d20899b65621d65a");
            expect(hex(sha1(new Uint8Array(56).fill(0x61)))).to.equal("c2db330f6083854c99d4b5bfb6e8f29f201be699");
            expect(hex(sha1(new Uint8Array(64).fill(0x61)))).to.equal("0098ba824b5c16427bd7a1122a5a442a25ec644d");
        });
    });

    describe("#sha256", () => {
        it("hashes FIPS 180-4's examples, which fit in one block, need a second for the padding, and are long", () => {
            expect(hex(sha256(new Uint8Array()))).to.equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
            expect(hex(sha256(ABC))).to.equal("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
            expect(hex(sha256(TWO_BLOCKS))).to.equal("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
            expect(hex(sha256(MILLION_AS))).to.equal("cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
        });

        it("pads messages whose length leaves too little room for the length in their last block", () => {
            expect(hex(sha256(new Uint8Array(55).fill(0x61)))).to.equal("9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318");
            expect(hex(sha256(new Uint8Array(56).fill(0x61)))).to.equal("b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a");
            expect(hex(sha256(new Uint8Array(64).fill(0x61)))).to.equal("ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb");
        });
    });
});
