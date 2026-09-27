import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Math, type MathComponent, MathFraction, MathRun } from "docx";

import { type MathColumnAlignment, MathMatrix, type MathMatrixBrackets, type MathMatrixOptions } from "./math-matrix";

const toXml = (component: MathMatrix | MathFraction): string => xml(new Formatter().format(component));

const cell = (text: string): readonly MathComponent[] => [new MathRun(text)];
const e = (text: string): string => `<m:e><m:r><m:t>${text}</m:t></m:r></m:e>`;
const EMPTY = '<m:e><m:r><m:t xml:space="preserve">\u200B</m:t></m:r></m:e>';
const grid = (rows: number, columns: number): MathMatrixOptions["rows"] =>
    Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (__, column) => cell(`${row},${column}`)));

describe("MathMatrix", () => {
    it("writes rows of cells, with its properties: centred, placeholders hidden, and one alignment for its columns", () => {
        expect(
            toXml(
                new MathMatrix({
                    rows: [
                        [cell("1"), cell("2")],
                        [cell("3"), cell("4")],
                    ],
                }),
            ),
        ).toBe(
            '<m:m><m:mPr><m:baseJc m:val="center"/><m:plcHide m:val="1"/>' +
                '<m:mcs><m:mc><m:mcPr><m:count m:val="2"/><m:mcJc m:val="center"/></m:mcPr></m:mc></m:mcs></m:mPr>' +
                `<m:mr>${e("1")}${e("2")}</m:mr><m:mr>${e("3")}${e("4")}</m:mr></m:m>`,
        );
    });

    it("writes a 1×1 matrix", () => {
        expect(toXml(new MathMatrix({ rows: [[cell("x")]] }))).toContain(`<m:count m:val="1"/>`);
        expect(toXml(new MathMatrix({ rows: [[cell("x")]] }))).toContain(`<m:mr>${e("x")}</m:mr></m:m>`);
    });

    const brackets: readonly (readonly [MathMatrixBrackets, string, string])[] = [
        ["round", "(", ")"],
        ["square", "[", "]"],
        ["curly", "{", "}"],
        ["angled", "⟨", "⟩"],
        ["verticalBars", "|", "|"],
        ["doubleVerticalBars", "‖", "‖"],
    ];
    it.each(brackets)("writes %s brackets around the matrix as UnicodeMath's characters", (type, open, close) => {
        const written = toXml(new MathMatrix({ brackets: type, rows: [[cell("1")]] }));
        expect(written).toMatch(new RegExp(`^<m:d><m:dPr><m:begChr m:val="\\${open}"/><m:endChr m:val="\\${close}"/></m:dPr><m:e><m:m>`));
        expect(written).toMatch(/<\/m:m><\/m:e><\/m:d>$/);
    });

    it("writes no brackets for none", () => {
        expect(toXml(new MathMatrix({ brackets: "none", rows: [[cell("1")]] }))).toMatch(/^<m:m>/);
    });

    it("gives shorter rows empty cells, each with a zero-width space, which LibreOffice needs", () => {
        const written = toXml(new MathMatrix({ rows: [[cell("1"), cell("2"), cell("3")], [cell("4")], []] }));
        expect(written).toContain(`<m:mr>${e("4")}${EMPTY}${EMPTY}</m:mr><m:mr>${EMPTY}${EMPTY}${EMPTY}</m:mr>`);
        expect(written).toContain('<m:count m:val="3"/>');
    });

    it("writes an empty cell given as an empty list with a zero-width space", () => {
        expect(toXml(new MathMatrix({ rows: [[cell("1"), []]] }))).toContain(`<m:mr>${e("1")}${EMPTY}</m:mr>`);
    });

    it("groups columns side by side with the same alignment", () => {
        const written = toXml(new MathMatrix({ rows: [grid(1, 5)[0]], columnAlignment: ["left", "left", "right", "center", "center"] }));
        expect(written).toContain(
            '<m:mcs><m:mc><m:mcPr><m:count m:val="2"/><m:mcJc m:val="left"/></m:mcPr></m:mc>' +
                '<m:mc><m:mcPr><m:count m:val="1"/><m:mcJc m:val="right"/></m:mcPr></m:mc>' +
                '<m:mc><m:mcPr><m:count m:val="2"/><m:mcJc m:val="center"/></m:mcPr></m:mc></m:mcs>',
        );
    });

    it("gives every column one alignment", () => {
        expect(toXml(new MathMatrix({ rows: grid(2, 3), columnAlignment: "right" }))).toContain(
            '<m:mcs><m:mc><m:mcPr><m:count m:val="3"/><m:mcJc m:val="right"/></m:mcPr></m:mc></m:mcs>',
        );
    });

    it("alternates alignments column by column", () => {
        const alignments: readonly MathColumnAlignment[] = ["right", "left", "right", "left"];
        expect(toXml(new MathMatrix({ rows: grid(1, 4), columnAlignment: alignments })).match(/<m:mc>/g)).toHaveLength(4);
    });

    it("sits on its line as verticalAlignment says", () => {
        expect(toXml(new MathMatrix({ rows: grid(1, 1), verticalAlignment: "top" }))).toContain('<m:baseJc m:val="top"/>');
        expect(toXml(new MathMatrix({ rows: grid(1, 1), verticalAlignment: "bottom" }))).toContain('<m:baseJc m:val="bottom"/>');
    });

    it("writes Word's largest matrix: 256 rows of 64 cells", () => {
        const written = toXml(new MathMatrix({ rows: grid(256, 64) }));
        expect(written.match(/<m:mr>/g)).toHaveLength(256);
        expect(written.match(/<m:e>/g)).toHaveLength(256 * 64);
        expect(written).toContain('<m:count m:val="64"/>');
    });

    it("throws for more rows or cells than Word allows", () => {
        expect(() => new MathMatrix({ rows: grid(257, 1) })).toThrow("MathMatrix: there are 257 rows, but Word allows at most 256");
        expect(() => new MathMatrix({ rows: [[], grid(1, 65)[0]] })).toThrow("MathMatrix: a row has 65 cells, but Word allows at most 64");
    });

    it("throws for no rows, or no cells", () => {
        expect(() => new MathMatrix({ rows: [] })).toThrow("MathMatrix: there are no rows. Give at least one");
        expect(() => new MathMatrix({ rows: [[], []] })).toThrow("MathMatrix: every row is empty. Give at least one cell");
    });

    it("throws unless there is one column alignment for each column", () => {
        expect(() => new MathMatrix({ rows: grid(2, 3), columnAlignment: ["left", "right"] })).toThrow(
            "MathMatrix: columnAlignment has 2 alignments, but the rows have 3 columns. Give one for each",
        );
        expect(() => new MathMatrix({ rows: grid(2, 1), columnAlignment: ["left", "right"] })).toThrow(
            "MathMatrix: columnAlignment has 2 alignments, but the rows have 1 column. Give one for each",
        );
        expect(() => new MathMatrix({ rows: grid(1, 1), columnAlignment: [] })).toThrow(
            "columnAlignment has 0 alignments, but the rows have 1 column",
        );
    });

    it("throws for values it doesn't know, from code that isn't type checked", () => {
        expect(() => new MathMatrix({ rows: grid(1, 1), brackets: "pointy" as MathMatrixBrackets })).toThrow(
            'MathMatrix: brackets is "pointy", which isn\'t one of "none", "round", "square", "curly", "angled", "verticalBars", "doubleVerticalBars"',
        );
        expect(() => new MathMatrix({ rows: grid(1, 2), columnAlignment: ["left", "middle" as MathColumnAlignment] })).toThrow(
            'MathMatrix: columnAlignment is "middle", which isn\'t one of "left", "center", "right"',
        );
        expect(() => new MathMatrix({ rows: grid(1, 1), verticalAlignment: "baseline" as MathMatrixOptions["verticalAlignment"] })).toThrow(
            'MathMatrix: verticalAlignment is "baseline", which isn\'t one of "top", "center", "bottom"',
        );
    });

    it("throws for math inside math in a cell, naming the cell", () => {
        expect(() => new MathMatrix({ rows: [[cell("1")], [cell("2"), [new Math({ children: [] })]]] })).toThrow(
            "MathMatrix: row 2, cell 2 holds a Math",
        );
    });

    it("holds other math, matrices included, and goes inside it", () => {
        const inner = new MathMatrix({ brackets: "square", rows: grid(2, 2) });
        expect(toXml(new MathMatrix({ brackets: "round", rows: [[[inner], cell("x")]] }))).toContain(
            '<m:mr><m:e><m:d><m:dPr><m:begChr m:val="["/>',
        );
        expect(toXml(new MathFraction({ numerator: [inner], denominator: cell("2") }))).toContain("<m:num><m:d>");
    });
});
