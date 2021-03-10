import { expect } from "chai";
import { convertInchesToTwip, convertMillimetersToTwip } from "./convenience-functions";

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
});
