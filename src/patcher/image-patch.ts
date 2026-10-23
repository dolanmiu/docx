/**
 * Replaces the image of a picture in a template, such as a placeholder logo, with `patchDocument`, keeping its look.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
// cspell:ignore descr asvg wgp

import { PackagePart } from "@file/package-part";
import { type RegularImageOptions, type SvgMediaOptions, imageTypeOf, standardizeData } from "@file/paragraph/run/image-data";
import type { XmlElement as Element } from "@util/xml";

import { DrawingPatch, type TemplateDrawing, type TemplatePackage } from "./drawing-patch";

/**
 * The size of a picture an {@link ImagePatch} gives a new image, in pixels, at 96 to the inch, as an `ImageRun`'s.
 *
 * @publicApi
 */
export type ImagePatchTransformation = {
    /** The picture's width in pixels */
    readonly width: number;
    /** The picture's height in pixels */
    readonly height: number;
};

/**
 * The new image for a picture in a template, given as an `ImageRun`'s is, and optionally the picture's new size and
 * alt text.
 *
 * @publicApi
 */
export type ImagePatchOptions = (RegularImageOptions | SvgMediaOptions) & {
    /**
     * The picture's new size. Default is the template picture's size, which the new image is stretched to fill, so give
     * it the template's proportions, or give a size with its own
     */
    readonly transformation?: ImagePatchTransformation;
    /**
     * The picture's alt text. Default is the template's, without the placeholder. An empty description or title removes
     * it
     */
    readonly altText?: { readonly description?: string; readonly title?: string };
};

const IMAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const CONTENT_TYPES = { png: "image/png", jpg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", svg: "image/svg+xml" } as const;
const REGULAR_TYPES: readonly string[] = ["png", "jpg", "gif", "bmp"];
const EMUS_PER_PIXEL = 9525;

// The extension of an image with an SVG version, which Word shows instead, keeping the image for applications that can't
const SVG_EXTENSION = "{96DAC541-7B7A-43D3-8B79-37D633B846F1}";
// The extension of an image Word applied artistic effects to or removed the background of, which keeps the image before
// them, so Word would show the template's image again when the picture is edited
const IMAGE_PROPERTIES_EXTENSION = "{BEBA8EAE-BF5A-486C-A8C5-ECC9F3942E4B}";

const childOf = (element: Element | undefined, name: string): Element | undefined =>
    element?.elements?.find((child) => child.name === name);

/** The bytes of image data, as an `ImageRun` takes it */
const bytesOf = (data: RegularImageOptions["data"]): Uint8Array => {
    const standardized = standardizeData(data);
    return ArrayBuffer.isView(standardized)
        ? new Uint8Array(standardized.buffer, standardized.byteOffset, standardized.byteLength)
        : new Uint8Array(standardized);
};

const imagePart = (type: keyof typeof CONTENT_TYPES, data: RegularImageOptions["data"]): PackagePart =>
    new PackagePart({
        folder: "media",
        name: "image",
        extension: type,
        contentType: CONTENT_TYPES[type],
        relationshipType: IMAGE_RELATIONSHIP,
        content: bytesOf(data),
    });

/**
 * The part for a PNG, JPEG, GIF or BMP image, whose type is read from its data when JavaScript leaves it out.
 *
 * @throws If its type isn't one of those, or isn't given and its data isn't one of those formats
 */
const regularImagePart = (options: RegularImageOptions, name: string): PackagePart => {
    const type = imageTypeOf(options, name);
    if (!REGULAR_TYPES.includes(type)) {
        throw new Error(`${name}: invalid type "${type}". Expected "png", "jpg", "gif", "bmp" or, with a fallback, "svg"`);
    }
    return imagePart(type, options.data);
};

// What a drawing that isn't a picture is, by the element in its graphic, and what to do instead
const NOT_PICTURES: ReadonlyMap<string, string> = new Map([
    ["c:chart", "It is a chart, not a picture. Give a chart new data with ChartDataPatch from docx/charts"],
    ["cx:chart", "It is a chart, not a picture. Give a chart new data with ChartDataPatch from docx/charts"],
    ["wpg:wgp", "It is a group of drawings. Ungroup the picture in Word, and put the placeholder in its alt text"],
    ["wpc:wpc", "It is a drawing canvas. Move the picture out of it in Word, and put the placeholder in its alt text"],
    ["wps:wsp", "It is a shape, not a picture"],
]);

/**
 * The picture a drawing shows.
 *
 * @throws If the drawing isn't a picture, saying what it is
 */
const pictureOf = (drawing: Element, placeholder: string): Element => {
    const graphicData = childOf(childOf(drawing, "a:graphic"), "a:graphicData");
    const picture = childOf(graphicData, "pic:pic");
    if (picture !== undefined) {
        return picture;
    }
    const content = graphicData?.elements?.find((element) => element.type === "element")?.name;
    throw new Error(`Can't patch the picture ${placeholder}. ${NOT_PICTURES.get(content ?? "") ?? "It isn't a picture"}`);
};

/**
 * The extensions of an image, without those for the template's image: an SVG version, which is replaced by the new
 * image's, if it has one, and the image before Word's artistic effects.
 */
const withExtensions = (blip: Element, svgId: string | undefined): readonly Element[] => {
    const elements = blip.elements ?? [];
    const list = childOf(blip, "a:extLst");
    const svg: readonly Element[] =
        svgId === undefined
            ? []
            : [
                  {
                      type: "element",
                      name: "a:ext",
                      attributes: { uri: SVG_EXTENSION },
                      elements: [
                          {
                              type: "element",
                              name: "asvg:svgBlip",
                              attributes: { "xmlns:asvg": "http://schemas.microsoft.com/office/drawing/2016/SVG/main", "r:embed": svgId },
                          },
                      ],
                  },
              ];
    const extensions = [
        ...(list?.elements ?? []).filter(
            (extension) =>
                extension.name === "a:ext" &&
                ![SVG_EXTENSION, IMAGE_PROPERTIES_EXTENSION].includes(String(extension.attributes?.uri).toUpperCase()),
        ),
        ...svg,
    ];
    const newList: readonly Element[] =
        extensions.length === 0 ? [] : [{ ...list, type: "element", name: "a:extLst", elements: extensions }];
    // The list is the image's last child, after its effects, such as its transparency
    return [...elements.filter((element) => element !== list), ...newList];
};

/**
 * Sets the alt text of a picture's properties: the description and title given, or else the template's, without the
 * placeholder. An empty one is removed.
 */
const setAltText = (properties: Element, placeholder: string, altText: ImagePatchOptions["altText"]): void => {
    const without = (name: string): string | undefined => {
        const text = properties.attributes?.[name];
        return text === undefined ? undefined : String(text).split(placeholder).join("").trim();
    };
    const description = altText?.description ?? without("descr");
    const title = altText?.title ?? without("title");
    properties.attributes = Object.fromEntries(
        Object.entries({ ...properties.attributes, descr: description || undefined, title: title || undefined }).filter(
            ([, value]) => value !== undefined,
        ),
    );
};

const resize = (element: Element | undefined, { width, height }: ImagePatchTransformation): void => {
    if (element !== undefined) {
        // eslint-disable-next-line functional/immutable-data
        element.attributes = { ...element.attributes, cx: Math.round(width * EMUS_PER_PIXEL), cy: Math.round(height * EMUS_PER_PIXEL) };
    }
};

/**
 * Replaces the image of a picture in a template, found by a placeholder in its alt text, such as `{{logo}}`, keeping
 * its look: its size, position, text wrapping, border, shape, effects and link. Give it as a patch to `patchDocument`,
 * with the placeholder's key.
 *
 * - The new image fills the picture, stretched to its size, unless a new `transformation` is given. Word's crop of the
 *   template's image is removed.
 * - The placeholder is taken out of the alt text, unless new alt text is given.
 * - The template's image is removed, unless something else, such as another picture, shows it.
 *
 * Put the placeholder in the picture's alt text in Word, in "Alt Text" or "Edit Alt Text". Every picture whose alt text
 * holds it is patched, wherever it is: in the document, a table, a header, a footer or a note. A placeholder in the
 * document's text is left as it is: use an `ImageRun` in a `PatchType.PARAGRAPH` patch for it.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * await patchDocument({
 *   outputType: "nodebuffer",
 *   data: template,
 *   patches: {
 *     logo: new ImagePatch({ type: "png", data: fs.readFileSync("logo.png") }),
 *   },
 * });
 * ```
 */
export class ImagePatch extends DrawingPatch {
    // The image the picture shows: a PNG, JPEG, GIF or BMP image, or for an SVG image, its fallback
    private readonly image: PackagePart;
    private readonly svg: PackagePart | undefined;
    private readonly transformation: ImagePatchTransformation | undefined;
    private readonly altText: ImagePatchOptions["altText"];

    /**
     * @throws If the image's type isn't one an `ImageRun` takes, an SVG image has no fallback, or the size isn't a number
     * of pixels greater than 0
     */
    public constructor(options: ImagePatchOptions) {
        super();
        if (options.type === "svg") {
            if (options.fallback === undefined) {
                throw new Error(
                    "ImagePatch: an SVG image needs a fallback, a PNG, JPEG, GIF or BMP image for applications that can't show SVG",
                );
            }
            this.image = regularImagePart(options.fallback, "ImagePatch fallback");
            this.svg = imagePart("svg", options.data);
        } else {
            this.image = regularImagePart(options, "ImagePatch");
        }

        const { transformation } = options;
        if (transformation !== undefined) {
            for (const name of ["width", "height"] as const) {
                const value: unknown = transformation[name];
                if (!(typeof value === "number" && value > 0 && Number.isFinite(value))) {
                    throw new Error(`ImagePatch: invalid ${name} ${String(value)}. Expected a number of pixels greater than 0`);
                }
            }
            this.transformation = { width: transformation.width, height: transformation.height };
        }
        this.altText = options.altText && { ...options.altText };
    }

    /**
     * Replaces the picture's image, and sets its size and alt text.
     *
     * @throws If the drawing isn't a picture, such as a chart, a shape or a group, or has no image
     */
    public patch({ element, properties, placeholder, part }: TemplateDrawing, template: TemplatePackage): void {
        const picture = pictureOf(element, placeholder);
        const fill = childOf(picture, "pic:blipFill");
        const blip = childOf(fill, "a:blip");
        if (fill === undefined || blip === undefined) {
            throw new Error(`Can't patch the picture ${placeholder}. It has no image: it has no a:blip`);
        }

        // New relationships, rather than the template's, which other pictures of the same image share. patchDocument
        // removes the template's once nothing refers to them
        const id = template.replaceRelatedPart(part, undefined, this.image);
        const svgId = this.svg && template.replaceRelatedPart(part, undefined, this.svg);
        /* eslint-disable functional/immutable-data */
        // The image is embedded, even if the template's was linked to a file
        blip.attributes = {
            "r:embed": id,
            ...Object.fromEntries(Object.entries(blip.attributes ?? {}).filter(([name]) => !/^[^:]+:(embed|link)$/.test(name))),
        };
        blip.elements = [...withExtensions(blip, svgId)];
        // The crop was of the template's image
        // It has elements, as its image is one
        fill.elements = fill.elements!.filter((child) => child.name !== "a:srcRect");
        /* eslint-enable functional/immutable-data */

        if (this.transformation !== undefined) {
            resize(childOf(element, "wp:extent"), this.transformation);
            resize(childOf(childOf(childOf(picture, "pic:spPr"), "a:xfrm"), "a:ext"), this.transformation);
        }

        setAltText(properties, placeholder, this.altText);
        const pictureProperties = childOf(childOf(picture, "pic:nvPicPr"), "pic:cNvPr");
        if (pictureProperties !== undefined) {
            setAltText(pictureProperties, placeholder, this.altText);
        }
    }
}
