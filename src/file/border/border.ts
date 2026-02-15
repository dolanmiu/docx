/**
 * Border module for WordprocessingML documents.
 *
 * Borders are used in multiple contexts (paragraphs, tables, table cells, sections)
 * and share the same CT_Border type definition. This module provides the createBorderElement
 * factory function and BorderStyle constants used throughout the document structure.
 *
 * Reference: http://officeopenxml.com/WPborders.php
 *
 * @see http://officeopenxml.com/WPtableBorders.php
 * @see http://officeopenxml.com/WPtableCellProperties-Borders.php
 * @see http://officeopenxml.com/WPsectionBorders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Border">
 *   <xsd:attribute name="val" type="ST_Border" use="required"/>
 *   <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="sz" type="ST_EighthPointMeasure" use="optional"/>
 *   <xsd:attribute name="space" type="ST_PointMeasure" use="optional" default="0"/>
 *   <xsd:attribute name="shadow" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="frame" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { eighthPointMeasureValue, hexColorValue, pointMeasureValue } from "@util/values";

/**
 * Options for configuring a border element.
 *
 * @property style - The border style (single, dashed, dotted, etc.)
 * @property color - Border color in hex format (e.g., "FF00AA" for purple)
 * @property size - Border thickness in eighths of a point (1/8 pt)
 * @property space - Spacing offset from the content in points
 */
export type IBorderOptions = {
    readonly style: (typeof BorderStyle)[keyof typeof BorderStyle];
    /** Border color, in hex (eg 'FF00AA') */
    readonly color?: string;
    /** Size of the border in 1/8 pt */
    readonly size?: number;
    /** Spacing offset. Values are specified in pt */
    readonly space?: number;
};

/**
 * Creates a border element for a WordprocessingML document.
 *
 * Used to create border specifications for paragraphs, tables, table cells,
 * and sections. The element name is specified to create different border
 * types (top, bottom, left, right, etc.).
 *
 * @example
 * ```typescript
 * // Create a top border
 * createBorderElement("w:top", {
 *   style: BorderStyle.SINGLE,
 *   color: "FF0000",
 *   size: 24,
 *   space: 1,
 * });
 * ```
 */
export const createBorderElement = (elementName: string, { color, size, space, style }: IBorderOptions): XmlComponent =>
    new BuilderElement<IBorderOptions>({
        name: elementName,
        attributes: {
            style: { key: "w:val", value: style },
            color: { key: "w:color", value: color === undefined ? undefined : hexColorValue(color) },
            size: { key: "w:sz", value: size === undefined ? undefined : eighthPointMeasureValue(size) },
            space: { key: "w:space", value: space === undefined ? undefined : pointMeasureValue(space) },
        },
    });

/**
 * Table borders are defined with the <w:tblBorders> element. Child elements of this element specify the kinds of `border`:
 *
 * `bottom`, `end` (`right` in the previous version of the standard), `insideH`, `insideV`, `start` (`left` in the previous version of the standard), and `top`.
 *
 * Reference: http://officeopenxml.com/WPtableBorders.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Border">
 *     <xsd:restriction base="xsd:string">
 *          <xsd:enumeration value="single"/>
 *          <xsd:enumeration value="dashDotStroked"/>
 *          <xsd:enumeration value="dashed"/>
 *          <xsd:enumeration value="dashSmallGap"/>
 *          <xsd:enumeration value="dotDash"/>
 *          <xsd:enumeration value="dotDotDash"/>
 *          <xsd:enumeration value="dotted"/>
 *          <xsd:enumeration value="double"/>
 *          <xsd:enumeration value="doubleWave"/>
 *          <xsd:enumeration value="inset"/>
 *          <xsd:enumeration value="nil"/>
 *          <xsd:enumeration value="none"/>
 *          <xsd:enumeration value="outset"/>
 *          <xsd:enumeration value="thick"/>
 *          <xsd:enumeration value="thickThinLargeGap"/>
 *          <xsd:enumeration value="thickThinMediumGap"/>
 *          <xsd:enumeration value="thickThinSmallGap"/>
 *          <xsd:enumeration value="thinThickLargeGap"/>
 *          <xsd:enumeration value="thinThickMediumGap"/>
 *          <xsd:enumeration value="thinThickSmallGap"/>
 *          <xsd:enumeration value="thinThickThinLargeGap"/>
 *          <xsd:enumeration value="thinThickThinMediumGap"/>
 *          <xsd:enumeration value="thinThickThinSmallGap"/>
 *          <xsd:enumeration value="threeDEmboss"/>
 *          <xsd:enumeration value="threeDEngrave"/>
 *          <xsd:enumeration value="triple"/>
 *          <xsd:enumeration value="wave"/>
 *     </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const BorderStyle = {
    /** a single line */
    SINGLE: "single",
    /** a line with a series of alternating thin and thick strokes */
    DASH_DOT_STROKED: "dashDotStroked",
    /** a dashed line */
    DASHED: "dashed",
    /** a dashed line with small gaps */
    DASH_SMALL_GAP: "dashSmallGap",
    /** a line with alternating dots and dashes */
    DOT_DASH: "dotDash",
    /** a line with a repeating dot - dot - dash sequence */
    DOT_DOT_DASH: "dotDotDash",
    /** a dotted line */
    DOTTED: "dotted",
    /** a double line */
    DOUBLE: "double",
    /** a double wavy line */
    DOUBLE_WAVE: "doubleWave",
    /** an inset set of lines */
    INSET: "inset",
    /** no border */
    NIL: "nil",
    /** no border */
    NONE: "none",
    /** an outset set of lines */
    OUTSET: "outset",
    /** a single line */
    THICK: "thick",
    /** a thick line contained within a thin line with a large-sized intermediate gap */
    THICK_THIN_LARGE_GAP: "thickThinLargeGap",
    /** a thick line contained within a thin line with a medium-sized intermediate gap */
    THICK_THIN_MEDIUM_GAP: "thickThinMediumGap",
    /** a thick line contained within a thin line with a small intermediate gap */
    THICK_THIN_SMALL_GAP: "thickThinSmallGap",
    /** a thin line contained within a thick line with a large-sized intermediate gap */
    THIN_THICK_LARGE_GAP: "thinThickLargeGap",
    /** a thick line contained within a thin line with a medium-sized intermediate gap */
    THIN_THICK_MEDIUM_GAP: "thinThickMediumGap",
    /** a thick line contained within a thin line with a small intermediate gap */
    THIN_THICK_SMALL_GAP: "thinThickSmallGap",
    /** a thin-thick-thin line with a large gap */
    THIN_THICK_THIN_LARGE_GAP: "thinThickThinLargeGap",
    /** a thin-thick-thin line with a medium gap */
    THIN_THICK_THIN_MEDIUM_GAP: "thinThickThinMediumGap",
    /** a thin-thick-thin line with a small gap */
    THIN_THICK_THIN_SMALL_GAP: "thinThickThinSmallGap",
    /** a three-staged gradient line, getting darker towards the paragraph */
    THREE_D_EMBOSS: "threeDEmboss",
    /** a three-staged gradient like, getting darker away from the paragraph */
    THREE_D_ENGRAVE: "threeDEngrave",
    /** a triple line */
    TRIPLE: "triple",
    /** a wavy line */
    WAVE: "wave",
} as const;
