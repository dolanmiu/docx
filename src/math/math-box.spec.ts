import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { MathBox } from "./math-box";

const toXml = (component: MathBox): string => xml(new Formatter().format(component));

describe("MathBox", () => {
    it("draws a box around its children, with no properties, as all four sides are drawn by default", () => {
        expect(toXml(new MathBox({ children: [new MathRun("x")] }))).toBe("<m:borderBox><m:e><m:r><m:t>x</m:t></m:r></m:e></m:borderBox>");
    });

    it("hides the sides left out, in the schema's order", () => {
        expect(toXml(new MathBox({ borders: ["left", "top"], children: [new MathRun("x")] }))).toContain(
            '<m:borderBoxPr><m:hideBot m:val="1"/><m:hideRight m:val="1"/></m:borderBoxPr>',
        );
    });

    it("strikes lines through it, with no box, as LaTeX's \\cancel does", () => {
        expect(toXml(new MathBox({ borders: [], strikes: ["diagonalDown", "diagonalUp"], children: [new MathRun("x")] }))).toBe(
            "<m:borderBox><m:borderBoxPr>" +
                '<m:hideTop m:val="1"/><m:hideBot m:val="1"/><m:hideLeft m:val="1"/><m:hideRight m:val="1"/>' +
                '<m:strikeBLTR m:val="1"/><m:strikeTLBR m:val="1"/>' +
                "</m:borderBoxPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:borderBox>",
        );
    });

    it("strikes horizontal and vertical lines", () => {
        expect(toXml(new MathBox({ strikes: ["vertical", "horizontal"], children: [] }))).toContain(
            '<m:borderBoxPr><m:strikeH m:val="1"/><m:strikeV m:val="1"/></m:borderBoxPr>',
        );
    });

    it("throws for a side or strike it doesn't know, and for a Math in its children", () => {
        // @ts-expect-error -- not a side
        expect(() => new MathBox({ borders: ["bot"], children: [] })).toThrow('MathBox: borders is "bot"');
        // @ts-expect-error -- not a strike
        expect(() => new MathBox({ strikes: ["strikeH"], children: [] })).toThrow('MathBox: strikes is "strikeH"');
        expect(() => new MathBox({ children: [new Math({ children: [] })] })).toThrow("MathBox: children holds a Math");
    });
});
