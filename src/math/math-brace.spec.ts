import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { MathBrace } from "./math-brace";

const toXml = (component: MathBrace): string => xml(new Formatter().format(component));

const e = "<m:e><m:r><m:t>a+b</m:t></m:r></m:e>";

describe("MathBrace", () => {
    it("puts a curly brace above its children by default, lined up with the text by its bottom", () => {
        expect(toXml(new MathBrace({ children: [new MathRun("a+b")] }))).toBe(
            '<m:groupChr><m:groupChrPr><m:chr m:val="⏞"/><m:pos m:val="top"/><m:vertJc m:val="bot"/></m:groupChrPr>' + `${e}</m:groupChr>`,
        );
    });

    it("puts a brace below, lined up by its top", () => {
        expect(toXml(new MathBrace({ position: "below", children: [new MathRun("a+b")] }))).toBe(
            '<m:groupChr><m:groupChrPr><m:chr m:val="⏟"/><m:pos m:val="bot"/><m:vertJc m:val="top"/></m:groupChrPr>' + `${e}</m:groupChr>`,
        );
    });

    it.each([
        ["curly", "above", "⏞"],
        ["curly", "below", "⏟"],
        ["square", "above", "⎴"],
        ["square", "below", "⎵"],
        ["round", "above", "⏜"],
        ["round", "below", "⏝"],
    ] as const)("draws a %s brace %s as %s", (brace, position, character) => {
        expect(toXml(new MathBrace({ brace, position, children: [] }))).toContain(`<m:chr m:val="${character}"/>`);
    });

    it("puts a label above a brace above, in a limit, as Word writes it", () => {
        expect(toXml(new MathBrace({ children: [new MathRun("a+b")], label: [new MathRun("n")] }))).toBe(
            "<m:limUpp><m:e><m:groupChr>" +
                '<m:groupChrPr><m:chr m:val="⏞"/><m:pos m:val="top"/><m:vertJc m:val="bot"/></m:groupChrPr>' +
                `${e}</m:groupChr></m:e><m:lim><m:r><m:t>n</m:t></m:r></m:lim></m:limUpp>`,
        );
    });

    it("puts a label below a brace below", () => {
        const written = toXml(new MathBrace({ position: "below", children: [new MathRun("a+b")], label: [new MathRun("n")] }));
        expect(written).toMatch(/^<m:limLow><m:e><m:groupChr>/);
        expect(written).toMatch(/<m:lim><m:r><m:t>n<\/m:t><\/m:r><\/m:lim><\/m:limLow>$/);
    });

    it("writes an empty label with a zero-width space", () => {
        expect(toXml(new MathBrace({ children: [], label: [] }))).toContain(
            '<m:lim><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:lim>',
        );
    });

    it("throws for a position or brace it doesn't know, and for a Math in its children or label", () => {
        // @ts-expect-error -- not a position
        expect(() => new MathBrace({ position: "top", children: [] })).toThrow('MathBrace: position is "top"');
        // @ts-expect-error -- not a brace
        expect(() => new MathBrace({ brace: "angled", children: [] })).toThrow('MathBrace: brace is "angled"');
        expect(() => new MathBrace({ children: [new Math({ children: [] })] })).toThrow("MathBrace: children holds a Math");
        expect(() => new MathBrace({ children: [], label: [new Math({ children: [] })] })).toThrow("MathBrace: label holds a Math");
    });
});
