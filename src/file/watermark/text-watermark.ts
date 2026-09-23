/**
 * Text watermark module for WordprocessingML documents.
 *
 * A text watermark is faint text, such as "DRAFT" or "CONFIDENTIAL", drawn behind
 * the content of every page. Word implements it as a WordArt shape placed in the
 * page header, and this module produces the same markup.
 *
 * Reference: https://support.microsoft.com/en-us/office/insert-a-watermark-c0ec3d5a-6f3e-4f3c-a8b0-9d9a6f56d3fd
 *
 * @module
 */
import {
    WORD_ART_SHAPE_TYPE_ID,
    createPict,
    createVmlFill,
    createVmlShape,
    createVmlTextPath,
    createWordArtShapeType,
    vmlColorValue,
} from "@file/vml";
import { XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import { createWatermarkShapeStyle } from "./watermark-shape-style";

/**
 * Prefix Word gives to text watermark shapes. Word's "Remove Watermark"
 * command finds watermarks by this prefix.
 */
const TEXT_WATERMARK_ID_PREFIX = "PowerPlusWaterMarkObject";

/** Word's default watermark font. */
const DEFAULT_FONT = "Calibri";

/** Word's default watermark colour. */
const DEFAULT_COLOR = "silver";

/** Word's default "semitransparent" watermark opacity. */
const DEFAULT_OPACITY = 0.5;

/** Width Word gives an automatically sized watermark, in points. */
const DEFAULT_WIDTH = 527.85;

/** Rotation Word applies to a diagonal watermark, in degrees clockwise. */
const DIAGONAL_ROTATION = 315;

/**
 * Font size written for automatically sized text. Word stretches the text to
 * fill the shape regardless of the font size, and writes 1pt to mean "auto".
 */
const AUTO_FONT_SIZE = 1;

/**
 * Approximate width of an uppercase letter relative to the height of the shape,
 * used to derive a default shape height that keeps the letters in proportion.
 */
const CHARACTER_ASPECT_RATIO = 0.8;

/** Approximate width of a space relative to the height of the shape. */
const SPACE_ASPECT_RATIO = 0.35;

/**
 * Layout of a text watermark on the page.
 *
 * - `diagonal`: rotated from bottom-left to top-right (Word's default)
 * - `horizontal`: not rotated
 */
export type WatermarkLayout = "diagonal" | "horizontal";

/**
 * Options for creating a text watermark.
 *
 * @see {@link TextWatermark}
 */
export type ITextWatermarkOptions = {
    /** The text to display, e.g. "DRAFT". */
    readonly text: string;
    /** Font family. Default is Calibri. */
    readonly font?: string;
    /**
     * Font size in points. When omitted the text is sized automatically to fill the
     * watermark's width and height, which is what Word does by default.
     */
    readonly fontSize?: number;
    /** Whether the text is bold. */
    readonly bold?: boolean;
    /** Whether the text is italic. */
    readonly italics?: boolean;
    /** Colour of the text: a named colour such as "silver" or a hex value such as "C0C0C0". Default is silver. */
    readonly color?: string;
    /** Opacity of the text from 0 (invisible) to 1 (solid). Default is 0.5, Word's "semitransparent" setting. */
    readonly opacity?: number;
    /** Whether the text runs diagonally across the page or horizontally. Default is diagonal. */
    readonly layout?: WatermarkLayout;
    /** Clockwise rotation in degrees. Overrides the rotation implied by the layout. */
    readonly rotation?: number;
    /** Width of the watermark in points. Default is 527.85, which spans a Letter or A4 page diagonally. */
    readonly width?: number;
    /** Height of the watermark in points. Defaults to a height that keeps the letters in proportion for the width. */
    readonly height?: number;
};

/**
 * Estimates a shape height that keeps the text in proportion for the given width.
 *
 * Word stretches watermark text to fill the shape, so the shape's aspect ratio
 * must roughly match the text's. Font metrics are not available here, so the
 * width of each character is approximated as a fraction of the height.
 *
 * @param text - The watermark text
 * @param width - The width of the shape in points
 * @returns The estimated height in points, never larger than the width
 */
const estimateHeight = (text: string, width: number): number => {
    const aspectRatio = [...text].reduce(
        (total, character) => total + (character === " " ? SPACE_ASPECT_RATIO : CHARACTER_ASPECT_RATIO),
        0,
    );

    return Math.round((width / Math.max(aspectRatio, 1)) * 100) / 100;
};

/**
 * Represents a text watermark in a WordprocessingML document.
 *
 * TextWatermark is an inline element that belongs inside a paragraph, and the
 * paragraph belongs in a header so that the watermark repeats on every page of
 * the section. It renders as a WordArt shape centred on the page behind the
 * document text, exactly as Word's Design > Watermark command does, so Word
 * recognizes it and can remove or replace it through that command.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The watermark combines several elements:
 * - w:r (run container)
 * - w:pict (picture element containing VML)
 * - v:shapetype (WordArt shape type definition)
 * - v:shape (the positioned WordArt shape)
 * - v:fill (opacity)
 * - v:textpath (the text and its font)
 *
 * @example
 * ```typescript
 * new Document({
 *   sections: [
 *     {
 *       headers: {
 *         default: new Header({
 *           children: [new Paragraph({ children: [new TextWatermark({ text: "DRAFT" })] })],
 *         }),
 *       },
 *       children: [new Paragraph("Body text")],
 *     },
 *   ],
 * });
 *
 * // Customised watermark
 * new TextWatermark({
 *   text: "CONFIDENTIAL",
 *   font: "Arial",
 *   color: "FF0000",
 *   opacity: 0.3,
 *   layout: "horizontal",
 * });
 * ```
 */
export class TextWatermark extends XmlComponent {
    public constructor({
        text,
        font = DEFAULT_FONT,
        fontSize = AUTO_FONT_SIZE,
        bold,
        italics,
        color = DEFAULT_COLOR,
        opacity = DEFAULT_OPACITY,
        layout = "diagonal",
        rotation = layout === "diagonal" ? DIAGONAL_ROTATION : 0,
        width = DEFAULT_WIDTH,
        height = estimateHeight(text, width),
    }: ITextWatermarkOptions) {
        super("w:r");

        this.root.push(
            createPict({
                children: [
                    createWordArtShapeType(),
                    createVmlShape({
                        id: `${TEXT_WATERMARK_ID_PREFIX}${uniqueId()}`,
                        type: `#${WORD_ART_SHAPE_TYPE_ID}`,
                        style: createWatermarkShapeStyle({ width, height, rotation }),
                        allowInCell: false,
                        fillColor: vmlColorValue(color),
                        stroked: false,
                        children: [
                            createVmlFill({ opacity }),
                            createVmlTextPath({
                                text,
                                style: {
                                    fontFamily: font,
                                    fontSize,
                                    fontWeight: bold ? "bold" : undefined,
                                    fontStyle: italics ? "italic" : undefined,
                                },
                            }),
                        ],
                    }),
                ],
            }),
        );
    }
}
