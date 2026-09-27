import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, MathRun, MathSuperScript, TextRun } from "docx";

import { MathCases } from "./math-cases";
import { MathEquationArray, type MathEquationArrayOptions, type MathEquationArrayRow } from "./math-equation-array";

const toXml = (component: MathEquationArray | MathCases): string => xml(new Formatter().format(component));

const r = (text: string): string => `<m:r><m:t>${text}</m:t></m:r>`;
const AMP = r("&amp;");

describe("MathEquationArray", () => {
    it("writes each row as an argument, with an & between its parts and a # before its number", () => {
        expect(
            toXml(
                new MathEquationArray({
                    rows: [
                        { parts: [[new MathRun("y")], [new MathRun("=mx+b")]], equationNumber: "(1)" },
                        { parts: [[new MathRun("y′")], [new MathRun("=m")]], equationNumber: "(2)" },
                    ],
                }),
            ),
        ).toBe(
            `<m:eqArr><m:e>${r("y")}${AMP}${r("=mx+b")}${r("#")}${r("(1)")}</m:e>` +
                `<m:e>${r("y′")}${AMP}${r("=m")}${r("#")}${r("(2)")}</m:e></m:eqArr>`,
        );
    });

    it("writes a row with one part and no number as it is", () => {
        expect(toXml(new MathEquationArray({ rows: [{ parts: [[new MathRun("a"), new MathRun("b")]] }] }))).toBe(
            `<m:eqArr><m:e>${r("a")}${r("b")}</m:e></m:eqArr>`,
        );
    });

    it("starts a row that goes on from the row before with an &, from an empty first part", () => {
        const square = new MathSuperScript({ children: [new MathRun("a")], superScript: [new MathRun("2")] });
        expect(toXml(new MathEquationArray({ rows: [{ parts: [[], [new MathRun("="), square]] }] }))).toMatch(
            /^<m:eqArr><m:e><m:r><m:t>&amp;<\/m:t><\/m:r><m:r><m:t>=<\/m:t><\/m:r><m:sSup>/,
        );
    });

    it("writes every & for rows lined up at several points, as align's columns", () => {
        const row: MathEquationArrayRow = { parts: [[new MathRun("a")], [new MathRun("=b")], [new MathRun("c")], [new MathRun("=d")]] };
        expect(toXml(new MathEquationArray({ rows: [row] }))).toBe(
            `<m:eqArr><m:e>${r("a")}${AMP}${r("=b")}${AMP}${r("c")}${AMP}${r("=d")}</m:e></m:eqArr>`,
        );
    });

    it("writes an equation number on a row with one part", () => {
        expect(toXml(new MathEquationArray({ rows: [{ parts: [[new MathRun("E=mc²")]], equationNumber: "(30)" }] }))).toBe(
            `<m:eqArr><m:e>${r("E=mc²")}${r("#")}${r("(30)")}</m:e></m:eqArr>`,
        );
    });

    it("writes no # for an empty equation number", () => {
        expect(toXml(new MathEquationArray({ rows: [{ parts: [[new MathRun("a")]], equationNumber: "" }] }))).toBe(
            `<m:eqArr><m:e>${r("a")}</m:e></m:eqArr>`,
        );
    });

    it("writes an empty row with a zero-width space, which LibreOffice needs", () => {
        expect(toXml(new MathEquationArray({ rows: [{ parts: [[]] }, { parts: [[], []] }] }))).toBe(
            `<m:eqArr><m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e><m:e>${AMP}</m:e></m:eqArr>`,
        );
    });

    it("writes where the array sits on its line only when it is given", () => {
        const rows: MathEquationArrayOptions["rows"] = [{ parts: [[new MathRun("a")]] }];
        expect(toXml(new MathEquationArray({ rows, verticalAlignment: "top" }))).toMatch(
            /^<m:eqArr><m:eqArrPr><m:baseJc m:val="top"\/><\/m:eqArrPr><m:e>/,
        );
        expect(toXml(new MathEquationArray({ rows, verticalAlignment: "center" }))).toContain('<m:baseJc m:val="center"/>');
        expect(toXml(new MathEquationArray({ rows }))).not.toContain("m:eqArrPr");
    });

    it("takes as many rows as Word allows, and throws for more", () => {
        const rows = (count: number): MathEquationArrayOptions["rows"] =>
            Array.from({ length: count }, (_, index) => ({ parts: [[new MathRun(`${index}`)]] }));
        expect(toXml(new MathEquationArray({ rows: rows(64) })).match(/<m:e>/g)).toHaveLength(64);
        expect(() => new MathEquationArray({ rows: rows(65) })).toThrow("MathEquationArray: there are 65 rows, but Word allows at most 64");
    });

    it("throws for no rows, or a row with no parts", () => {
        expect(() => new MathEquationArray({ rows: [] })).toThrow("MathEquationArray: there are no rows. Give at least one");
        expect(() => new MathEquationArray({ rows: [{ parts: [[new MathRun("a")]] }, { parts: [] }] })).toThrow(
            "MathEquationArray: row 2 has no parts. Give at least one, which can be empty",
        );
    });

    it("throws for a vertical alignment it doesn't know", () => {
        expect(
            () =>
                new MathEquationArray({
                    rows: [{ parts: [[]] }],
                    verticalAlignment: "middle" as MathEquationArrayOptions["verticalAlignment"],
                }),
        ).toThrow('MathEquationArray: verticalAlignment is "middle", which isn\'t one of "top", "center", "bottom"');
    });

    it("throws for math inside math, or document text, naming the row and part", () => {
        expect(() => new MathEquationArray({ rows: [{ parts: [[new MathRun("a")], [new Math({ children: [] })]] }] })).toThrow(
            "MathEquationArray: row 1, part 2 holds a Math",
        );
        expect(() => new MathEquationArray({ rows: [{ parts: [[]] }, { parts: [[new TextRun("a")]] }] })).toThrow(
            "MathEquationArray: row 2, part 1 holds a TextRun",
        );
    });

    it("goes inside cases, and holds them", () => {
        const array = new MathEquationArray({ rows: [{ parts: [[new MathRun("a")], [new MathRun("=b")]] }] });
        expect(toXml(new MathCases({ cases: [{ value: [array] }] }))).toContain("<m:mr><m:e><m:eqArr>");
        expect(
            toXml(new MathEquationArray({ rows: [{ parts: [[new MathCases({ cases: [{ value: [new MathRun("x")] }] })]] }] })),
        ).toContain('<m:eqArr><m:e><m:d><m:dPr><m:begChr m:val="{"/>');
    });
});
