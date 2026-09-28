import { IContext } from 'docx';
import { IXmlableObject } from 'docx';
import { XmlComponent } from 'docx';

/**
 * Options for creating an image watermark.
 *
 * @see {@link ImageWatermark}
 */
export declare type IImageWatermarkOptions = {
    /** The image format. VML pictures do not support SVG. */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /** Size at which the image is drawn, in pixels, matching ImageRun. The image is centred on the page. */
    readonly transformation: {
        /** Display width in pixels. */
        readonly width: number;
        /** Display height in pixels. */
        readonly height: number;
    };
    /** Whether the image is lightened so that text remains readable over it. Default is true, matching Word's "Washout" option. */
    readonly washout?: boolean;
    /** Title of the image, shown by Word as the picture's name. */
    readonly title?: string;
};

/**
 * Represents an image watermark in a WordprocessingML document.
 *
 * ImageWatermark is an inline element that belongs inside a paragraph, and the
 * paragraph belongs in a header so that the watermark repeats on every page of
 * the section. It renders as a picture shape centred on the page behind the
 * document text, exactly as Word's Design > Watermark command does, so Word
 * recognizes it and can remove or replace it through that command.
 *
 * The image is registered with the document's media collection during
 * serialization and linked from the header through a relationship, in the same
 * way as an ImageRun.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The watermark combines several elements:
 * - w:r (run container)
 * - w:pict (picture element containing VML)
 * - v:shapetype (picture frame shape type definition)
 * - v:shape (the positioned picture shape)
 * - v:imagedata (the image reference and washout adjustments)
 *
 * @example
 * ```typescript
 * new Document({
 *   sections: [
 *     {
 *       headers: {
 *         default: new Header({
 *           children: [
 *             new Paragraph({
 *               children: [
 *                 new ImageWatermark({
 *                   type: "png",
 *                   data: fs.readFileSync("./logo.png"),
 *                   transformation: { width: 400, height: 400 },
 *                 }),
 *               ],
 *             }),
 *           ],
 *         }),
 *       },
 *       children: [new Paragraph("Body text")],
 *     },
 *   ],
 * });
 * ```
 */
export declare class ImageWatermark extends XmlComponent {
    private readonly mediaData;
    constructor({ type, data, transformation, washout, title }: IImageWatermarkOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}

/**
 * Options for creating a text watermark.
 *
 * @see {@link TextWatermark}
 */
export declare type ITextWatermarkOptions = {
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
export declare class TextWatermark extends XmlComponent {
    constructor({ text, font, fontSize, bold, italics, color, opacity, layout, rotation, width, height, }: ITextWatermarkOptions);
}

/**
 * Layout of a text watermark on the page.
 *
 * - `diagonal`: rotated from bottom-left to top-right (Word's default)
 * - `horizontal`: not rotated
 */
export declare type WatermarkLayout = "diagonal" | "horizontal";

export { }
