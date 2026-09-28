import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { MathAccent, type MathAccentName } from "./math-accent";

const toXml = (component: MathAccent): string => xml(new Formatter().format(component));

const x = "<m:e><m:r><m:t>x</m:t></m:r></m:e>";

describe("MathAccent", () => {
    it("puts a hat over its children by default", () => {
        expect(toXml(new MathAccent({ children: [new MathRun("x")] }))).toBe(
            `<m:acc><m:accPr><m:chr m:val="\u0302"/></m:accPr>${x}</m:acc>`,
        );
    });

    it.each<readonly [MathAccentName, string]>([
        ["hat", "\u0302"],
        ["check", "\u030C"],
        ["tilde", "\u0303"],
        ["acute", "\u0301"],
        ["grave", "\u0300"],
        ["dot", "\u0307"],
        ["doubleDot", "\u0308"],
        ["tripleDot", "\u20DB"],
        ["breve", "\u0306"],
        ["bar", "\u0305"],
        ["ring", "\u030A"],
        ["rightArrow", "\u20D7"],
        ["leftArrow", "\u20D6"],
        ["leftRightArrow", "\u20E1"],
        ["rightHarpoon", "\u20D1"],
        ["leftHarpoon", "\u20D0"],
    ])("writes the %s accent as the combining character Word uses", (accent, character) => {
        expect(toXml(new MathAccent({ accent, children: [new MathRun("x")] }))).toContain(`<m:chr m:val="${character}"/>`);
    });

    it("writes an accent over nothing with a zero-width space, which LibreOffice needs", () => {
        expect(toXml(new MathAccent({ children: [] }))).toContain('<m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>');
    });

    it("throws for an accent it doesn't know, for code that isn't type checked", () => {
        // @ts-expect-error -- not an accent
        expect(() => new MathAccent({ accent: "vec", children: [] })).toThrow('MathAccent: accent is "vec", which isn\'t one of "hat"');
    });

    it("throws for a Math in its children, which Word won't open", () => {
        expect(() => new MathAccent({ children: [new Math({ children: [] })] })).toThrow("MathAccent: children holds a Math");
    });
});
