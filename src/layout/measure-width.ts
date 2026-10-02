/**
 * Measuring text with other widths than those of the width tables, such as with the fonts a browser has, through
 * Pretext.
 *
 * @module
 */
// cspell:ignore chenglou
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, type TextMeasurer, measureDescent, measureLineHeight } from "../text-layout";

/**
 * The font to measure text in.
 *
 * @publicApi
 */
export type FontToMeasure = {
    /** The font's name, as the document gives it, such as `"Calibri"` */
    readonly name: string;
    /** Size in points */
    readonly size: number;
    readonly bold: boolean;
    readonly italic: boolean;
};

/**
 * Measures how wide text is in a font, in points. The text is a word, part of one, or the spaces between words, with no
 * tabs or line breaks: the layout places those itself, at the paragraph's tab stops, as Word does. It adds the space
 * between characters and the width of scaled text, which the document's formatting gives, to what this measures.
 *
 * @publicApi
 */
export type MeasureWidth = (text: string, font: FontToMeasure) => number;

/**
 * The functions of Pretext (`@chenglou/pretext`) that {@link measureWithPretext} uses. The module itself is one:
 * `import * as pretext from "@chenglou/pretext"`.
 *
 * @publicApi
 */
export type Pretext<Prepared> = {
    readonly prepareWithSegments: (text: string, font: string, options: { readonly whiteSpace: "pre-wrap" }) => Prepared;
    readonly measureNaturalWidth: (prepared: Prepared) => number;
};

/**
 * @publicApi
 */
export type PretextOptions = {
    /**
     * The CSS font families to measure each of the document's fonts with, by the name the document gives the font, such
     * as `{ Calibri: "Carlito, sans-serif" }` for a page that has Carlito, which is as wide as Calibri, but not Calibri.
     * A font not in it is measured with the font of its own name, or the browser's default font if the page doesn't
     * have it.
     */
    readonly fontFamilies?: Readonly<Record<string, string>>;
};

// CSS pixels in a point
const PIXELS_PER_POINT = 96 / 72;
// Half an inch, in points
const TAB_STOP = 36;

/** A font's name as a CSS font family, in quotes */
const quoted = (name: string): string => `"${name.replace(/["\\]/g, "\\$&")}"`;

/**
 * Measures text with Pretext, in the fonts the page has, for laying out a document's pages in a browser. Pretext needs
 * a canvas to measure with, an `OffscreenCanvas` or a page's, so it doesn't work in Node.
 *
 * Load the fonts first, such as with `document.fonts.load("11pt Calibri")`: until a font has loaded, the browser
 * measures text in another, and Pretext keeps the widths it measured.
 *
 * ```ts
 * import * as pretext from "@chenglou/pretext";
 * import { estimatePageNumbersWith, measureWithPretext } from "docx/layout";
 *
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * ```
 *
 * @param pretext - Pretext's module, or the two functions of it that are used
 * @publicApi
 */
export const measureWithPretext = <Prepared>(
    { prepareWithSegments, measureNaturalWidth }: Pretext<Prepared>,
    { fontFamilies = {} }: PretextOptions = {},
): MeasureWidth => {
    const families = new Map(Object.entries(fontFamilies));
    // The same words are measured again and again, and Pretext prepares the text each time
    const widths = new Map<string, number>();
    return (text, { name, size, bold, italic }) => {
        const family = families.get(name) ?? quoted(name);
        const font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size * PIXELS_PER_POINT}px ${family}`;
        const key = `${font}\n${text}`;
        const known = widths.get(key);
        if (known !== undefined) {
            return known;
        }
        // Spaces are kept as they are, rather than collapsed or left out at the ends of the text as CSS does
        const width = measureNaturalWidth(prepareWithSegments(text, font, { whiteSpace: "pre-wrap" })) / PIXELS_PER_POINT;
        // eslint-disable-next-line functional/immutable-data
        widths.set(key, width);
        return width;
    };
};

/**
 * A measurer that measures widths with a function, and lines' heights and descents with the width tables, as Word works
 * them out from the font's height and the paragraph's spacing.
 */
export const measurerOf = (measureWidth: MeasureWidth): TextMeasurer => ({
    measureWidth: (
        text,
        { font = DEFAULT_FONT, size = DEFAULT_FONT_SIZE, bold = false, italic = false, characterSpacing = 0, scale = 100 },
    ) => {
        const widthOf = (part: string): number =>
            part.length === 0
                ? 0
                : (measureWidth(part, { name: font, size, bold, italic }) * scale) / 100 + characterSpacing * [...part].length;
        // A tab typed in the text, rather than written as a tab, moves to the next half inch from the start of the text, as
        // the width tables measure it
        return text
            .split("\t")
            .reduce((position, part, index) => (index === 0 ? 0 : (Math.floor(position / TAB_STOP) + 1) * TAB_STOP) + widthOf(part), 0);
    },
    measureLineHeight,
    measureDescent,
});
