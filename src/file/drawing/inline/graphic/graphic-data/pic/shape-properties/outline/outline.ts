/**
 * Outline (line) properties for DrawingML shapes.
 *
 * This module provides support for configuring outline properties including
 * width, cap style, compound line types, and fill properties.
 *
 * Reference: http://officeopenxml.com/drwSp-outline.php
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createNoFill } from "./no-fill";
import { SchemeColor } from "./scheme-color";
import { createSolidFill } from "./solid-fill";

// <xsd:complexType name="CT_TextOutlineEffect">
//     <xsd:sequence>
//         <xsd:group ref="EG_FillProperties" minOccurs="0"/>
//         <xsd:group ref="EG_LineDashProperties" minOccurs="0"/>
//         <xsd:group ref="EG_LineJoinProperties" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attribute name="w" use="optional" type="a:ST_LineWidth"/>
//     <xsd:attribute name="cap" use="optional" type="ST_LineCap"/>
//     <xsd:attribute name="cmpd" use="optional" type="ST_CompoundLine"/>
//     <xsd:attribute name="algn" use="optional" type="ST_PenAlignment"/>
// </xsd:complexType>

// <xsd:simpleType name="ST_LineCap">
//     <xsd:restriction base="xsd:string">
//     <xsd:enumeration value="rnd"/>
//     <xsd:enumeration value="sq"/>
//     <xsd:enumeration value="flat"/>
//     </xsd:restriction>
// </xsd:simpleType>

/**
 * Line cap styles for outline endpoints.
 *
 * Defines how the ends of a line are rendered.
 */
export const LineCap = {
    /** Round cap style */
    ROUND: "rnd",
    /** Square cap style */
    SQUARE: "sq",
    /** Flat cap style */
    FLAT: "flat",
} as const;

// <xsd:simpleType name="ST_CompoundLine">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="sng"/>
//         <xsd:enumeration value="dbl"/>
//         <xsd:enumeration value="thickThin"/>
//         <xsd:enumeration value="thinThick"/>
//         <xsd:enumeration value="tri"/>
//     </xsd:restriction>
// </xsd:simpleType>

/**
 * Compound line types for outlines.
 *
 * Defines the structure of compound lines (single, double, etc.).
 */
export const CompoundLine = {
    /** Single line */
    SINGLE: "sng",
    /** Double line */
    DOUBLE: "dbl",
    /** Thick-thin double line */
    THICK_THIN: "thickThin",
    /** Thin-thick double line */
    THIN_THICK: "thinThick",
    /** Triple line */
    TRI: "tri",
} as const;

// <xsd:simpleType name="ST_PenAlignment">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="ctr"/>
//         <xsd:enumeration value="in"/>
//     </xsd:restriction>
// </xsd:simpleType>

/**
 * Pen alignment options for outline positioning.
 *
 * Defines how the outline is aligned relative to the shape edge.
 */
export const PenAlignment = {
    /** Center alignment */
    CENTER: "ctr",
    /** Inset alignment */
    INSET: "in",
} as const;

/**
 * Attributes for configuring outline properties.
 */
export type OutlineAttributes = {
    /** Line width in EMUs (English Metric Units) */
    readonly width?: number;
    /** Line cap style */
    readonly cap?: keyof typeof LineCap;
    /** Compound line type */
    readonly compoundLine?: keyof typeof CompoundLine;
    /** Pen alignment */
    readonly align?: keyof typeof PenAlignment;
};

/**
 * No fill option for outline.
 */
type OutlineNoFill = {
    /** No fill type */
    readonly type: "noFill";
};

/**
 * RGB solid fill for outline.
 */
type OutlineRgbSolidFill = {
    /** Solid fill type */
    readonly type: "solidFill";
    /** RGB color type */
    readonly solidFillType: "rgb";
    /** Hex color value (e.g., "FF0000" for red) */
    readonly value: string;
};

/**
 * Scheme-based solid fill for outline.
 */
type OutlineSchemeSolidFill = {
    /** Solid fill type */
    readonly type: "solidFill";
    /** Scheme color type */
    readonly solidFillType: "scheme";
    /** Scheme color value */
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

/**
 * Union type for solid fill options.
 */
type OutlineSolidFill = OutlineRgbSolidFill | OutlineSchemeSolidFill;

// <xsd:group name="EG_FillProperties">
//     <xsd:choice>
//         <xsd:element name="noFill" type="w:CT_Empty"/>
//         <xsd:element name="solidFill" type="CT_SolidColorFillProperties"/>
//         <xsd:element name="gradFill" type="CT_GradientFillProperties"/>
//     </xsd:choice>
// </xsd:group>

/**
 * Fill properties for outline.
 */
type OutlineFillProperties = OutlineNoFill | OutlineSolidFill;

/**
 * Complete outline configuration options.
 *
 * Combines outline attributes with fill properties.
 */
export type OutlineOptions = OutlineAttributes & OutlineFillProperties;

/**
 * Creates an outline element for DrawingML shapes.
 *
 * The outline element specifies the line properties for the shape border,
 * including width, cap style, compound line type, alignment, and fill.
 *
 * Reference: http://officeopenxml.com/drwSp-outline.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LineProperties">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
 *     <xsd:group ref="EG_LineDashProperties" minOccurs="0"/>
 *     <xsd:group ref="EG_LineJoinProperties" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="w" use="optional" type="a:ST_LineWidth"/>
 *   <xsd:attribute name="cap" use="optional" type="ST_LineCap"/>
 *   <xsd:attribute name="cmpd" use="optional" type="ST_CompoundLine"/>
 *   <xsd:attribute name="algn" use="optional" type="ST_PenAlignment"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create outline with RGB color
 * const outline = createOutline({
 *   width: 9525,
 *   cap: "ROUND",
 *   type: "solidFill",
 *   solidFillType: "rgb",
 *   value: "FF0000"
 * });
 * ```
 */
export const createOutline = (options: OutlineOptions): XmlComponent =>
    new BuilderElement<OutlineAttributes>({
        name: "a:ln",
        attributes: {
            width: {
                key: "w",
                value: options.width,
            },
            cap: {
                key: "cap",
                value: options.cap,
            },
            compoundLine: {
                key: "cmpd",
                value: options.compoundLine,
            },
            align: {
                key: "algn",
                value: options.align,
            },
        },
        children: [
            options.type === "noFill"
                ? createNoFill()
                : options.solidFillType === "rgb"
                  ? createSolidFill({
                        type: "rgb",
                        value: options.value,
                    })
                  : createSolidFill({
                        type: "scheme",
                        value: options.value,
                    }),
        ],
    });
