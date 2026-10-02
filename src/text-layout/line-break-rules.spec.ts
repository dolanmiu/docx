import { describe, expect, it } from "vitest";

import { extendsCharacter, findLineBreaks, isEastAsian, kinsokuLanguageOf } from "./line-break-rules";

// cspell:disable

/** Where a line can break in text in one run */
const breaksOf = (text: string, language?: string, rules = {}): readonly number[] =>
    [...findLineBreaks([{ text, ...(language ? { language } : {}) }], rules)].sort((a, b) => a - b);

describe("findLineBreaks", () => {
    it("should break Latin text only after hyphens and dashes, but not before a number, as Word does", () => {
        expect(breaksOf("abcdef")).to.deep.equal([]);
        expect(breaksOf("ab-cd")).to.deep.equal([3]);
        expect(breaksOf("ab-12")).to.deep.equal([]);
        expect(breaksOf("ab—cd–ef‐gh")).to.deep.equal([3, 6, 9]);
        // Word doesn't break after a slash
        expect(breaksOf("ab/cd")).to.deep.equal([]);
    });

    it("should break after a zero-width space, and not around no-break spaces and the word joiner", () => {
        expect(breaksOf("ab\u200bcd")).to.deep.equal([3]);
        expect(breaksOf("永\u00a0永\u2060永")).to.deep.equal([]);
    });

    it("should break between Chinese and Japanese characters, and between them and Latin words", () => {
        expect(breaksOf("永永かな")).to.deep.equal([1, 2, 3]);
        expect(breaksOf("永ab永")).to.deep.equal([1, 3]);
        // Full-width letters and numbers break as ideographs do
        expect(breaksOf("１２")).to.deep.equal([1]);
    });

    it("should keep a character and the marks on it together", () => {
        expect(breaksOf("か\u3099か")).to.deep.equal([2]);
        expect(breaksOf("永\u200d永")).to.deep.equal([]);
        // Variation selectors, skin tones and tags go with the character before them
        expect(breaksOf("永\ufe0f永")).to.deep.equal([2]);
        expect(breaksOf("永\u{1f3fb}永")).to.deep.equal([2]);
        expect(breaksOf("永\u{e0020}永")).to.deep.equal([2]);
        expect(extendsCharacter("\u0301")).to.equal(true);
        expect(extendsCharacter("a")).to.equal(false);
    });

    it("should break Korean, Thai and the other scripts only at their spaces, as Word does", () => {
        expect(breaksOf("가나다라")).to.deep.equal([]);
        expect(breaksOf("ภาษาไทยเป็นภาษา")).to.deep.equal([]);
        expect(breaksOf("ภาษา\u200bไทย")).to.deep.equal([5]);
        // An ideograph next to Korean breaks around it
        expect(breaksOf("가永나")).to.deep.equal([1, 2]);
        expect(isEastAsian("가")).to.equal(true);
    });

    it("should keep Word's characters from starting or ending a line only in Japanese and Chinese", () => {
        // 、 can't start a line, and 「 can't end one
        expect(breaksOf("永、永「永", "ja-JP")).to.deep.equal([2, 3]);
        expect(breaksOf("永、永「永")).to.deep.equal([1, 2, 3, 4]);
        expect(breaksOf("永、永「永", "en-US")).to.deep.equal([1, 2, 3, 4]);
        expect(breaksOf("永、永「永", "ko-KR")).to.deep.equal([1, 2, 3, 4]);
        expect(breaksOf("永、永「永", "zh-CN")).to.deep.equal([2, 3]);
        // Each language has its own list: ～ can start a line in Traditional Chinese, not in Simplified, and 々 only in
        // Chinese
        expect(breaksOf("永～永", "zh-CN")).to.deep.equal([2]);
        expect(breaksOf("永～永", "zh-TW")).to.deep.equal([1, 2]);
        expect(breaksOf("永々永", "ja-JP")).to.deep.equal([2]);
        expect(breaksOf("永々永", "zh-HK")).to.deep.equal([1, 2]);
        // And not with kinsoku off
        expect(breaksOf("永、永「永", "ja-JP", { kinsoku: false })).to.deep.equal([1, 2, 3, 4]);
    });

    it("should take the document's own lists in place of Word's", () => {
        // The document's list of characters that can't start a line, with Word's of those that can't end one
        const lists = { japanese: { noLineStart: "永" } };
        expect(breaksOf("永、永「永", "ja-JP", { lists })).to.deep.equal([1, 3]);
        expect(breaksOf("永、永「永", "zh-CN", { lists })).to.deep.equal([2, 3]);
    });

    it("should break the words of East Asian runs anywhere with word wrap off, keeping to the characters that can't start a line", () => {
        expect([...findLineBreaks([{ text: "abc", eastAsian: true }], { wordWrap: false })]).to.deep.equal([1, 2]);
        expect([...findLineBreaks([{ text: "abc" }], { wordWrap: false })]).to.deep.equal([]);
        expect([...findLineBreaks([{ text: "ab", eastAsian: true }, { text: "cd" }], { wordWrap: false })]).to.deep.equal([1]);
        expect([...findLineBreaks([{ text: "ab,", eastAsian: true, language: "ja-JP" }], { wordWrap: false })]).to.deep.equal([1]);
        expect([...findLineBreaks([{ text: "abc", eastAsian: true }])]).to.deep.equal([]);
    });
});

describe("kinsokuLanguageOf", () => {
    it("should find Word's list for a language by its tag", () => {
        expect(kinsokuLanguageOf("ja-JP")).to.equal("japanese");
        expect(kinsokuLanguageOf("zh-CN")).to.equal("simplifiedChinese");
        expect(kinsokuLanguageOf("zh-Hant")).to.equal("traditionalChinese");
        expect(kinsokuLanguageOf("ZH-MO")).to.equal("traditionalChinese");
        expect(kinsokuLanguageOf("ko-KR")).to.equal("korean");
        expect(kinsokuLanguageOf("en-US")).to.equal(undefined);
        expect(kinsokuLanguageOf(undefined)).to.equal(undefined);
    });
});
