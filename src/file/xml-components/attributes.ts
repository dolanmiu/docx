/**
 * Common XML attributes module for WordprocessingML elements.
 *
 * This module provides a reusable Attributes class with commonly used
 * WordprocessingML attribute mappings.
 *
 * @module
 */
import { XmlAttributeComponent } from "./default-attributes";

/**
 * Common XML attributes used across WordprocessingML elements.
 *
 * This class provides a convenient way to add common attributes to XML elements.
 * It automatically maps JavaScript-friendly property names to their corresponding
 * w: (WordprocessingML) namespace prefixed XML attribute names.
 *
 * @example
 * ```typescript
 * // Create an element with a value attribute
 * new Attributes({ val: "someValue" });
 * // Generates: <element w:val="someValue"/>
 *
 * // Multiple attributes
 * new Attributes({ color: "FF0000", sz: "24" });
 * // Generates: <element w:color="FF0000" w:sz="24"/>
 * ```
 */
export class Attributes extends XmlAttributeComponent<{
    /** Generic value attribute (w:val). */
    readonly val?: string | number | boolean;
    /** Color value (w:color). */
    readonly color?: string;
    /** Fill color (w:fill). */
    readonly fill?: string;
    /** Space preservation (w:space). */
    readonly space?: string;
    /** Size value (w:sz). */
    readonly sz?: string;
    /** Type specification (w:type). */
    readonly type?: string;
    /** Revision ID for run content (w:rsidR). */
    readonly rsidR?: string;
    /** Revision ID for run properties (w:rsidRPr). */
    readonly rsidRPr?: string;
    /** Revision ID for section (w:rsidSect). */
    readonly rsidSect?: string;
    /** Width (w:w). */
    readonly w?: string;
    /** Height (w:h). */
    readonly h?: string;
    /** Top margin/spacing (w:top). */
    readonly top?: string;
    /** Right margin/spacing (w:right). */
    readonly right?: string;
    /** Bottom margin/spacing (w:bottom). */
    readonly bottom?: string;
    /** Left margin/spacing (w:left). */
    readonly left?: string;
    /** Header margin (w:header). */
    readonly header?: string;
    /** Footer margin (w:footer). */
    readonly footer?: string;
    /** Gutter margin (w:gutter). */
    readonly gutter?: string;
    /** Line pitch (w:linePitch). */
    readonly linePitch?: string;
    /** Position value (w:pos). */
    readonly pos?: string | number;
}> {
    protected readonly xmlKeys = {
        val: "w:val",
        color: "w:color",
        fill: "w:fill",
        space: "w:space",
        sz: "w:sz",
        type: "w:type",
        rsidR: "w:rsidR",
        rsidRPr: "w:rsidRPr",
        rsidSect: "w:rsidSect",
        w: "w:w",
        h: "w:h",
        top: "w:top",
        right: "w:right",
        bottom: "w:bottom",
        left: "w:left",
        header: "w:header",
        footer: "w:footer",
        gutter: "w:gutter",
        linePitch: "w:linePitch",
        pos: "w:pos",
    };
}
