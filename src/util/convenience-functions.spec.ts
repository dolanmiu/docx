import { expect } from "chai";

import { convertInchesToTwip, convertMillimetersToTwip, uniqueId, uniqueNumericId } from "./convenience-functions";

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

    describe("#uniqueNumericId", () => {
        it("should generate a unique incrementing ID", () => {
            expect(uniqueNumericId()).to.not.be.undefined;
        });
    });

    describe("#uniqueId", () => {
        it("should generate a unique pseudorandom ID", () => {
            expect(uniqueId()).to.not.be.empty;
        });
    });
});
