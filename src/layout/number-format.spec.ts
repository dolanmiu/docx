// cspell:disable
import { describe, expect, it } from "vitest";

import { formatFieldNumber, formatNumber, formatPageNumber, isFieldNumberFormat, isFieldPicture, writeFieldNumber } from "./number-format";

// What Word wrote, in PDFs it saved of scripts/layout-probes/word-page-number-formats.ts and word-page-number-formats2.ts
describe("formatNumber", () => {
    const each = (format: string, values: readonly number[]): readonly (string | undefined)[] =>
        values.map((value) => formatNumber(value, format));

    it("should write numbers in decimal by default, and as Word writes those with a zero, dashes or a suffix", () => {
        expect(formatNumber(12)).to.equal("12");
        expect(formatNumber(100000)).to.equal("100000");
        expect(each("decimalZero", [0, 7, 12])).to.deep.equal(["00", "07", "12"]);
        expect(each("numberInDash", [0, 3])).to.deep.equal(["- 0 -", "- 3 -"]);
        expect(each("ordinal", [0, 1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111])).to.deep.equal([
            "0th",
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
        expect(each("hex", [0, 10, 1234, 65535, 65536])).to.deep.equal(["0", "A", "4D2", "FFFF", undefined]);
        expect(each("decimalHalfWidth", [1234])).to.deep.equal(["1234"]);
        expect(each("bahtText", [4])).to.deep.equal(["4"]);
        expect(each("dollarText", [4])).to.deep.equal(["4"]);
    });

    it("should write roman numerals, and nothing for 0", () => {
        expect(each("lowerRoman", [0, 1, 4, 9, 14, 40, 90, 400, 1994])).to.deep.equal([
            "",
            "i",
            "iv",
            "ix",
            "xiv",
            "xl",
            "xc",
            "cd",
            "mcmxciv",
        ]);
        expect(each("upperRoman", [2024, 32767, 32768])).to.deep.equal(["MMXXIV", "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDCCLXVII", undefined]);
    });

    it("should repeat the letter of an alphabet after its last, up to 30 times, as Word does", () => {
        expect(each("lowerLetter", [0, 1, 26, 27, 28, 53, 780, 781])).to.deep.equal([
            "",
            "a",
            "z",
            "aa",
            "bb",
            "aaa",
            "z".repeat(30),
            undefined,
        ]);
        expect(each("upperLetter", [3, 1234])).to.deep.equal(["C", undefined]);
        expect(each("russianLower", [0, 1, 29, 30, 870, 871])).to.deep.equal(["", "а", "я", "аа", "я".repeat(30), undefined]);
        expect(each("russianUpper", [4])).to.deep.equal(["Г"]);
        expect(each("arabicAlpha", [1, 4, 28, 29, 783, 784])).to.deep.equal(["أ", "ث", "ي", "أأ", "و".repeat(28), undefined]);
        expect(each("arabicAbjad", [1, 4, 28, 29])).to.deep.equal(["أ", "د", "غ", "أأ"]);
        expect(each("hindiVowels", [1, 37, 38, 911, 912])).to.deep.equal(["क", "ह", "कक", "फ".repeat(25), undefined]);
        expect(each("hindiConsonants", [1, 17, 18, 19, 36])).to.deep.equal(["अ", "अं", "अः", "अअ", "अःअः"]);
        expect(each("thaiLetters", [1, 41, 42, 1230, 1231])).to.deep.equal(["ก", "ฮ", "กก", "ฮ".repeat(30), undefined]);
        expect(each("chicago", [0, 1, 4, 5, 9, 120, 121])).to.deep.equal(["", "*", "§", "**", "***", "§".repeat(30), undefined]);
    });

    it("should write Hebrew numerals and letters", () => {
        expect(each("hebrew1", [0, 1, 11, 15, 16, 99, 100, 101, 500])).to.deep.equal(["", "א", "יא", "טו", "טז", "צט", "ק", "קא", "תק"]);
        expect(each("hebrew1", [783, 784])).to.deep.equal(["תשפג", undefined]);
        expect(each("hebrew2", [1, 22, 23, 44, 45, 99])).to.deep.equal(["א", "ת", "תא", "תת", "תתא", "תתתתכ"]);
    });

    it("should go round the Japanese and Korean syllables", () => {
        expect(each("aiueo", [0, 1, 46, 47, 1234])).to.deep.equal(["0", "ｱ", "ﾝ", "ｱ", "ﾖ"]);
        expect(each("aiueoFullWidth", [4, 1234])).to.deep.equal(["エ", "ヨ"]);
        expect(each("iroha", [1, 25, 43, 48, 49, 1234])).to.deep.equal(["ｲ", "ヰ", "ヱ", "ﾝ", "ｲ", "ｴ"]);
        expect(each("irohaFullWidth", [4, 1234])).to.deep.equal(["ニ", "エ"]);
        expect(each("ganada", [0, 1, 14, 15, 1234])).to.deep.equal(["0", "가", "하", "가", "나"]);
        expect(each("chosung", [4, 1234])).to.deep.equal(["ㄹ", "ㄴ"]);
    });

    it("should write digits of other scripts", () => {
        expect(each("decimalFullWidth", [0, 1234])).to.deep.equal(["０", "１２３４"]);
        expect(each("decimalFullWidth2", [4])).to.deep.equal(["４"]);
        expect(each("hindiNumbers", [0, 1234])).to.deep.equal(["०", "१२३४"]);
        expect(each("thaiNumbers", [0, 1234])).to.deep.equal(["๐", "๑๒๓๔"]);
        expect(each("ideographDigital", [0, 10, 1234])).to.deep.equal(["〇", "一〇", "一二三四"]);
        expect(each("japaneseDigitalTenThousand", [9999, 10000])).to.deep.equal(["九九九九", undefined]);
        expect(each("taiwaneseDigital", [0, 10])).to.deep.equal(["○", "一○"]);
        expect(each("koreanDigital", [0, 1234])).to.deep.equal(["영", "일이삼사"]);
        // Word writes 0 alone as U+F9B2, and in other numbers as U+96F6
        expect(each("koreanDigital2", [0, 10, 1234])).to.deep.equal(["零", "一零", "一二三四"]);
    });

    it("should count in Chinese, Japanese and Korean", () => {
        const values = [0, 10, 11, 20, 100, 101, 110, 1000, 1001, 1100, 1234, 10000, 10001, 12345];
        expect(each("japaneseCounting", values)).to.deep.equal([
            "〇",
            "十",
            "十一",
            "二十",
            "百",
            "百一",
            "百十",
            "千",
            "千一",
            "千百",
            "千二百三十四",
            "一万",
            "一万一",
            "一万二千三百四十五",
        ]);
        expect(each("japaneseLegal", [10, 101, 1234, 10000, 12345])).to.deep.equal([
            "壱拾",
            "壱百壱",
            "壱阡弐百参拾四",
            "壱萬",
            "壱萬弐阡参百四拾伍",
        ]);
        expect(each("chineseCountingThousand", values)).to.deep.equal([
            "〇",
            "十",
            "十一",
            "二十",
            "一百",
            "一百〇一",
            "一百一十",
            "一千",
            "一千〇一",
            "一千一百",
            "一千二百三十四",
            "一万",
            "一万〇一",
            "一万二千三百四十五",
        ]);
        expect(each("taiwaneseCountingThousand", [0, 101, 10001])).to.deep.equal(["零", "一百零一", "一萬零一"]);
        expect(each("ideographLegalTraditional", [0, 10, 101, 1234, 10001])).to.deep.equal([
            "零",
            "壹拾",
            "壹佰零壹",
            "壹仟貳佰參拾肆",
            "壹萬零壹",
        ]);
        expect(each("chineseLegalSimplified", [101, 1234])).to.deep.equal(["壹佰零壹", "壹仟贰佰叁拾肆"]);
        // Counting under 100, and digits from 100
        expect(each("chineseCounting", [0, 10, 21, 99, 100, 1234])).to.deep.equal(["○", "十", "二十一", "九十九", "一○○", "一二三四"]);
        expect(each("taiwaneseCounting", [4, 1234])).to.deep.equal(["四", "一二三四"]);
        expect(each("koreanCounting", [0, 10, 101, 1234, 10000, 12345])).to.deep.equal([
            "영",
            "십",
            "백일",
            "천이백삼십사",
            "만",
            "만이천삼백사십오",
        ]);
        expect(each("koreanLegal", [0, 1, 10, 21, 99, 100, 1234])).to.deep.equal([
            "0",
            "하나",
            "열",
            "스물하나",
            "아흔아홉",
            "백",
            "천이백삼십사",
        ]);
    });

    it("should write numbers in English and Vietnamese words", () => {
        expect(each("cardinalText", [0, 4, 21, 101, 1234, 12345])).to.deep.equal([
            "Zero",
            "Four",
            "Twenty-one",
            "One hundred one",
            "One thousand two hundred thirty-four",
            "Twelve thousand three hundred forty-five",
        ]);
        expect(each("ordinalText", [0, 1, 2, 3, 5, 8, 9, 12, 20, 21, 100, 1001])).to.deep.equal([
            "Zeroth",
            "First",
            "Second",
            "Third",
            "Fifth",
            "Eighth",
            "Ninth",
            "Twelfth",
            "Twentieth",
            "Twenty-first",
            "One hundredth",
            "One thousand first",
        ]);
        expect(each("vietnameseCounting", [0, 4, 10, 11, 15, 21, 24, 25, 100, 101, 115, 1000, 1001])).to.deep.equal([
            "không",
            "bốn",
            "mười",
            "mười một",
            "mười lăm",
            "hai mươi mốt",
            "hai mươi bốn",
            "hai mươi lăm",
            "một trăm",
            "một trăm lẻ một",
            "một trăm mười lăm",
            "một ngàn",
            undefined,
        ]);
    });

    it("should enclose the first numbers, and write decimal numbers past them", () => {
        expect(each("decimalEnclosedCircle", [0, 4, 20, 21])).to.deep.equal(["0", "④", "⑳", "21"]);
        expect(each("decimalEnclosedFullstop", [4, 21])).to.deep.equal(["⒋", "21"]);
        expect(each("decimalEnclosedParen", [4, 21])).to.deep.equal(["⑷", "21"]);
        expect(each("decimalEnclosedCircleChinese", [10, 11])).to.deep.equal(["⑩", "11"]);
        expect(each("ideographEnclosedCircle", [4, 11])).to.deep.equal(["㈣", "11"]);
        expect(each("ideographTraditional", [0, 4, 10, 11])).to.deep.equal(["0", "丁", "癸", "11"]);
        expect(each("ideographZodiac", [4, 11, 13])).to.deep.equal(["卯", "戍", "13"]);
        expect(each("ideographZodiacTraditional", [0, 4, 60, 61, 1234])).to.deep.equal(["0", "丁卯", "癸亥", "甲子", "丁酉"]);
    });

    it("should write nothing for bullets and none, and leave out formats, numbers and fractions it doesn't write", () => {
        expect(formatNumber(3, "bullet")).to.equal("");
        expect(formatNumber(3, "none")).to.equal("");
        expect(formatNumber(3, "thaiCounting")).to.equal(undefined);
        expect(formatNumber(3, "hindiCounting")).to.equal(undefined);
        expect(formatNumber(-1, "decimalZero")).to.equal(undefined);
        expect(formatNumber(1.5)).to.equal(undefined);
        expect(formatNumber(40000, "decimalFullWidth")).to.equal(undefined);
    });
});

describe("formatPageNumber", () => {
    it("should write page numbers as list numbers, but words without a capital, and bullets in decimal", () => {
        expect(formatPageNumber(1234, "lowerRoman")).to.equal("mccxxxiv");
        expect(formatPageNumber(4)).to.equal("4");
        expect(formatPageNumber(1234, "cardinalText")).to.equal("one thousand two hundred thirty-four");
        expect(formatPageNumber(0, "cardinalText")).to.equal("zero");
        expect(formatPageNumber(1234, "ordinalText")).to.equal("one thousand two hundred thirty-fourth");
        expect(formatPageNumber(4, "bullet")).to.equal("4");
        expect(formatPageNumber(0, "bullet")).to.equal("0");
    });

    it("should write taiwaneseCountingThousand in digits", () => {
        expect([0, 10, 11, 1234].map((value) => formatPageNumber(value, "taiwaneseCountingThousand"))).to.deep.equal([
            "○",
            "一○",
            "一一",
            "一二三四",
        ]);
    });

    it("should leave out the page numbers Word writes an error, nothing, or other letters for", () => {
        expect(formatPageNumber(4, "none")).to.equal(undefined);
        expect(
            ["chicago", "hebrew1", "hebrew2", "arabicAlpha", "arabicAbjad", "hindiNumbers", "thaiNumbers"].map((format) =>
                formatPageNumber(0, format),
            ),
        ).to.deep.equal(Array.from({ length: 7 }, () => undefined));
        expect(["hindiVowels", "hindiConsonants", "thaiLetters"].map((format) => formatPageNumber(0, format))).to.deep.equal(["", "", ""]);
        // The most Word was seen to write
        expect([formatPageNumber(100, "hebrew1"), formatPageNumber(101, "hebrew1")]).to.deep.equal(["ק", undefined]);
        expect([formatPageNumber(100, "hebrew2"), formatPageNumber(101, "hebrew2")]).to.deep.equal(["תתתתל", undefined]);
        expect([formatPageNumber(75, "hindiVowels"), formatPageNumber(76, "hindiVowels")]).to.deep.equal(["ककक", undefined]);
        expect([formatPageNumber(37, "hindiConsonants"), formatPageNumber(38, "hindiConsonants")]).to.deep.equal(["अअअ", undefined]);
        expect([formatPageNumber(120, "chicago"), formatPageNumber(121, "chicago")]).to.deep.equal(["§".repeat(30), undefined]);
    });
});

// What Word wrote for SEQ fields in its PDF of scripts/layout-probes/word-seq.ts, and for page references and numbers of
// pages in word-watertight-fields.ts FD3
describe("formatFieldNumber", () => {
    it("should write a number in the formats of a field's \\* switch, in the capitals of their names", () => {
        expect(
            ["roman", "Roman", "ROMAN", "alphabetic", "ALPHABETIC", "Ordinal", "ordinal", "Arabic", "ArabicDash"].map((format) =>
                formatFieldNumber(10, format),
            ),
        ).to.deep.equal(["x", "X", "X", "j", "J", "10th", "10th", "10", "- 10 -"]);
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map((value) => formatFieldNumber(value, "Ordinal"))).to.deep.equal([
            "1st",
            "2nd",
            "3rd",
            "4th",
            "11th",
            "12th",
            "13th",
            "21st",
            "22nd",
            "23rd",
            "101st",
            "111th",
        ]);
        expect([27, 52, 780].map((value) => formatFieldNumber(value, "ALPHABETIC"))).to.deep.equal(["AA", "ZZ", "Z".repeat(30)]);
        expect(formatFieldNumber(4000, "ROMAN")).to.equal("MMMM");
    });

    it("should write nothing for 0 in roman numerals and letters, and leave out the numbers and formats whose text from Word isn't known", () => {
        expect([formatFieldNumber(0, "roman"), formatFieldNumber(0, "alphabetic"), formatFieldNumber(0, "Arabic")]).to.deep.equal([
            "",
            "",
            "0",
        ]);
        expect([formatFieldNumber(0, "Ordinal"), formatFieldNumber(781, "alphabetic"), formatFieldNumber(32768, "roman")]).to.deep.equal([
            undefined,
            undefined,
            undefined,
        ]);
        expect([formatFieldNumber(4, "BahtText"), formatFieldNumber(4, "constructor")]).to.deep.equal([undefined, undefined]);
        expect([isFieldNumberFormat("ROMAN"), isFieldNumberFormat("arabicdash"), isFieldNumberFormat("DBNUM1")]).to.deep.equal([
            true,
            true,
            false,
        ]);
    });

    it("should write a number in words, as dollars, and in hexadecimal, as Word wrote page 1 in them", () => {
        // `word-stops-numbers.ts` NF2: "one", "one and 00/100", "first" and "1"
        expect(["CardText", "DollarText", "OrdText", "Hex"].map((format) => formatFieldNumber(1, format))).to.deep.equal([
            "one",
            "one and 00/100",
            "first",
            "1",
        ]);
        expect(["cardtext", "DOLLARTEXT", "OrdText"].map((format) => formatFieldNumber(121, format))).to.deep.equal([
            "one hundred twenty-one",
            "one hundred twenty-one and 00/100",
            "one hundred twenty-first",
        ]);
        // In capitals, as Word's help writes 458 as 1CA. Whether a name in small letters writes small ones hasn't been seen
        expect([
            formatFieldNumber(458, "Hex"),
            formatFieldNumber(458, "HEX"),
            formatFieldNumber(458, "hex"),
            formatFieldNumber(9, "hex"),
        ]).to.deep.equal(["1CA", "1CA", undefined, "9"]);
        expect([formatFieldNumber(70000, "hex"), formatFieldNumber(70000, "Hex")]).to.deep.equal([undefined, undefined]);
    });
});

describe("writeFieldNumber", () => {
    it("should write a number with a picture as Word does: 0s filled, a space for a # or x with no digit, a decimal point and text", () => {
        const pictured = (value: number, picture: string): string | undefined => writeFieldNumber(value, { picture });
        // `word-page-fields.ts` PF5 to PF7, and `word-stops-numbers.ts` NF3
        expect(
            ["00", "000", "0", "#", "#,##0", "0.00", "x##", "'p'00", "'page '0' of'"].map((picture) => pictured(1, picture)),
        ).to.deep.equal(["01", "001", "1", "1", "   1", "1.00", "  1", "p01", "page 1 of"]);
        expect([pictured(1234, "#,##0"), pictured(12345, "0"), pictured(123, "x###")]).to.deep.equal(["1,234", "12345", " 123"]);
        // Where x would drop digits, and 0 with no 0 in the picture, which haven't been seen
        expect([pictured(1234, "x##"), pictured(0, "#")]).to.deep.equal([undefined, undefined]);
        // A number format with no picture
        expect(writeFieldNumber(4, { numberFormat: "roman" })).to.equal("iv");
    });

    it("should know the pictures whose text Word is known to write", () => {
        expect(["00", "#,##0", "0.00", "x##", "'p'00", "0'end'"].map(isFieldPicture)).to.deep.equal([true, true, true, true, true, true]);
        // # after a decimal point, x after the first place, text inside the number or out of quotes, sections
        expect(["0.#", "#x#", "0'-'0", "$0", "0;0", "", "x.00x"].map(isFieldPicture)).to.deep.equal([
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ]);
    });
});
