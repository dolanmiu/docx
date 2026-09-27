import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathFraction, MathRun, Paragraph, TextRun } from "docx";

import { MathBrackets } from "./math-brackets";
import { MathMatrix } from "./math-matrix";

const toXml = (component: MathBrackets): string => xml(new Formatter().format(component));

const x = "<m:e><m:r><m:t>x</m:t></m:r></m:e>";

describe("MathBrackets", () => {
    it("puts round brackets around its children by default", () => {
        expect(toXml(new MathBrackets({ children: [new MathRun("x")] }))).toBe(
            `<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/></m:dPr>${x}</m:d>`,
        );
    });

    it("takes any single characters, such as bars for an absolute value", () => {
        expect(toXml(new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] }))).toBe(
            `<m:d><m:dPr><m:begChr m:val="|"/><m:endChr m:val="|"/></m:dPr>${x}</m:d>`,
        );
        expect(toXml(new MathBrackets({ open: "‖", close: "‖", children: [new MathRun("x")] }))).toContain('<m:begChr m:val="‖"/>');
    });

    it("writes an empty character for a side with no bracket", () => {
        expect(toXml(new MathBrackets({ open: "{", close: "", children: [new MathRun("x")] }))).toBe(
            `<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val=""/></m:dPr>${x}</m:d>`,
        );
        expect(toXml(new MathBrackets({ open: "", close: "}", children: [new MathRun("x")] }))).toContain(
            '<m:begChr m:val=""/><m:endChr m:val="}"/>',
        );
    });

    it("writes each item as an argument, with the separator between the two brackets in the schema's order", () => {
        expect(toXml(new MathBrackets({ open: "⟨", close: "⟩", separator: "|", items: [[new MathRun("a")], [new MathRun("b")]] }))).toBe(
            '<m:d><m:dPr><m:begChr m:val="⟨"/><m:sepChr m:val="|"/><m:endChr m:val="⟩"/></m:dPr>' +
                "<m:e><m:r><m:t>a</m:t></m:r></m:e><m:e><m:r><m:t>b</m:t></m:r></m:e></m:d>",
        );
    });

    it("leaves the separator to Word's default when none is given", () => {
        const written = toXml(new MathBrackets({ items: [[new MathRun("a")], [new MathRun("b")], [new MathRun("c")]] }));
        expect(written).not.toContain("m:sepChr");
        expect(written.match(/<m:e>/g)).toHaveLength(3);
    });

    it("takes one item", () => {
        expect(toXml(new MathBrackets({ items: [[new MathRun("x")]] }))).toBe(
            `<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/></m:dPr>${x}</m:d>`,
        );
    });

    it("writes m:grow only to stop the brackets growing", () => {
        expect(toXml(new MathBrackets({ grow: false, children: [new MathRun("x")] }))).toContain(
            '<m:endChr m:val=")"/><m:grow m:val="0"/></m:dPr>',
        );
        expect(toXml(new MathBrackets({ grow: true, children: [new MathRun("x")] }))).not.toContain("m:grow");
    });

    it("writes a zero-width space in an empty argument, which LibreOffice can't read otherwise", () => {
        expect(toXml(new MathBrackets({ children: [] }))).toContain('<m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>');
        expect(toXml(new MathBrackets({ items: [[new MathRun("a")], []] }))).toContain(
            '<m:e><m:r><m:t>a</m:t></m:r></m:e><m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>',
        );
    });

    it("counts characters as code points, so one outside the BMP is one character", () => {
        expect(toXml(new MathBrackets({ open: "𝒜", close: "𝒜", separator: "𝒜", items: [[], []] }))).toContain('<m:begChr m:val="𝒜"/>');
    });

    it("throws for a bracket or separator of more than one character", () => {
        expect(() => new MathBrackets({ open: "((", children: [] })).toThrow(
            'MathBrackets: open is "((", which is more than one character. Give one character, or "" for none',
        );
        expect(() => new MathBrackets({ close: "||", children: [] })).toThrow('MathBrackets: close is "||"');
        expect(() => new MathBrackets({ separator: ", ", items: [[], []] })).toThrow('MathBrackets: separator is ", "');
    });

    it("throws for no items", () => {
        expect(() => new MathBrackets({ items: [] })).toThrow("MathBrackets: items is empty. Give at least one item, or use children");
    });

    it("throws for math inside math, a paragraph or a run of document text, naming where it is", () => {
        const math = new Math({ children: [new MathRun("x")] });
        expect(() => new MathBrackets({ children: [math] })).toThrow(
            "MathBrackets: children holds a Math. Word won't open math inside math, so give the Math's children instead",
        );
        expect(() => new MathBrackets({ items: [[new MathRun("a")], [new MathRun("b"), math]] })).toThrow(
            "MathBrackets: item 2 holds a Math",
        );
        expect(() => new MathBrackets({ children: [new Paragraph("x")] })).toThrow(
            "MathBrackets: children holds a Paragraph. Math goes in a paragraph, not a paragraph in math",
        );
        expect(() => new MathBrackets({ children: [new TextRun("x")] })).toThrow(
            "MathBrackets: children holds a TextRun or another run of document text, which can't go in math. Use a MathRun",
        );
    });

    it("goes inside other math, and holds it", () => {
        const fraction = new MathFraction({
            numerator: [new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] })],
            denominator: [new MathRun("2")],
        });
        expect(xml(new Formatter().format(fraction))).toContain('<m:num><m:d><m:dPr><m:begChr m:val="|"/>');
        expect(toXml(new MathBrackets({ children: [new MathMatrix({ rows: [[[new MathRun("1")]]] })] }))).toContain("<m:e><m:m>");
    });
});
