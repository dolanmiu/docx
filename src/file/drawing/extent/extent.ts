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
import { BuilderElement, XmlComponent } from "@file/xml-components";

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
 */
export const createExtent = ({ x, y }: ExtentAttributes): XmlComponent =>
    new BuilderElement<ExtentAttributes>({
        name: "wp:extent",
        attributes: {
            x: { key: "cx", value: x },
            y: { key: "cy", value: y },
        },
    });
