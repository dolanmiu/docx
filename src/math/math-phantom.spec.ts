import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { MathPhantom } from "./math-phantom";

const toXml = (component: MathPhantom): string => xml(new Formatter().format(component));

describe("MathPhantom", () => {
    it("hides its children, which still take up their room, by default", () => {
        expect(toXml(new MathPhantom({ children: [new MathRun("x")] }))).toBe(
            '<m:phant><m:phantPr><m:show m:val="0"/></m:phantPr><m:e><m:r><m:t>x</m:t></m:r></m:e></m:phant>',
        );
    });

    it("gives them no width, height or depth, as LaTeX's \\vphantom, \\hphantom and \\smash do", () => {
        expect(toXml(new MathPhantom({ width: false, children: [] }))).toContain(
            '<m:phantPr><m:show m:val="0"/><m:zeroWid m:val="1"/></m:phantPr>',
        );
        expect(toXml(new MathPhantom({ visible: true, height: false, depth: false, children: [] }))).toContain(
            '<m:phantPr><m:show m:val="1"/><m:zeroAsc m:val="1"/><m:zeroDesc m:val="1"/></m:phantPr>',
        );
    });

    it("throws for a Math in its children", () => {
        expect(() => new MathPhantom({ children: [new Math({ children: [] })] })).toThrow("MathPhantom: children holds a Math");
    });
});
