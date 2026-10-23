/**
 * ImageRun module for WordprocessingML documents.
 *
 * This module provides support for inserting images into documents.
 *
 * Reference: http://officeopenxml.com/drwPicInline.php
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { DrawingLinkOptions } from "@file/drawing/doc-properties/non-visual-drawing-properties";
import { ChangeAttributes, type IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { BuilderElement, type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";
import { hashedId } from "@util/convenience-functions";

import { type RegularImageOptions, type SvgMediaOptions, imageTypeOf, standardizeData } from "./image-data";
import { type IRunPropertiesOptions, RunProperties } from "./properties";
import { Drawing, type IFloating } from "../../drawing";
import type { ICropOptions } from "../../drawing/inline/graphic/graphic-data/pic/blip/source-rectangle";
import type { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import type { IMediaTransformation } from "../../media";
import type { IMediaData } from "../../media/data";

/**
 * Core options for image configuration.
 *
 * `link` opens a web address when the image is clicked (with Ctrl in Word), and takes precedence over a hyperlink the
 * image is in. `decorative` marks the image as decorative, as Word's "Mark as decorative" does, so screen readers skip
 * it: use it instead of alternative text for images that carry no information, such as borders and flourishes.
 */
type CoreImageOptions = DrawingLinkOptions & {
    /** Size, position, rotation, and flip settings for the image. Width and height are in pixels, at 96 to the inch, not EMUs. */
    readonly transformation: IMediaTransformation;
    /** Floating layout options. When set, the image is positioned freely on the page rather than inline with text. Controls text wrapping, overlap, anchoring, and z-order. */
    readonly floating?: IFloating;
    /** Accessibility properties for the image, including a name, description (alt text), and title. */
    readonly altText?: DocPropertiesOptions;
    /** Border/outline settings for the image, including line width, color, cap style, and compound line type. */
    readonly outline?: OutlineOptions;
    /** Solid color fill behind the image, using either an RGB hex value or a theme scheme color. */
    readonly solidFill?: SolidFillOptions;
    /** Crops the image by trimming a percentage (0-100) off each edge before it is stretched to fill the frame. */
    readonly crop?: ICropOptions;
    /** Formatting of the run the image is in, such as `position` to raise or lower it from the text's baseline. */
    readonly run?: IRunPropertiesOptions;
    /** Marks the image as an inserted revision for change tracking. Requires an id, author name, and date. */
    readonly insertion?: IChangedAttributesProperties;
    /**
     * Marks the image as a deleted revision for change tracking. Requires an id, author name, and date. With
     * `insertion`, the image was inserted and then deleted, such as by another author.
     */
    readonly deletion?: IChangedAttributesProperties;
};

/**
 * Options for creating an ImageRun.
 *
 * @see {@link ImageRun}
 */
export type IImageOptions = (RegularImageOptions | SvgMediaOptions) & CoreImageOptions;

export { standardizeData } from "./image-data";

const createImageData = (options: IImageOptions, key: string): Pick<IMediaData, "data" | "fileName" | "transformation"> => ({
    data: standardizeData(options.data),
    fileName: key,
    transformation: {
        pixels: {
            x: Math.round(options.transformation.width),
            y: Math.round(options.transformation.height),
        },
        emus: {
            x: Math.round(options.transformation.width * 9525),
            y: Math.round(options.transformation.height * 9525),
        },
        flip: options.transformation.flip,
        rotation: options.transformation.rotation ? options.transformation.rotation * 60000 : undefined,
    },
});

/** The media data of a PNG, JPEG, GIF or BMP image, as an image of its own or as an SVG image's fallback */
const createRegularImageData = (
    options: RegularImageOptions,
    transformation: IMediaTransformation,
    name: string,
): Exclude<IMediaData, { readonly type: "svg" }> => {
    const type = imageTypeOf(options, name);
    return { type, ...createImageData({ ...options, transformation }, `${hashedId(options.data)}.${type}`) };
};

const createDeletion = ({ id, author, date }: IChangedAttributesProperties, run: XmlComponent): XmlComponent =>
    new BuilderElement<IChangedAttributesProperties>({
        name: "w:del",
        attributes: {
            id: { key: "w:id", value: id },
            author: { key: "w:author", value: author },
            date: { key: "w:date", value: date },
        },
        children: [run],
    });

/**
 * Represents an image in a WordprocessingML document.
 *
 * ImageRun embeds an image within a run, supporting various formats
 * including JPG, PNG, GIF, BMP, and SVG. Optionally wraps the run in
 * `<w:ins>` or `<w:del>`, or both, for track-change insertion/deletion markup.
 *
 * Reference: http://officeopenxml.com/drwPicInline.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ImageRun({
 *   data: fs.readFileSync("./image.png"),
 *   transformation: {
 *     width: 100,
 *     height: 100,
 *   },
 *   type: "png",
 * });
 * ```
 */
export class ImageRun extends XmlComponent {
    private readonly imageData: IMediaData;

    public constructor(options: IImageOptions) {
        const imageData: IMediaData =
            options.type === "svg"
                ? {
                      type: options.type,
                      ...createImageData(options, `${hashedId(options.data)}.svg`),
                      fallback: createRegularImageData(options.fallback, options.transformation, "ImageRun fallback"),
                  }
                : createRegularImageData(options, options.transformation, "ImageRun");

        const drawing = new Drawing(imageData, {
            floating: options.floating,
            docProperties: options.altText,
            outline: options.outline,
            solidFill: options.solidFill,
            crop: options.crop,
            link: options.link,
            decorative: options.decorative,
        });
        const properties = new RunProperties(options.run);

        // Track-change wrappers: w:ins / w:del enclose the run so Word displays the image as an inserted or deleted
        // revision. An image inserted and then deleted is in both: w:ins > w:del > w:r
        const revision = options.insertion ?? options.deletion;
        const rootName = options.insertion ? "w:ins" : options.deletion ? "w:del" : "w:r";

        // One super() call, not one per branch: the build wraps a super() inside a branch in an arrow function, which
        // Next.js Turbopack turns into a plain function, and a plain function can't call super()
        super(rootName);

        if (revision) {
            this.root.push(
                new ChangeAttributes({
                    id: revision.id,
                    author: revision.author,
                    date: revision.date,
                }),
            );
            const run = new BuilderElement({ name: "w:r", children: [properties, drawing] });
            this.addChildElement(options.insertion && options.deletion ? createDeletion(options.deletion, run) : run);
        } else {
            this.root.push(properties);
            this.root.push(drawing);
        }

        this.imageData = imageData;
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.imageData.fileName, this.imageData);

        if (this.imageData.type === "svg") {
            context.file.Media.addImage(this.imageData.fallback.fileName, this.imageData.fallback);
        }

        return super.prepForXml(context);
    }
}
