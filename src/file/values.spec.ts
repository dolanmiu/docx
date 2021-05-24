import { expect } from "chai";
import {
    hexColorValue,
    hpsMeasureValue,
    positiveUniversalMeasureValue,
    signedTwipsMeasureValue,
    twipsMeasureValue,
    universalMeasureValue,
    unsignedDecimalNumber,
} from "./values";

describe("values", () => {
    describe("universalMeasureValue", () => {
        it("should allow valid values", () => {
            // "-?[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"
            expect(universalMeasureValue("-9mm")).to.eq("-9mm");
            expect(universalMeasureValue("-0.5in")).to.eq("-0.5in");
            expect(universalMeasureValue("20.pt")).to.eq("20pt");
            expect(universalMeasureValue("5.22pc")).to.eq("5.22pc");
            expect(universalMeasureValue("100 pi")).to.eq("100pi");
        });
        it("should throw on invalid values", () => {
            expect(() => universalMeasureValue("100pp")).to.throw();
            expect(() => universalMeasureValue("foo")).to.throw();
            expect(() => universalMeasureValue("--in")).to.throw();
            expect(() => universalMeasureValue("NaNpc")).to.throw();
            expect(() => universalMeasureValue("50")).to.throw();
        });
    });

    describe("positiveUniversalMeasureValue", () => {
        it("should allow valid values", () => {
            // "[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"
            expect(positiveUniversalMeasureValue("9mm")).to.eq("9mm");
            expect(positiveUniversalMeasureValue("0.5in")).to.eq("0.5in");
            expect(positiveUniversalMeasureValue("20.pt")).to.eq("20pt");
            expect(positiveUniversalMeasureValue("5.22pc")).to.eq("5.22pc");
            expect(positiveUniversalMeasureValue("100 pi")).to.eq("100pi");
        });
        it("should throw on invalid values", () => {
            expect(() => positiveUniversalMeasureValue("-9mm")).to.throw();
            expect(() => positiveUniversalMeasureValue("-0.5in")).to.throw();
            expect(() => positiveUniversalMeasureValue("100pp")).to.throw();
            expect(() => positiveUniversalMeasureValue("foo")).to.throw();
            expect(() => positiveUniversalMeasureValue("--in")).to.throw();
            expect(() => positiveUniversalMeasureValue("NaNpc")).to.throw();
            expect(() => positiveUniversalMeasureValue("50")).to.throw();
        });
    });

    describe("hexColorValue", () => {
        it("should allow valid values", () => {
            expect(hexColorValue("auto")).to.eq("auto");
            expect(hexColorValue("FF0000")).to.eq("FF0000");
            expect(hexColorValue("aabbcc")).to.eq("aabbcc");
            expect(hexColorValue("#BEEFEE")).to.eq("BEEFEE");
            expect(hexColorValue("abcdef")).to.eq("abcdef");
        });
        it("should throw on invalid values", () => {
            expect(() => hexColorValue("foo")).to.throw();
            expect(() => hexColorValue("fff")).to.throw();
            expect(() => hexColorValue("a")).to.throw();
            expect(() => hexColorValue("abcde")).to.throw();
            expect(() => hexColorValue("---")).to.throw();
            expect(() => hexColorValue("brown")).to.throw();
        });
    });

    describe("unsignedDecimalNumber", () => {
        it("should allow valid values", () => {
            expect(unsignedDecimalNumber(1243)).to.eq(1243);
            expect(unsignedDecimalNumber(12.43)).to.eq(12);
            expect(unsignedDecimalNumber(1e10)).to.eq(1e10);
        });
        it("should throw on invalid values", () => {
            expect(() => unsignedDecimalNumber(NaN)).to.throw();
            expect(() => unsignedDecimalNumber(-10)).to.throw();
        });
    });

    describe("signedTwipsMeasureValue", () => {
        it("should allow valid values", () => {
            expect(signedTwipsMeasureValue(1243)).to.eq(1243);
            expect(signedTwipsMeasureValue("-5mm")).to.eq("-5mm");
            expect(signedTwipsMeasureValue("10.in")).to.eq("10in");
        });
        it("should throw on invalid values", () => {
            expect(() => signedTwipsMeasureValue(NaN)).to.throw();
            expect(() => signedTwipsMeasureValue("foo")).to.throw();
        });
    });

    describe("twipsMeasureValue", () => {
        it("should allow valid values", () => {
            expect(twipsMeasureValue(1243)).to.eq(1243);
            expect(twipsMeasureValue("5mm")).to.eq("5mm");
            expect(twipsMeasureValue("10.in")).to.eq("10in");
        });
        it("should throw on invalid values", () => {
            expect(() => twipsMeasureValue(-12)).to.throw();
            expect(() => twipsMeasureValue(NaN)).to.throw();
            expect(() => twipsMeasureValue("foo")).to.throw();
            expect(() => twipsMeasureValue("-5mm")).to.throw();
        });
    });

    describe("hpsMeasureValue", () => {
        it("should allow valid values", () => {
            expect(hpsMeasureValue(1243)).to.eq(1243);
            expect(hpsMeasureValue("5mm")).to.eq("5mm");
        });
        it("should throw on invalid values", () => {
            expect(() => hpsMeasureValue(NaN)).to.throw();
            expect(() => hpsMeasureValue("-5mm")).to.throw();
        });
    });
});
