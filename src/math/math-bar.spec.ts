import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { MathBar } from "./math-bar";

const toXml = (component: MathBar): string => xml(new Formatter().format(component));

describe("MathBar", () => {
    it("puts a line above its children by default, writing the position, as the schema's default is below", () => {
        expect(toXml(new MathBar({ children: [new MathRun("AB")] }))).toBe(
            '<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e><m:r><m:t>AB</m:t></m:r></m:e></m:bar>',
        );
    });

    it("puts a line below its children", () => {
        expect(toXml(new MathBar({ position: "below", children: [new MathRun("x")] }))).toContain('<m:pos m:val="bot"/>');
    });

    it("writes a line over nothing with a zero-width space", () => {
        expect(toXml(new MathBar({ children: [] }))).toContain('<m:t xml:space="preserve">\u200B</m:t>');
    });

    it("throws for a position it doesn't know, and for a Math in its children", () => {
        // @ts-expect-error -- not a position
        expect(() => new MathBar({ position: "top", children: [] })).toThrow(
            'MathBar: position is "top", which isn\'t one of "above", "below"',
        );
        expect(() => new MathBar({ children: [new Math({ children: [] })] })).toThrow("MathBar: children holds a Math");
    });
});
