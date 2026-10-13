/**
 * Images: `<img>`, and `<svg>` drawn in the HTML, as docx's image runs, sized as a browser sizes them, and floating
 * beside the text when they float.
 *
 * @module
 */
// cspell:ignore xlink
import type { ChildNode, Element } from "domhandler";

import {
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";

import type { ComputedStyle, Size } from "./css/computed-style";
import { type ImageFile, decodeDataUrl, readImageFile, toBytes } from "./images/image-files";
import type { HtmlImage, HtmlOptions, HtmlWarning } from "./options";

/** The widest an image is by default, in pixels: the width of the text on docx's default page, A4 with 1 inch margins */
export const DEFAULT_MAX_IMAGE_WIDTH = 601;

// A transparent pixel, shown in place of an SVG where Word can't show SVGs, when no picture of it is given
const TRANSPARENT_PIXEL = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=";

// The space between a floating image and the text beside it when CSS gives none, an eighth of an inch, as in Word, in EMUs
const FLOAT_MARGIN = 114300;
const EMUS_PER_POINT = 12700;

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

/** What images need of the conversion */
export type ImageContext = {
    readonly options: HtmlOptions;
} & {
    readonly warn: (warning: HtmlWarning) => void;
};

/** An address resolved against the base address, or undefined if either isn't one */
export const resolveUrl = (address: string, base: string | undefined): string | undefined => {
    try {
        return base === undefined ? undefined : new URL(address, base).href;
    } catch {
        return undefined;
    }
};

/** An image's bytes, and an SVG's picture's, from a data URL or the `images` option */
const dataOf = (source: string, options: HtmlOptions): { readonly data: Uint8Array; readonly fallback?: Uint8Array } | undefined => {
    if (/^\s*data:/i.test(source)) {
        const decoded = decodeDataUrl(source.trim());
        return decoded && { data: decoded.data };
    }
    const { images } = options;
    const lookUp = (address: string): HtmlImage | undefined => (typeof images === "function" ? images(address) : images?.[address]);
    const resolved = resolveUrl(source, options.baseUrl);
    const image = lookUp(source) ?? (resolved === undefined ? undefined : lookUp(resolved));
    if (image === undefined) {
        return undefined;
    }
    const { data, fallback } = typeof image === "object" && "data" in image ? image : { data: image, fallback: undefined };
    const bytes = toBytes(data);
    const fallbackBytes = fallback === undefined ? undefined : toBytes(fallback);
    return bytes && { data: bytes, ...(fallbackBytes ? { fallback: fallbackBytes } : {}) };
};

/** A length in pixels, or a percentage of one, or undefined if it is a percentage of nothing */
const pixelsOf = (size: Size | undefined, percentOf?: number): number | undefined => {
    if (size === undefined) {
        return undefined;
    }
    return "points" in size ? size.points / 0.75 : percentOf === undefined ? undefined : (size.percent * percentOf) / 100;
};

/**
 * An image's size in pixels, as a browser sizes it: as its CSS or attributes say, with its own aspect ratio for a
 * side they leave out, its own size if they say nothing, within its minimum and maximum sizes, and no wider than the
 * page.
 */
const sizeOf = (file: ImageFile, style: ComputedStyle, maxImageWidth: number): { readonly width: number; readonly height: number } => {
    const ownWidth = file.width ?? 300;
    const ownHeight = file.height ?? 150;
    const cssWidth = pixelsOf(style.width, maxImageWidth);
    const cssHeight = pixelsOf(style.height);
    let width = cssWidth ?? (cssHeight === undefined ? ownWidth : (cssHeight * ownWidth) / ownHeight);
    let height = cssHeight ?? (cssWidth === undefined ? ownHeight : (cssWidth * ownHeight) / ownWidth);

    const scale = (factor: number): void => {
        width *= factor;
        height *= factor;
    };
    const minWidth = pixelsOf(style.minWidth, maxImageWidth);
    const minHeight = pixelsOf(style.minHeight);
    const maxWidth = Math.min(pixelsOf(style.maxWidth, maxImageWidth) ?? Infinity, maxImageWidth);
    const maxHeight = pixelsOf(style.maxHeight) ?? Infinity;
    if (minWidth !== undefined && width < minWidth) {
        scale(minWidth / width);
    }
    if (minHeight !== undefined && height < minHeight) {
        scale(minHeight / height);
    }
    if (height > maxHeight) {
        scale(maxHeight / height);
    }
    if (width > maxWidth) {
        scale(maxWidth / width);
    }
    return { width: Math.max(Math.round(width), 1), height: Math.max(Math.round(height), 1) };
};

/** The margins of a floating image in EMUs, from its CSS margins, with an eighth of an inch on the side the text is */
const floatMarginsOf = (style: ComputedStyle, float: "left" | "right"): Readonly<Record<"top" | "right" | "bottom" | "left", number>> => {
    const emus = (side: "top" | "right" | "bottom" | "left", fallback: number): number => {
        const margin = style.margin[side];
        return typeof margin === "number" ? Math.max(Math.round(margin * EMUS_PER_POINT), 0) : fallback;
    };
    return {
        top: emus("top", 0),
        bottom: emus("bottom", 0),
        left: emus("left", float === "right" ? FLOAT_MARGIN : 0),
        right: emus("right", float === "left" ? FLOAT_MARGIN : 0),
    };
};

/** Writes an image of bytes it has read, with its size, alt text and float */
const imageRunOf = (
    element: Element,
    style: ComputedStyle,
    { data, fallback }: { readonly data: Uint8Array; readonly fallback?: Uint8Array },
    file: ImageFile & { readonly format: "png" | "jpg" | "gif" | "bmp" | "svg" },
    options: HtmlOptions,
): ImageRun => {
    const { alt, title } = element.attribs;
    const transformation = sizeOf(file, style, options.maxImageWidth ?? DEFAULT_MAX_IMAGE_WIDTH);
    const fallbackFile = fallback && readImageFile(fallback);
    const common = {
        transformation,
        ...(alt || title ? { altText: { name: alt ?? "", description: alt ?? "", title: title ?? "" } } : {}),
        // An empty alt says the image is only decoration, which screen readers leave out
        ...(alt === "" ? { decorative: true } : {}),
        ...(style.float
            ? {
                  floating: {
                      horizontalPosition: {
                          relative: HorizontalPositionRelativeFrom.COLUMN,
                          align: style.float === "left" ? HorizontalPositionAlign.LEFT : HorizontalPositionAlign.RIGHT,
                      },
                      verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                      wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
                      margins: floatMarginsOf(style, style.float),
                  },
              }
            : {}),
    };
    if (file.format !== "svg") {
        return new ImageRun({ type: file.format, data, ...common });
    }
    return new ImageRun({
        type: "svg",
        data,
        fallback:
            fallbackFile && fallbackFile.format !== "svg" && ["png", "jpg", "gif", "bmp"].includes(fallbackFile.format)
                ? { type: fallbackFile.format as "png" | "jpg" | "gif" | "bmp", data: fallback! }
                : { type: "png", data: TRANSPARENT_PIXEL },
        ...common,
    });
};

const SHOWN: ReadonlySet<string> = new Set(["png", "jpg", "gif", "bmp", "svg"]);

/** An image's name in a warning: its address, or the start of a data URL */
const nameOf = (source: string): string => (source.length > 60 ? `${source.slice(0, 57)}...` : source);

/**
 * An `<img>` as an image run, or undefined, with a warning, when it has no data or isn't an image Word can show.
 *
 * @param element - The `<img>`
 * @param style - Its style
 * @param context - The conversion's options, and where its warnings go
 */
export const imageOf = (element: Element, style: ComputedStyle, { options, warn }: ImageContext): ImageRun | undefined => {
    const source = (element.attribs.src ?? "").trim();
    const data = source === "" ? undefined : dataOf(source, options);
    if (data === undefined) {
        warn({
            code: "missing-image",
            message:
                source === ""
                    ? "An image has no src, so it is left out"
                    : `The image "${nameOf(source)}" isn't a data URL or in the images option, so it is left out`,
        });
        return undefined;
    }
    const file = readImageFile(data.data);
    if (file === undefined || !SHOWN.has(file.format)) {
        warn({
            code: "unsupported-image",
            message: file
                ? `The image "${nameOf(source)}" is ${file.format.toUpperCase()}, which Word can't show, so it is left out`
                : `The image "${nameOf(source)}" isn't an image Word can show, so it is left out`,
        });
        return undefined;
    }
    return imageRunOf(element, style, data, file as ImageFile & { readonly format: "png" | "jpg" | "gif" | "bmp" | "svg" }, options);
};

const XML_ESCAPES: ReadonlyMap<string, string> = new Map([
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
]);
const escapeXml = (text: string): string => text.replace(/[&<>"]/g, (character) => XML_ESCAPES.get(character)!);

/**
 * An `<svg>` in the HTML as an SVG file's XML, with the prefixes of its attributes, such as `xlink:href`, which HTML's
 * parser keeps apart. Its elements are written without recursion, so no depth of them is too deep.
 */
const svgFileOf = (svg: Element): string => {
    let markup = "";
    // eslint-disable-next-line functional/prefer-readonly-type
    const stack: (ChildNode | string)[] = [svg];
    while (stack.length > 0) {
        // eslint-disable-next-line functional/immutable-data
        const node = stack.pop()!;
        if (typeof node === "string") {
            markup += node;
        } else if (node.type === "text") {
            markup += escapeXml(node.data);
        } else if (node.type === "tag") {
            // HTML's parser keeps each attribute's prefix apart, such as xlink for xlink:href
            const prefixes = (node as { readonly "x-attribsPrefix": Readonly<Record<string, string | undefined>> })["x-attribsPrefix"];
            const attributes = Object.entries(node.attribs)
                .map(([name, value]) => ` ${prefixes[name] ? `${prefixes[name]}:` : ""}${name}="${escapeXml(value)}"`)
                .join("");
            markup += `<${node.name}${attributes}${node.children.length === 0 ? "/>" : ">"}`;
            if (node.children.length > 0) {
                // eslint-disable-next-line functional/immutable-data
                stack.push(`</${node.name}>`, ...[...node.children].reverse());
            }
        }
    }
    // An SVG in HTML needs no namespaces, but an SVG file does
    const [start] = /^<svg\b[^>]*/.exec(markup)!;
    const namespaces =
        (/\sxmlns=/.test(start) ? "" : ` xmlns="${SVG_NAMESPACE}"`) +
        (/\bxlink:/.test(markup) && !/\sxmlns:xlink=/.test(start) ? ` xmlns:xlink="${XLINK_NAMESPACE}"` : "");
    return `<svg${namespaces}${markup.slice("<svg".length)}`;
};

/**
 * An `<svg>` drawn in the HTML as an SVG image, sized by its attributes and CSS, as a browser sizes it.
 *
 * @param element - The `<svg>`
 * @param style - Its style
 * @param options - The conversion's options
 */
export const svgImageOf = (element: Element, style: ComputedStyle, options: HtmlOptions): ImageRun => {
    const data = new TextEncoder().encode(svgFileOf(element));
    return imageRunOf(element, style, { data }, { ...readImageFile(data), format: "svg" }, options);
};
