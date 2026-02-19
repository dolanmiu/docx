/**
 * Emphasis mark module for WordprocessingML run properties.
 *
 * This module provides support for East Asian emphasis marks, which are
 * characters placed above or below text to emphasize it.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

/**
 * Emphasis mark types.
 *
 * Defines the types of emphasis marks that can be applied to text.
 * Emphasis marks are commonly used in East Asian typography.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Em">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="dot"/>
 *     <xsd:enumeration value="comma"/>
 *     <xsd:enumeration value="circle"/>
 *     <xsd:enumeration value="underDot"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const EmphasisMarkType = {
    /** Dot emphasis mark */
    DOT: "dot",
} as const;

/**
 * Base class for emphasis mark elements.
 *
 * @internal
 */
export abstract class BaseEmphasisMark extends XmlComponent {
    protected constructor(emphasisMarkType: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType]) {
        super("w:em");
        this.root.push(
            new Attributes({
                val: emphasisMarkType,
            }),
        );
    }
}

/**
 * Represents an emphasis mark in a WordprocessingML document.
 *
 * Emphasis marks are characters (typically dots or circles) placed above or below
 * text to emphasize it. This is commonly used in East Asian typography.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Em">
 *   <xsd:attribute name="val" type="ST_Em" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Apply dot emphasis mark
 * new EmphasisMark(EmphasisMarkType.DOT);
 *
 * // Default to dot
 * new EmphasisMark();
 * ```
 */
export class EmphasisMark extends BaseEmphasisMark {
    public constructor(emphasisMarkType: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType] = EmphasisMarkType.DOT) {
        super(emphasisMarkType);
    }
}

/**
 * Represents a dot emphasis mark.
 *
 * Convenience class for applying a dot emphasis mark to text.
 *
 * @example
 * ```typescript
 * new DotEmphasisMark();
 * ```
 */
export class DotEmphasisMark extends BaseEmphasisMark {
    public constructor() {
        super(EmphasisMarkType.DOT);
    }
}
