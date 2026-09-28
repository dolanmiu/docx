import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "./math-run";

describe("MathRun", () => {
    describe("#constructor()", () => {
        it("should create a MathRun with correct root key", () => {
            const mathRun = new MathRun("2+2");
            const tree = new Formatter().format(mathRun);
            expect(tree).to.deep.equal({
                "m:r": [
                    {
                        "m:t": ["2+2"],
                    },
                ],
            });
        });

        it("takes its text in options too", () => {
            expect(new Formatter().format(new MathRun({ text: "2+2" }))).to.deep.equal({ "m:r": [{ "m:t": ["2+2"] }] });
            expect(new Formatter().format(new MathRun({ text: "2+2", normalText: false }))).to.deep.equal({ "m:r": [{ "m:t": ["2+2"] }] });
        });

        it("writes normal text with m:nor, keeping its spaces", () => {
            const tree = new Formatter().format(new MathRun({ text: "if ", normalText: true }));
            expect(tree).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:nor": { _attr: { "m:val": 1 } } }] }, { "m:t": [{ _attr: { "xml:space": "preserve" } }, "if "] }],
            });
        });

        it("writes a style and an alphabet with m:sty and m:scr, the alphabet first", () => {
            expect(new Formatter().format(new MathRun({ text: "R", style: "plain", script: "doubleStruck" }))).to.deep.equal({
                "m:r": [
                    { "m:rPr": [{ "m:scr": { _attr: { "m:val": "double-struck" } } }, { "m:sty": { _attr: { "m:val": "p" } } }] },
                    { "m:t": ["R"] },
                ],
            });
        });

        it.each([
            ["plain", "p"],
            ["bold", "b"],
            ["italic", "i"],
            ["boldItalic", "bi"],
        ] as const)("writes the %s style as %s", (style, value) => {
            expect(new Formatter().format(new MathRun({ text: "x", style }))).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:sty": { _attr: { "m:val": value } } }] }, { "m:t": ["x"] }],
            });
        });

        it.each([
            ["script", "script"],
            ["fraktur", "fraktur"],
            ["doubleStruck", "double-struck"],
            ["sansSerif", "sans-serif"],
            ["monospace", "monospace"],
        ] as const)("writes the %s alphabet as %s, upright unless given a style, as LaTeX draws it", (script, value) => {
            expect(new Formatter().format(new MathRun({ text: "A", script }))).to.deep.equal({
                "m:r": [
                    { "m:rPr": [{ "m:scr": { _attr: { "m:val": value } } }, { "m:sty": { _attr: { "m:val": "p" } } }] },
                    { "m:t": ["A"] },
                ],
            });
        });

        it("writes the roman alphabet with no style, leaving Word's italic letters", () => {
            expect(new Formatter().format(new MathRun({ text: "A", script: "roman" }))).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:scr": { _attr: { "m:val": "roman" } } }] }, { "m:t": ["A"] }],
            });
        });

        it("keeps a style given with an alphabet, such as italic sans-serif", () => {
            expect(new Formatter().format(new MathRun({ text: "A", script: "sansSerif", style: "italic" }))).to.deep.equal({
                "m:r": [
                    { "m:rPr": [{ "m:scr": { _attr: { "m:val": "sans-serif" } } }, { "m:sty": { _attr: { "m:val": "i" } } }] },
                    { "m:t": ["A"] },
                ],
            });
        });

        it("writes literal text with m:lit, before normal text", () => {
            expect(new Formatter().format(new MathRun({ text: "&", literal: true, normalText: true }))).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:lit": { _attr: { "m:val": 1 } } }, { "m:nor": { _attr: { "m:val": 1 } } }] }, { "m:t": ["&"] }],
            });
            expect(new Formatter().format(new MathRun({ text: "&", literal: true, style: "bold" }))).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:lit": { _attr: { "m:val": 1 } } }, { "m:sty": { _attr: { "m:val": "b" } } }] }, { "m:t": ["&"] }],
            });
        });

        it("throws for normal text with a style or an alphabet, which the schema doesn't allow together", () => {
            expect(() => new MathRun({ text: "if", normalText: true, style: "bold" })).toThrow(
                "MathRun: normalText can't be given with style or script",
            );
            expect(() => new MathRun({ text: "if", normalText: true, script: "script" })).toThrow(
                "MathRun: normalText can't be given with style or script",
            );
        });

        it("throws for a style or an alphabet it doesn't know, for code that isn't type checked", () => {
            // @ts-expect-error -- not a style
            expect(() => new MathRun({ text: "x", style: "p" })).toThrow(
                'MathRun: style is "p", which isn\'t one of plain, bold, italic, boldItalic',
            );
            // @ts-expect-error -- not a style, though every object has it
            expect(() => new MathRun({ text: "x", style: "toString" })).toThrow('MathRun: style is "toString"');
            // @ts-expect-error -- not an alphabet
            expect(() => new MathRun({ text: "x", script: "double-struck" })).toThrow(
                'MathRun: script is "double-struck", which isn\'t one of roman, script, fraktur, doubleStruck, sansSerif, monospace',
            );
        });
    });
});
