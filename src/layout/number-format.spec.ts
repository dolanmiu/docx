// cspell:ignore mcmxciv mmxxiv
import { describe, expect, it } from "vitest";

import { formatNumber } from "./number-format";

describe("formatNumber", () => {
    it("should write numbers in decimal by default, and with a zero before those under 10 in decimalZero", () => {
        expect(formatNumber(12)).to.equal("12");
        expect(formatNumber(7, "decimalZero")).to.equal("07");
        expect(formatNumber(12, "decimalZero")).to.equal("12");
        expect(formatNumber(-1, "decimalZero")).to.equal("-1");
        expect(formatNumber(3, "numberInDash")).to.equal("- 3 -");
    });

    it("should write roman numerals", () => {
        expect([1, 4, 9, 14, 40, 90, 400, 1994].map((value) => formatNumber(value, "lowerRoman"))).to.deep.equal([
            "i",
            "iv",
            "ix",
            "xiv",
            "xl",
            "xc",
            "cd",
            "mcmxciv",
        ]);
        expect(formatNumber(2024, "upperRoman")).to.equal("MMXXIV");
    });

    it("should write letters as Word does, repeating the letter after z", () => {
        expect([1, 26, 27, 28, 53].map((value) => formatNumber(value, "lowerLetter"))).to.deep.equal(["a", "z", "aa", "bb", "aaa"]);
        expect(formatNumber(3, "upperLetter")).to.equal("C");
    });

    it("should write ordinals", () => {
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map((value) => formatNumber(value, "ordinal"))).to.deep.equal([
            "1st",
            "2nd",
            "3rd",
            "4th",
            "11th",
            "12th",
            "13th",
            "21st",
            "22nd",
            "101st",
            "111th",
        ]);
    });

    it("should write numbers of zero or less in decimal in the letter, roman and ordinal formats", () => {
        expect(
            ["lowerRoman", "upperRoman", "lowerLetter", "upperLetter", "ordinal"].map((format) => formatNumber(0, format)),
        ).to.deep.equal(["0", "0", "0", "0", "0"]);
    });

    it("should write nothing for none, and leave out the formats it doesn't write", () => {
        expect(formatNumber(3, "none")).to.equal("");
        expect(formatNumber(3, "chineseCounting")).to.equal(undefined);
    });
});
