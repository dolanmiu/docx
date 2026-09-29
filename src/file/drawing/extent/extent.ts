/**
 * Extent (size) for DrawingML objects.
 *
 * This module provides support for defining the size of DrawingML objects
 * in inline drawings.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_extent_topic_ID0EQB4OB.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Attributes for extent.
 */
type ExtentAttributes = {
    /**
     * ## Extent Length
     *
     * Specifies the length of the extents rectangle in EMUs. This rectangle shall dictate the size of the object as displayed (the result of any scaling to the original object).
     *
     *
     * ### Example
     *
     * ```xml
     * <... cx="1828800" cy="200000"/>
     * ```
     *
     * The `cx` attributes specifies that this object has a height of `1828800` EMUs (English Metric Units).
     *
     * The possible values for this attribute are defined by the `ST_PositiveCoordinate` simple type (§5.1.12.42).
     */
    readonly x?: number;
    /**
     * ## Extent Width
     *
     * Specifies the width of the extents rectangle in EMUs. This rectangle shall dictate the size of the object as displayed (the result of any scaling to the original object).
     *
     * ### Example
     *
     * ```xml
     * <... cx="1828800" cy="200000"/>
     * ```
     *
     * The `cy` attribute specifies that this object has a width of `200000` EMUs (English Metric Units).
     *
     * The possible values for this attribute are defined by the `ST_PositiveCoordinate` simple type (§5.1.12.42).
     */
    readonly y?: number;
};

/**
 * The largest width or height, in EMUs, Word opens a drawing at. The standard allows `ST_PositiveCoordinate` up to
 * 27273042316900, but Word and PowerPoint restrict it to 2147483647 and won't open a document with a larger drawing.
 *
 * Reference: [MS-OI29500] Part 1 Section 20.1.10.42, ST_PositiveCoordinate
 */
const MAX_EXTENT = 2147483647;

const EMUS_PER_PIXEL = 9525;

// Every width and height the public API takes is in pixels, so a size this big is most often EMUs given as pixels,
// which multiplies them by 9525 again
const checkExtent = (dimension: "width" | "height", value: number | undefined): number | undefined => {
    if (value !== undefined && value > MAX_EXTENT) {
        throw new Error(
            `Invalid drawing ${dimension} ${value} EMUs (${Math.round(value / EMUS_PER_PIXEL)} pixels). Word won't open a drawing with a ${dimension} over ${MAX_EXTENT} EMUs (${Math.floor(MAX_EXTENT / EMUS_PER_PIXEL)} pixels). Sizes such as an ImageRun's transformation are in pixels, not EMUs`,
        );
    }
    return value;
};

/**
 * Creates an extent element for inline drawings.
 *
 * This element specifies the extents of the parent DrawingML object within
 * the document (i.e. its final height and width).
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_extent_topic_ID0EQB4OB.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PositiveSize2D">
 *   <xsd:attribute name="cx" type="ST_PositiveCoordinate" use="required"/>
 *   <xsd:attribute name="cy" type="ST_PositiveCoordinate" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a 1-inch by 1-inch extent
 * const extent = createExtent({
 *   x: 914400,
 *   y: 914400
 * });
 * ```
 *
 * @throws Error if the width or height is over 2147483647 EMUs, which Word won't open
 */
export const createExtent = ({ x, y }: ExtentAttributes): XmlComponent =>
    new BuilderElement<ExtentAttributes>({
        name: "wp:extent",
        attributes: {
            x: { key: "cx", value: checkExtent("width", x) },
            y: { key: "cy", value: checkExtent("height", y) },
        },
    });
