/**
 * RGB color element for DrawingML shapes.
 *
 * This module provides RGB color support for solid fills.
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for RGB color.
 */
type SolidRgbColorOptions = {
    /** Hex color value (e.g., "FF0000" for red) */
    readonly value: string;
};

// <xsd:complexType name="CT_SRgbColor">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
// </xsd:complexType>

/**
 * Creates an sRGB color element.
 *
 * Specifies a color using RGB hex values.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SRgbColor">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const redColor = createSolidRgbColor({ value: "FF0000" });
 * const blueColor = createSolidRgbColor({ value: "0000FF" });
 * ```
 */
export const createSolidRgbColor = (options: SolidRgbColorOptions): XmlComponent =>
    new BuilderElement<SolidRgbColorOptions>({
        name: "a:srgbClr",
        attributes: {
            value: {
                key: "val",
                value: options.value,
            },
        },
    });
