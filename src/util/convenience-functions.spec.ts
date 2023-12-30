import { describe, expect, it } from "vitest";

import {
    abstractNumUniqueNumericIdGen,
    bookmarkUniqueNumericIdGen,
    concreteNumUniqueNumericIdGen,
    convertInchesToTwip,
    convertMillimetersToTwip,
    docPropertiesUniqueNumericIdGen,
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

    describe("#uniqueUuid", () => {
        it("should generate a unique pseudorandom ID", () => {
            expect(uniqueUuid()).to.not.be.empty;
        });
    });
});
