import { expect } from "chai";
import {
    dateTimeValue,
    hexColorValue,
    hpsMeasureValue,
    longHexNumber,
    measurementOrPercentValue,
    percentageValue,
    positiveUniversalMeasureValue,
    shortHexNumber,
    signedHpsMeasureValue,
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

    describe("longHexNumber", () => {
        it("should allow valid values", () => {
            expect(longHexNumber("112233FF")).to.eq("112233FF");
        });
        it("should throw on invalid values", () => {
            expect(() => longHexNumber("112233GG")).to.throw();
            expect(() => longHexNumber("112233F")).to.throw();
            expect(() => longHexNumber("112233FFF")).to.throw();
        });
    });

    describe("shortHexNumber", () => {
        it("should allow valid values", () => {
            expect(shortHexNumber("1122")).to.eq("1122");
            expect(shortHexNumber("FFFF")).to.eq("FFFF");
        });
        it("should throw on invalid values", () => {
            expect(() => shortHexNumber("11")).to.throw();
            expect(() => shortHexNumber("112233")).to.throw();
            /* cspell:disable-next-line */
            expect(() => shortHexNumber("FFFG")).to.throw();
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

    describe("signedHpsMeasureValue", () => {
        it("should allow valid values", () => {
            expect(signedHpsMeasureValue(1243)).to.eq(1243);
            expect(signedHpsMeasureValue(-1243)).to.eq(-1243);
            expect(signedHpsMeasureValue("5mm")).to.eq("5mm");
            expect(signedHpsMeasureValue("-5mm")).to.eq("-5mm");
        });
        it("should throw on invalid values", () => {
            expect(() => hpsMeasureValue(NaN)).to.throw();
            expect(() => hpsMeasureValue("5FF")).to.throw();
        });
    });

    describe("percentageValue", () => {
        it("should allow valid values", () => {
            expect(percentageValue("0%")).to.eq("0%");
            expect(percentageValue("-20%")).to.eq("-20%");
            expect(percentageValue("100%")).to.eq("100%");
            expect(percentageValue("1000%")).to.eq("1000%");
        });
        it("should throw on invalid values", () => {
            expect(() => percentageValue("0%%")).to.throw();
            expect(() => percentageValue("20")).to.throw();
            expect(() => percentageValue("FF%")).to.throw();
        });
    });

    describe("measurementOrPercentValue", () => {
        it("should allow valid values", () => {
            expect(measurementOrPercentValue(1243)).to.eq(1243);
            expect(measurementOrPercentValue(-1243)).to.eq(-1243);
            expect(measurementOrPercentValue("10%")).to.eq("10%");
            expect(measurementOrPercentValue("5mm")).to.eq("5mm");
        });
        it("should throw on invalid values", () => {
            expect(() => measurementOrPercentValue(NaN)).to.throw();
            expect(() => measurementOrPercentValue("10%%")).to.throw();
            expect(() => measurementOrPercentValue("10F")).to.throw();
        });
    });

    describe("dateTimeValue", () => {
        it("should allow valid values", () => {
            expect(dateTimeValue(new Date())).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d+)?Z/);
        });
    });
});
