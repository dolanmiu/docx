import { expect } from "chai";

import { convertInchesToTwip, convertMillimetersToTwip, uniqueId, uniqueNumericId } from "./convenience-functions";

describe("Utility", () => {
    describe("#convertMillimetersToTwip", () => {
        it("should call the underlying header's addChildElement for Paragraph", () => {
            expect(convertMillimetersToTwip(1000)).to.equal(56692);
        });
    });

    describe("#convertInchesToTwip", () => {
        it("should call the underlying header's addChildElement", () => {
            expect(convertInchesToTwip(1)).to.equal(1440);
            expect(convertInchesToTwip(0.5)).to.equal(720);
            expect(convertInchesToTwip(0.25)).to.equal(360);
        });
    });

    describe("#uniqueNumericId", () => {
        it("should generate a unique incrementing ID", () => {
            // tslint:disable-next-line: no-unused-expression
            expect(uniqueNumericId()).to.not.be.undefined;
        });
    });

    describe("#uniqueId", () => {
        it("should generate a unique pseudorandom ID", () => {
            // tslint:disable-next-line: no-unused-expression
            expect(uniqueId()).to.not.be.empty;
        });
    });
});
