/**
 * Sizes shapes to fit their text: reads the text and fonts of a shape's paragraphs, and finds the width or height
 * at which the text fits inside the shape's text box. Not part of the public API.
 *
 * @module
 */
import { AlignmentType, type IMediaTransformation, Paragraph, TextRun } from "docx";

import { type CustomGeometryOptions, getCustomTextRectangle } from "./custom-geometry";
import { type PresetShapeType, type ShapeTextOptions, createShapeGuides } from "./preset-shape";
import { type ShapePercentage, percentageOf } from "./shape-floating";
import { type TextStyles, WORD_DEFAULT_STYLES, hasDefaultParagraphSpacing, readTextParagraphs } from "./shape-text-styles";
import { getTextRectangle, measureText } from "./text-metrics";

/**
 * A size in pixels, `"fitText"` to fit the shape's text, or a percentage, such as `"100%"`, for a floating shape: a
 * percentage of the space between the page's margins, or of what `floating.sizeRelativeTo` gives.
 *
 * @publicApi
 */
export type ShapeSize = number | "fitText" | ShapePercentage;

/**
 * A shape's size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape.
 *
 * @publicApi
 */
export type ShapeTransformation = Omit<IMediaTransformation, "width" | "height"> & {
    /**
     * Width in pixels, `"fitText"` for as wide as the longest line of the shape's text, or a percentage of the space
     * between the margins for a floating shape, such as `"100%"`
     */
    readonly width: ShapeSize;
    /** Height in pixels, `"fitText"` for as tall as the shape's text, wrapped at the shape's width, or a percentage for a floating shape */
    readonly height: ShapeSize;
};

const EMUS_PER_PIXEL = 9525;
const POINTS_PER_PIXEL = 0.75;
// Word's default text margins, in points
const DEFAULT_MARGINS = { top: 3.6, right: 7.2, bottom: 3.6, left: 7.2 };
// Room for the difference between the estimate and how Word lays the text out, in pixels
const FIT_ALLOWANCE = 2;

/**
 * Creates the paragraphs for a shape's `text`: one centred paragraph for each line. When the document's paragraphs
 * have space before or after them, these don't, so the text stays in the middle of the shape.
 */
export const createTextParagraphs = (text: string, styles: TextStyles = WORD_DEFAULT_STYLES): readonly Paragraph[] => {
    const spacing = hasDefaultParagraphSpacing(styles) ? { before: 0, after: 0 } : undefined;
    return text.split("\n").map((line) => new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [new TextRun(line)] }));
};

/**
 * What a shape needs to be sized to fit its text.
 */
export type TextSizingOptions = CustomGeometryOptions & {
    readonly type: PresetShapeType | "custom";
    /** The shape's adjustments, by their readable names */
    readonly adjustments?: Readonly<Record<string, number | undefined>>;
    readonly transformation: ShapeTransformation;
    readonly text?: string;
    readonly children?: readonly Paragraph[];
    readonly textOptions?: ShapeTextOptions;
};

/**
 * Finds the length of a shape's side at which its text box is `needed` long. Most text boxes are a fixed part of the
 * shape, or the shape less a fixed length, so this settles in a few steps.
 */
const solveLength = (needed: number, textLength: (length: number) => number): number => {
    let length = Math.max(needed, 1);
    for (let step = 0; step < 10; step++) {
        const current = textLength(length);
        if (Math.abs(current - needed) < 0.01) {
            break;
        }
        length = current > 0 ? length * (needed / current) : length + needed;
    }
    return length;
};

/**
 * A size in pixels, or `"fitText"`: a percentage becomes the pixels it is of `base`.
 *
 * @throws If the size is a percentage and there is nothing it can be a percentage of
 */
const resolvePercentage = (size: ShapeSize, option: string, base?: number): number | "fitText" => {
    const percentage = size === "fitText" ? undefined : percentageOf(size, option);
    if (percentage === undefined) {
        return size as number | "fitText";
    }
    if (base === undefined) {
        throw new Error(`Invalid ${option} "${size}". Only a floating shape can be a percentage of the page`);
    }
    return (base * percentage) / 100;
};

/**
 * Works out a shape's width or height when it is `"fitText"`, from its text, the document's styles, and the shape's
 * margins and text box. The size is an estimate: text is measured with the widths of common fonts.
 *
 * @param styles - The document's styles. Default is Word's own defaults
 * @param percentageBase - What a percentage width and height are percentages of, in pixels. Without it, a size can't be a percentage
 * @returns The transformation with both sizes in pixels
 * @throws If a size is a percentage without a `percentageBase`
 */
export const resolveShapeSize = (
    options: TextSizingOptions,
    styles: TextStyles = WORD_DEFAULT_STYLES,
    percentageBase?: { readonly width: number; readonly height: number },
): IMediaTransformation => {
    const transformation = {
        ...options.transformation,
        width: resolvePercentage(options.transformation.width, "width", percentageBase?.width),
        height: resolvePercentage(options.transformation.height, "height", percentageBase?.height),
    };
    if (transformation.width !== "fitText" && transformation.height !== "fitText") {
        return { ...transformation, width: transformation.width, height: transformation.height };
    }

    const written = [...(options.text === undefined ? [] : createTextParagraphs(options.text, styles)), ...(options.children ?? [])];
    // A shape without text is as tall as an empty paragraph
    const paragraphs = readTextParagraphs(written.length > 0 ? written : [new Paragraph({})], styles);
    const { textOptions = {} } = options;
    const guides = options.type === "custom" ? undefined : createShapeGuides(options.type, options.adjustments);
    const margins = { ...DEFAULT_MARGINS, ...textOptions.margins };
    // Text that runs up or down the shape is measured across the shape's height
    const turned = textOptions.direction !== undefined && textOptions.direction !== "horizontal";
    const across = turned ? transformation.height : transformation.width;
    const along = turned ? transformation.width : transformation.height;

    // The text box's length across and along the text, in pixels, for a shape of the given size
    const textBox = (acrossSize: number, alongSize: number): { readonly across: number; readonly along: number } => {
        const [width, height] = turned ? [alongSize, acrossSize] : [acrossSize, alongSize];
        const box =
            options.type === "custom"
                ? getCustomTextRectangle(options, width * EMUS_PER_PIXEL, height * EMUS_PER_PIXEL)
                : getTextRectangle(options.type, width * EMUS_PER_PIXEL, height * EMUS_PER_PIXEL, guides);
        const size = { width: (box.right - box.left) / EMUS_PER_PIXEL, height: (box.bottom - box.top) / EMUS_PER_PIXEL };
        return turned ? { across: size.height, along: size.width } : { across: size.width, along: size.height };
    };
    const acrossMargins = (turned ? margins.top + margins.bottom : margins.left + margins.right) / POINTS_PER_PIXEL;
    const alongMargins = (turned ? margins.left + margins.right : margins.top + margins.bottom) / POINTS_PER_PIXEL;

    // Unwrapped text, for a fitted width, and a first guess at the length along the text
    const natural = measureText(paragraphs);
    const guessAlong = typeof along === "number" ? along : natural.height / POINTS_PER_PIXEL + alongMargins;
    const acrossLength =
        across === "fitText"
            ? Math.ceil(
                  solveLength(
                      natural.width / POINTS_PER_PIXEL + acrossMargins + FIT_ALLOWANCE,
                      (length) => textBox(length, guessAlong).across,
                  ),
              )
            : across;

    // The text wraps at the text box's width, less its margins, unless wrapping is turned off
    const wrapWidth = textOptions.wrap === false ? undefined : Math.max(0, textBox(acrossLength, guessAlong).across - acrossMargins);
    const alongLength =
        along === "fitText"
            ? Math.ceil(
                  solveLength(
                      measureText(paragraphs, wrapWidth === undefined ? undefined : wrapWidth * POINTS_PER_PIXEL).height /
                          POINTS_PER_PIXEL +
                          alongMargins,
                      (length) => textBox(acrossLength, length).along,
                  ),
              )
            : along;

    return {
        ...transformation,
        width: turned ? alongLength : acrossLength,
        height: turned ? acrossLength : alongLength,
    };
};
