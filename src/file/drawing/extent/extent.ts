import { BuilderElement, XmlComponent } from "@file/xml-components";

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
 * This element specifies the extents of the parent `DrawingML` object within the document (i.e. its final height and width).
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_extent_topic_ID0EQB4OB.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <complexType name="CT_PositiveSize2D">
 *   <attribute name="cx" type="ST_PositiveCoordinate" use="required"/>
 *   <attribute name="cy" type="ST_PositiveCoordinate" use="required"/>
 * </complexType>
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
