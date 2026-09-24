/**
 * Sizes shapes to fit their text: reads the text and fonts of a shape's paragraphs, and finds the width or height
 * at which the text fits inside the shape's text box. Not part of the public API.
 *
 * @module
 */
import { AlignmentType, ExternalHyperlink, type IContext, type IMediaTransformation, Paragraph, Run, TextRun, XmlComponent } from "docx";

import { type PresetShapeType, type ShapeTextOptions, createShapeGuides } from "./preset-shape";
import { type TextSpan, getTextRectangle, measureLineHeight, measureText } from "./text-metrics";

/**
 * A size in pixels, or `"fitText"` to fit the shape's text.
 *
 * @publicApi
 */
export type ShapeSize = number | "fitText";

/**
 * A shape's size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape.
 *
 * @publicApi
 */
export type ShapeTransformation = Omit<IMediaTransformation, "width" | "height"> & {
    /** Width in pixels, or `"fitText"` for as wide as the longest line of the shape's text */
    readonly width: ShapeSize;
    /** Height in pixels, or `"fitText"` for as tall as the shape's text, wrapped at the shape's width */
    readonly height: ShapeSize;
};

type XmlObject = Readonly<Record<string, unknown>>;

const EMUS_PER_PIXEL = 9525;
const POINTS_PER_PIXEL = 0.75;
// Word's default text margins, in points
const DEFAULT_MARGINS = { top: 3.6, right: 7.2, bottom: 3.6, left: 7.2 };
// Room for the difference between the estimate and how Word lays the text out, in pixels
const FIT_ALLOWANCE = 2;

// XmlComponent keeps its children in a protected array. Measuring reads it, and doesn't change it
const childrenOf = (component: XmlComponent): readonly unknown[] => (component as unknown as { readonly root: readonly unknown[] }).root;

const valueOf = (children: readonly XmlObject[], name: string): XmlObject | undefined =>
    children.find((child) => name in child)?.[name] as XmlObject | undefined;

const attributesOf = (element: XmlObject | undefined): XmlObject => (element?._attr ?? {}) as XmlObject;

/**
 * The text and font of a text run, read from its XML. Tabs are `"\t"` and line breaks `"\n"`.
 */
const spanOf = (run: TextRun): TextSpan => {
    // Formatting a run needs no document, as long as it has no fields or other parts that refer to one
    const xml = run.prepForXml({ stack: [] } as unknown as IContext) as { readonly "w:r": readonly XmlObject[] };
    const children = xml["w:r"];
    const properties = (valueOf(children, "w:rPr") ?? []) as readonly XmlObject[];
    const fonts = attributesOf(valueOf(properties, "w:rFonts"));
    const size = attributesOf(valueOf(properties, "w:sz"))["w:val"];
    const bold = valueOf(properties, "w:b");
    const text = children
        .map((child) => {
            if ("w:t" in child) {
                return (child["w:t"] as readonly unknown[]).filter((part) => typeof part === "string").join("");
            }
            if ("w:tab" in child) {
                return "\t";
            }
            return "w:br" in child || "w:cr" in child ? "\n" : "";
        })
        .join("");
    return {
        text: valueOf(properties, "w:caps") ? text.toUpperCase() : text,
        font: (fonts["w:ascii"] ?? fonts["w:hAnsi"]) as string | undefined,
        size: typeof size === "number" ? size / 2 : undefined,
        bold: bold === undefined ? undefined : attributesOf(bold)["w:val"] !== false,
    };
};

/**
 * The text runs in a paragraph, including those in hyperlinks. Pictures, shapes and other runs without text are left out.
 */
const spansIn = (children: readonly unknown[]): readonly TextSpan[] =>
    children.flatMap((child): readonly TextSpan[] => {
        if (child instanceof TextRun) {
            return [spanOf(child)];
        }
        if (child instanceof ExternalHyperlink) {
            return spansIn(child.options.children);
        }
        return child instanceof XmlComponent && !(child instanceof Run) ? spansIn(childrenOf(child)) : [];
    });

/**
 * Creates the paragraphs for a shape's `text`: one centred paragraph for each line.
 */
export const createTextParagraphs = (text: string): readonly Paragraph[] =>
    text.split("\n").map((line) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(line)] }));

/**
 * The text of a shape's paragraphs, with the font of each run. Styles aren't known when a shape is created, so text
 * without a font or size of its own is measured in Word's defaults.
 */
export const getParagraphSpans = (paragraphs: readonly Paragraph[]): readonly (readonly TextSpan[])[] =>
    paragraphs.map((paragraph) => spansIn(childrenOf(paragraph)));

/**
 * What a shape needs to be sized to fit its text.
 */
export type TextSizingOptions = {
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
 * Works out a shape's width or height when it is `"fitText"`, from its text, font, margins and text box.
 * The size is an estimate: text is measured with the widths of common fonts, without the document's styles.
 *
 * @returns The transformation with both sizes in pixels
 */
export const resolveShapeSize = (options: TextSizingOptions): IMediaTransformation => {
    const { transformation } = options;
    if (transformation.width !== "fitText" && transformation.height !== "fitText") {
        return { ...transformation, width: transformation.width, height: transformation.height };
    }

    const paragraphs = getParagraphSpans([
        ...(options.text === undefined ? [] : createTextParagraphs(options.text)),
        ...(options.children ?? []),
    ]);
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
        const box = getTextRectangle(options.type, width * EMUS_PER_PIXEL, height * EMUS_PER_PIXEL, guides);
        const size = { width: (box.right - box.left) / EMUS_PER_PIXEL, height: (box.bottom - box.top) / EMUS_PER_PIXEL };
        return turned ? { across: size.height, along: size.width } : { across: size.width, along: size.height };
    };
    const acrossMargins = (turned ? margins.top + margins.bottom : margins.left + margins.right) / POINTS_PER_PIXEL;
    const alongMargins = (turned ? margins.left + margins.right : margins.top + margins.bottom) / POINTS_PER_PIXEL;

    // Unwrapped text, for a fitted width, and a first guess at the length along the text
    const natural = measureText(paragraphs);
    const lineHeight = measureLineHeight() / POINTS_PER_PIXEL;
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
                      Math.max(
                          measureText(paragraphs, wrapWidth === undefined ? undefined : wrapWidth * POINTS_PER_PIXEL).height /
                              POINTS_PER_PIXEL,
                          lineHeight,
                      ) + alongMargins,
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
