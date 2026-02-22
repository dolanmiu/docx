/**
 * Solid fill element for DrawingML shapes.
 *
 * This module provides solid fill support for outlines and shapes,
 * supporting both RGB and scheme-based colors.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createSolidRgbColor } from "./rgb-color";
import { type SchemeColor, createSchemeColor } from "./scheme-color";

/**
 * RGB color options for solid fill.
 */
export type RgbColorOptions = {
    /** RGB color type */
    readonly type: "rgb";
    /** Hex color value (e.g., "FF0000" for red) */
    readonly value: string;
};

/**
 * Scheme color options for solid fill.
 */
export type SchemeColorOptions = {
    /** Scheme color type */
    readonly type: "scheme";
    /** Scheme color value */
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

/**
 * Union type for solid fill options.
 */
export type SolidFillOptions = RgbColorOptions | SchemeColorOptions;

/**
 * Creates a solid fill element.
 *
 * Specifies a solid color fill using either RGB or scheme colors.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SolidColorFillProperties">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorChoice" minOccurs="0"/>
 *     <xsd:group ref="EG_EffectProperties" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // RGB solid fill
 * const fill = createSolidFill({
 *   type: "rgb",
 *   value: "FF0000"
 * });
 *
 * // Scheme solid fill
 * const schemeFill = createSolidFill({
 *   type: "scheme",
 *   value: SchemeColor.ACCENT1
 * });
 * ```
 */
export const createSolidFill = (options: SolidFillOptions): XmlComponent =>
    new BuilderElement({
        name: "a:solidFill",
        children: [options.type === "rgb" ? createSolidRgbColor(options) : createSchemeColor(options)],
    });
