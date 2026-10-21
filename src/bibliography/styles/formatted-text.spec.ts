import { describe, expect, it } from "vitest";

import { LINE_BREAK, bold, formatted, italic, join, mergeRuns, readAsWord, textOf, underline } from "./formatted-text";

describe("formatted text", () => {
    it("is runs, from plain text or runs", () => {
        expect(formatted("Pizza")).to.deep.equal([{ text: "Pizza" }]);
        expect(formatted("")).to.deep.equal([]);
        expect(formatted([{ text: "Pizza", bold: true }])).to.deep.equal([{ text: "Pizza", bold: true }]);
    });

    it("joins parts, and formats them as HTML's <i>, <b> and <u> do", () => {
        expect(join("A ", italic("B ", bold("C")), underline("D"))).to.deep.equal([
            { text: "A " },
            { text: "B ", italics: true },
            { text: "C", bold: true, italics: true },
            { text: "D", underline: true },
        ]);
    });

    it("reads as its text, without its formatting or line breaks", () => {
        expect(textOf("Pizza")).to.equal("Pizza");
        expect(textOf(join("A", LINE_BREAK, italic("B")))).to.equal("AB");
    });
});

describe("readAsWord", () => {
    it("collapses each run of spaces, tabs and line feeds into one space, as HTML does", () => {
        expect(readAsWord(join("A  \t\n B", italic(" C"), " ", bold("  D")))).to.deep.equal([
            { text: "A B" },
            { text: " C", italics: true },
            { text: " " },
            { text: "D", bold: true },
        ]);
    });

    it("drops the spaces at the start of the paragraph and after a line break", () => {
        expect(readAsWord(join(" A", LINE_BREAK, " B"))).to.deep.equal([{ text: "A" }, { text: "", lineBreak: true }, { text: "B" }]);
    });

    it("joins runs with the same formatting, and drops empty ones", () => {
        expect(readAsWord([{ text: "A" }, { text: "" }, { text: "B", bold: false }, { text: "C", italics: true }])).to.deep.equal([
            { text: "AB" },
            { text: "C", italics: true },
        ]);
    });
});

describe("mergeRuns", () => {
    it("joins runs with the same formatting, without changing their spaces", () => {
        expect(mergeRuns([{ text: "A " }, { text: " B" }, { text: "C", italics: true }, ...LINE_BREAK, { text: "D" }])).to.deep.equal([
            { text: "A  B" },
            { text: "C", italics: true },
            { text: "", lineBreak: true },
            { text: "D" },
        ]);
    });
});
