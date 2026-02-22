/**
 * Effect extent for DrawingML objects.
 *
 * This module provides support for defining additional extent to compensate
 * for drawing effects applied to objects.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_effectExtent_topic_ID0E5O3OB.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Attributes for effect extent.
 */
export type EffectExtentAttributes = {
    /**
     * ## Additional Extent on Top Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the top edge of the DrawingML object to determine its actual top edge including effects.
     */
    readonly top: number;
    /**
     * ## Additional Extent on Right Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the right edge of the DrawingML object to determine its actual right edge including effects.
     */
    readonly right: number;
    /**
     * ## Additional Extent on Bottom Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the bottom edge of the DrawingML object to determine its actual bottom edge including effects.
     */
    readonly bottom: number;
    /**
     * ## Additional Extent on Left Edge
     *
     * Specifies the additional length, in EMUs, which shall be added to the left edge of the DrawingML object to determine its actual left edge including effects.
     */
    readonly left: number;
};

/**
 * Creates an effect extent element.
 *
 * This element specifies the additional extent which shall be added to each
 * edge of the image (top, bottom, left, right) in order to compensate for any
 * drawing effects applied to the DrawingML object.
 *
 * The extent element specifies the size of the actual DrawingML object; however,
 * an object may have effects applied which change its overall size. This element
 * accounts for that additional space.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_effectExtent_topic_ID0E5O3OB.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_EffectExtent">
 *   <xsd:attribute name="l" type="a:ST_Coordinate" use="required"/>
 *   <xsd:attribute name="t" type="a:ST_Coordinate" use="required"/>
 *   <xsd:attribute name="r" type="a:ST_Coordinate" use="required"/>
 *   <xsd:attribute name="b" type="a:ST_Coordinate" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const effectExtent = createEffectExtent({
 *   top: 0,
 *   right: 0,
 *   bottom: 0,
 *   left: 0
 * });
 * ```
 */
export const createEffectExtent = ({ top, right, bottom, left }: EffectExtentAttributes): XmlComponent =>
    new BuilderElement<EffectExtentAttributes>({
        name: "wp:effectExtent",
        attributes: {
            top: {
                key: "t",
                value: top,
            },
            right: {
                key: "r",
                value: right,
            },
            bottom: {
                key: "b",
                value: bottom,
            },
            left: {
                key: "l",
                value: left,
            },
        },
    });
