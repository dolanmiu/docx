/**
 * Subscript and superscript module for WordprocessingML documents.
 *
 * This module provides vertical alignment elements for subscript
 * and superscript text formatting.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

/**
 * Abstract base class for vertical text alignment.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_VerticalAlignRun">
 *   <xsd:attribute name="val" type="ST_VerticalAlignRun" use="required"/>
 * </xsd:complexType>
 * <xsd:simpleType name="ST_VerticalAlignRun">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="baseline"/>
 *     <xsd:enumeration value="superscript"/>
 *     <xsd:enumeration value="subscript"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @internal
 */
export abstract class VerticalAlign extends XmlComponent {
    public constructor(type: string) {
        super("w:vertAlign");
        this.root.push(
            new Attributes({
                val: type,
            }),
        );
    }
}

/**
 * Represents superscript text formatting.
 *
 * Raises text above the baseline, commonly used for exponents
 * and ordinal indicators.
 *
 * @example
 * ```typescript
 * // In run properties for superscript text
 * new SuperScript();
 * ```
 *
 * @internal
 */
export class SuperScript extends VerticalAlign {
    public constructor() {
        super("superscript");
    }
}

/**
 * Represents subscript text formatting.
 *
 * Lowers text below the baseline, commonly used for chemical
 * formulas and footnote references.
 *
 * @example
 * ```typescript
 * // In run properties for subscript text
 * new SubScript();
 * ```
 *
 * @internal
 */
export class SubScript extends VerticalAlign {
    public constructor() {
        super("subscript");
    }
}
