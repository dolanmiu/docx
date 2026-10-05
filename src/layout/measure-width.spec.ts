// cspell:ignore Aptos
import { describe, expect, it, vi } from "vitest";

import { measureDescent, measureLineHeight, measureTextWidth } from "../text-layout";
import { type FontToMeasure, measureWithPretext, measurerOf } from "./measure-width";

const CALIBRI: FontToMeasure = { name: "Calibri", size: 12, bold: false, italic: false };

/** Pretext's two functions, measuring each character as 6 pixels wide, with the calls made to them */
const fakePretext = (): {
    readonly prepareWithSegments: ReturnType<
        typeof vi.fn<(text: string, font: string, options: { readonly whiteSpace: "pre-wrap" }) => string>
    >;
    readonly measureNaturalWidth: ReturnType<typeof vi.fn<(prepared: string) => number>>;
} => ({
    prepareWithSegments: vi.fn((text: string) => text),
    measureNaturalWidth: vi.fn((prepared: string) => [...prepared].length * 6),
});

describe("measureWithPretext", () => {
    it("should measure text with Pretext, in the font in pixels, and give its width in points", () => {
        const pretext = fakePretext();
        const measureWidth = measureWithPretext(pretext);
        // 4 characters of 6 pixels are 24 pixels, which are 18 points
        expect(measureWidth("word", CALIBRI)).to.equal(18);
        expect(pretext.prepareWithSegments).toHaveBeenCalledWith("word", '16px "Calibri"', { whiteSpace: "pre-wrap" });
    });

    it("should keep the spaces of the text, which the layout measures on their own", () => {
        const pretext = fakePretext();
        expect(measureWithPretext(pretext)("  ", CALIBRI)).to.equal(9);
        expect(pretext.prepareWithSegments.mock.calls[0][2]).to.deep.equal({ whiteSpace: "pre-wrap" });
    });

    it("should measure bold and italic text in the bold and italic fonts", () => {
        const pretext = fakePretext();
        const measureWidth = measureWithPretext(pretext);
        measureWidth("a", { ...CALIBRI, bold: true });
        measureWidth("a", { ...CALIBRI, italic: true });
        measureWidth("a", { ...CALIBRI, bold: true, italic: true, size: 10.5 });
        expect(pretext.prepareWithSegments.mock.calls.map(([, font]) => font)).to.deep.equal([
            'bold 16px "Calibri"',
            'italic 16px "Calibri"',
            'italic bold 14px "Calibri"',
        ]);
    });

    it("should measure a font with the family it is given, and quote the names of the others", () => {
        const pretext = fakePretext();
        const measureWidth = measureWithPretext(pretext, { fontFamilies: { Calibri: "Carlito, sans-serif" } });
        measureWidth("a", CALIBRI);
        measureWidth("a", { ...CALIBRI, name: 'Odd "Font" \\ Name' });
        // A name that is a property of every object is a font like any other
        measureWidth("a", { ...CALIBRI, name: "constructor" });
        expect(pretext.prepareWithSegments.mock.calls.map(([, font]) => font)).to.deep.equal([
            "16px Carlito, sans-serif",
            '16px "Odd \\"Font\\" \\\\ Name"',
            '16px "constructor"',
        ]);
    });

    it("should prepare each text in each font once", () => {
        const pretext = fakePretext();
        const measureWidth = measureWithPretext(pretext);
        expect([
            measureWidth("word", CALIBRI),
            measureWidth("word", CALIBRI),
            measureWidth("word", { ...CALIBRI, size: 24 }),
        ]).to.deep.equal([18, 18, 18]);
        expect(pretext.prepareWithSegments).toHaveBeenCalledTimes(2);
        expect(pretext.measureNaturalWidth).toHaveBeenCalledTimes(2);
    });
});

describe("measurerOf", () => {
    it("should measure text in the font it is in, Times New Roman at 10 points when it isn't given, as Word does", () => {
        const measureWidth = vi.fn((text: string, { size }: FontToMeasure) => text.length * size);
        const measurer = measurerOf(measureWidth);
        expect(measurer.measureWidth("ab", {})).to.equal(20);
        expect(measureWidth).toHaveBeenLastCalledWith("ab", { name: "Times New Roman", size: 10, bold: false, italic: false });
        measurer.measureWidth("ab", { font: "Arial", size: 12, bold: true, italic: true });
        expect(measureWidth).toHaveBeenLastCalledWith("ab", { name: "Arial", size: 12, bold: true, italic: true });
    });

    it("should add the space between characters and scale the text, as the document's formatting says", () => {
        const measurer = measurerOf((text) => text.length * 5);
        // Text the function measures as 15 points, at 150%, and a point after each of its 2 characters
        expect(measurer.measureWidth("a😀", { characterSpacing: 1, scale: 150 })).to.equal(3 * 5 * 1.5 + 2);
    });

    it("should measure a tab typed in the text as the width tables do, moving to the next half inch, without measuring it", () => {
        const measureWidth = vi.fn((text: string) => text.length * 10);
        const measurer = measurerOf(measureWidth);
        const font = { font: "Calibri", size: 11, characterSpacing: 1 };
        // "Item 1" is 66 points, the tab moves to 72, "a" is 11 more and the tab after it moves to 108
        expect(measurer.measureWidth("Item 1\ta\t", font)).to.equal(108);
        expect(measureWidth.mock.calls.map(([text]) => text)).to.deep.equal(["Item 1", "a"]);
        expect(measurer.measureWidth("\tab", font)).to.equal(measureTextWidth("\t", font) + 22);
    });

    it("should make lines as tall as Word makes them, and as deep below their baselines, from the width tables", () => {
        const measurer = measurerOf(() => 0);
        expect(measurer.measureLineHeight({ font: "Calibri", size: 11 })).to.equal(measureLineHeight({ font: "Calibri", size: 11 }));
        expect(measurer.measureDescent({ font: "Courier New", size: 11 })).to.equal(measureDescent({ font: "Courier New", size: 11 }));
    });

    it("should not know the height of the lines of a font that isn't in the width tables, whatever its text", () => {
        const measurer = measurerOf(() => 0);
        expect(measurer.unknownFont!({ font: "Calibri" }, "a")).to.equal(false);
        expect(measurer.unknownFont!({ font: "Carlito" })).to.equal(false);
        expect(measurer.unknownFont!({ font: "Roboto" }, "a")).to.equal(true);
        // An East Asian font's lines are as tall as the table says, and the function measures its Latin letters
        expect(measurer.unknownFont!({ font: "Yu Gothic" }, "a")).to.equal(false);
    });
});
