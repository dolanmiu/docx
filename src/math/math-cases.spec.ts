import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun } from "docx";

import { type MathCase, MathCases } from "./math-cases";
import { MathMatrix } from "./math-matrix";

const toXml = (component: MathCases): string => xml(new Formatter().format(component));

const e = (text: string): string => `<m:e><m:r><m:t>${text}</m:t></m:r></m:e>`;
const EMPTY = '<m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>';

describe("MathCases", () => {
    it("writes a two-column matrix, lined up on the left, in a brace with no closing bracket", () => {
        expect(
            toXml(
                new MathCases({
                    cases: [
                        { value: [new MathRun("1,")], condition: [new MathRun("x>0")] },
                        { value: [new MathRun("0,")], condition: [new MathRun("x=0")] },
                    ],
                }),
            ),
        ).toBe(
            '<m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val=""/></m:dPr><m:e><m:m>' +
                '<m:mPr><m:baseJc m:val="center"/><m:plcHide m:val="1"/>' +
                '<m:mcs><m:mc><m:mcPr><m:count m:val="2"/><m:mcJc m:val="left"/></m:mcPr></m:mc></m:mcs></m:mPr>' +
                `<m:mr>${e("1,")}${e("x&gt;0")}</m:mr><m:mr>${e("0,")}${e("x=0")}</m:mr></m:m></m:e></m:d>`,
        );
    });

    it("keeps the spaces of normal text in a condition", () => {
        expect(
            toXml(
                new MathCases({
                    cases: [
                        { value: [new MathRun("1,")], condition: [new MathRun({ text: "if ", normalText: true }), new MathRun("x>0")] },
                    ],
                }),
            ),
        ).toContain(
            '<m:e><m:r><m:rPr><m:nor m:val="1"/></m:rPr><m:t xml:space="preserve">if </m:t></m:r><m:r><m:t>x&gt;0</m:t></m:r></m:e>',
        );
    });

    it("writes one column when no case has a condition", () => {
        const written = toXml(new MathCases({ cases: [{ value: [new MathRun("a")] }, { value: [new MathRun("b")] }] }));
        expect(written).toContain('<m:count m:val="1"/>');
        expect(written).toContain(`<m:mr>${e("a")}</m:mr><m:mr>${e("b")}</m:mr>`);
    });

    it("gives a case with no condition an empty one when others have one", () => {
        expect(
            toXml(new MathCases({ cases: [{ value: [new MathRun("a")], condition: [new MathRun("c")] }, { value: [new MathRun("b")] }] })),
        ).toContain(`<m:mr>${e("b")}${EMPTY}</m:mr>`);
    });

    it("writes an empty value or condition with a zero-width space", () => {
        expect(toXml(new MathCases({ cases: [{ value: [], condition: [] }] }))).toContain(`<m:mr>${EMPTY}${EMPTY}</m:mr>`);
    });

    it("takes as many cases as Word allows in a matrix, and throws for more", () => {
        const cases = (count: number): readonly MathCase[] =>
            Array.from({ length: count }, (_, index) => ({ value: [new MathRun(`${index}`)] }));
        expect(toXml(new MathCases({ cases: cases(256) })).match(/<m:mr>/g)).toHaveLength(256);
        expect(() => new MathCases({ cases: cases(257) })).toThrow("MathCases: there are 257 cases, but Word allows at most 256");
    });

    it("throws for no cases", () => {
        expect(() => new MathCases({ cases: [] })).toThrow("MathCases: there are no cases. Give at least one");
    });

    it("throws for math inside math, naming the case and its part", () => {
        const math = new Math({ children: [] });
        expect(() => new MathCases({ cases: [{ value: [new MathRun("a")] }, { value: [math] }] })).toThrow(
            "MathCases: case 2's value holds a Math",
        );
        expect(() => new MathCases({ cases: [{ value: [new MathRun("a")], condition: [math] }] })).toThrow(
            "MathCases: case 1's condition holds a Math",
        );
    });

    it("holds other math", () => {
        expect(
            toXml(new MathCases({ cases: [{ value: [new MathMatrix({ brackets: "round", rows: [[[new MathRun("1")]]] })] }] })),
        ).toContain('<m:mr><m:e><m:d><m:dPr><m:begChr m:val="("/>');
    });
});
