import { describe, expect, it } from "vitest";

import { arabicFaceOf, isJoinedLetter, joinedWidthsOf, joinsAcross, unknownArabicKerning } from "./arabic-shaping";

// cspell:disable

/** The widths of the letters of text in a face, in order, by Word's PDF of word-stops-arabic.ts */
const widthsOf = (text: string, name = "Arial", bold = false): readonly (number | undefined)[] => {
    const characters = [...text];
    const widths = joinedWidthsOf(characters, arabicFaceOf(name, bold, false)!);
    return characters.map((_, index) => widths.get(index));
};

describe("joinedWidthsOf", () => {
    it("should measure each letter in the form the letters beside it join it in (AR1)", () => {
        // Beh isolated, initial, medial and final: 713.38, 244.13, 244.12 and 713.37 thousandths of an em of Arial
        expect(widthsOf("ب")).to.deep.equal([713.4]);
        expect(widthsOf("ببب")).to.deep.equal([244.1, 244.1, 713.4]);
        // Hamza joins neither letter, and the letters beside it are isolated
        expect(widthsOf("بءب")).to.deep.equal([713.4, 412.6, 713.4]);
        // Heh, initial, final, 374.99, and medial
        expect(widthsOf("هه")).to.deep.equal([450.2, 375]);
        expect(widthsOf("ههه")[1]).to.equal(394);
    });

    it("should join a letter that joins only the letter before it to that one, and not the next", () => {
        // Alef isolated, 207.03, and final, 229.48: beh before it is initial, and the beh after it isolated
        expect(widthsOf("اب")).to.deep.equal([207, 713.4]);
        expect(widthsOf("باب")).to.deep.equal([244.1, 229.5, 713.4]);
    });

    it("should join lam and the alef after it into a ligature, isolated or final", () => {
        // 543.95 and 600.57, the alef in it taking no room
        expect(widthsOf("لا")).to.deep.equal([544, 0]);
        expect(widthsOf("بلا")).to.deep.equal([244.1, 600.6, 0]);
        expect(widthsOf("لأ", "Times New Roman", true)).to.deep.equal([486.3, 0]);
        // And not with a letter that isn't an alef
        expect(widthsOf("لب")).to.deep.equal([207, 713.4]);
    });

    it("should join letters across marks, and the tatweel and zero-width joiner to the letters beside them, but not across a zero-width non-joiner", () => {
        expect(widthsOf("بَب")).to.deep.equal([244.1, undefined, 713.4]);
        expect(widthsOf("ـبـ")).to.deep.equal([207, 244.1, 207]);
        expect(widthsOf("ب‍")).to.deep.equal([244.1, undefined]);
        expect(widthsOf("ب‌ب")).to.deep.equal([713.4, undefined, 713.4]);
        // Latin letters beside them join nothing
        expect(widthsOf("aبa")).to.deep.equal([undefined, 713.4, undefined]);
    });

    it("should have Courier New's forms all as wide, and Cambria's drawn in Times New Roman, as Word draws them", () => {
        expect(widthsOf("ببلا", "Courier New")).to.deep.equal([600.1, 600.2, 600.1, 0]);
        expect(arabicFaceOf("Cambria", false, false)?.drawnIn).to.equal("Times New Roman");
        expect(widthsOf("بب", "Cambria")).to.deep.equal(widthsOf("بب", "Times New Roman"));
    });
});

describe("arabicFaceOf", () => {
    it("should have the faces whose forms Word's PDF shows, and not Calibri's, which Word draws otherwise, nor italic", () => {
        expect(arabicFaceOf("Arial", true, false)).to.not.equal(undefined);
        expect(arabicFaceOf("Calibri", false, false)).to.equal(undefined);
        expect(arabicFaceOf("Arial", false, true)).to.equal(undefined);
        // Read once
        expect(arabicFaceOf("Arial", false, false)).to.equal(arabicFaceOf("Arial", false, false));
    });
});

describe("isJoinedLetter", () => {
    it("should find Arabic's letters and the tatweel, and not its digits or other letters", () => {
        expect(isJoinedLetter("ب")).to.equal(true);
        expect(isJoinedLetter("ـ")).to.equal(true);
        expect(isJoinedLetter("ی")).to.equal(true);
        expect(isJoinedLetter("١")).to.equal(false);
        expect(isJoinedLetter("ٱ")).to.equal(false);
        expect(isJoinedLetter("a")).to.equal(false);
    });
});

describe("unknownArabicKerning", () => {
    it("should find Arabic letters side by side in the fonts Word kerns them in, but not across a space, tatweel or zero-width non-joiner", () => {
        const KERNED = "Arabic letters side by side, which Word kerns by pairs not yet known";
        expect(unknownArabicKerning("بلا", "Arial")).to.equal(KERNED);
        expect(unknownArabicKerning("ب\u064eب", "Times New Roman")).to.equal(KERNED);
        expect(unknownArabicKerning("ب ب", "Cambria")).to.equal(undefined);
        expect(unknownArabicKerning("بـب", "Arial")).to.equal(undefined);
        expect(unknownArabicKerning("ب\u200cب", "Arial")).to.equal(undefined);
        // Nor in Courier New, which Word doesn't kern
        expect(unknownArabicKerning("بلا", "Courier New")).to.equal(undefined);
    });
});

describe("joinsAcross", () => {
    it("should find Arabic letters that join from one run's text to the next's, across marks", () => {
        expect(joinsAcross("كتب", "ب")).to.equal(true);
        expect(joinsAcross("بَ", "َا")).to.equal(true);
        expect(joinsAcross("ـ", "ب")).to.equal(true);
        // A letter that doesn't join the next, a space or a zero-width non-joiner between them, and Latin text
        expect(joinsAcross("كا", "ب")).to.equal(false);
        expect(joinsAcross("كب ", "ب")).to.equal(false);
        expect(joinsAcross("ب‌", "ب")).to.equal(false);
        expect(joinsAcross("ab", "cd")).to.equal(false);
        expect(joinsAcross("‍", "‍")).to.equal(false);
        expect(joinsAcross("", "ب")).to.equal(false);
        expect(joinsAcross("ب", "")).to.equal(false);
    });
});
