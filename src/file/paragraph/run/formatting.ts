/**
 * Run formatting module for WordprocessingML documents.
 *
 * This module provides character-level formatting elements including
 * spacing, color, and highlighting.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";
import { UniversalMeasure, hexColorValue, signedTwipsMeasureValue } from "@util/values";

/**
 * Represents character spacing (tracking) in a run.
 *
 * Adjusts the space between characters in the text.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SignedTwipsMeasure">
 *   <xsd:attribute name="val" type="ST_SignedTwipsMeasure" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CharacterSpacing(20); // 20 twips (1 point)
 * new CharacterSpacing("0.5pt"); // Half point
 * ```
 *
 * @internal
 */
export class CharacterSpacing extends XmlComponent {
    public constructor(value: number | UniversalMeasure) {
        super("w:spacing");
        this.root.push(
            new Attributes({
                val: signedTwipsMeasureValue(value),
            }),
        );
    }
}

/**
 * Represents text color in a run.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Color">
 *   <xsd:attribute name="val" type="ST_HexColor" use="required"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Color("FF0000"); // Red text
 * new Color("auto"); // Automatic color
 * ```
 *
 * @internal
 */
export class Color extends XmlComponent {
    public constructor(color: string) {
        super("w:color");
        this.root.push(
            new Attributes({
                val: hexColorValue(color),
            }),
        );
    }
}

/**
 * Represents text highlighting in a run.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HighlightColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="black"/>
 *     <xsd:enumeration value="blue"/>
 *     <xsd:enumeration value="cyan"/>
 *     <xsd:enumeration value="green"/>
 *     <xsd:enumeration value="magenta"/>
 *     <xsd:enumeration value="red"/>
 *     <xsd:enumeration value="yellow"/>
 *     <xsd:enumeration value="white"/>
 *     <xsd:enumeration value="darkBlue"/>
 *     <xsd:enumeration value="darkCyan"/>
 *     <xsd:enumeration value="darkGreen"/>
 *     <xsd:enumeration value="darkMagenta"/>
 *     <xsd:enumeration value="darkRed"/>
 *     <xsd:enumeration value="darkYellow"/>
 *     <xsd:enumeration value="darkGray"/>
 *     <xsd:enumeration value="lightGray"/>
 *     <xsd:enumeration value="none"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * new Highlight("yellow"); // Yellow highlight
 * new Highlight("cyan"); // Cyan highlight
 * ```
 *
 * @internal
 */
export class Highlight extends XmlComponent {
    public constructor(color: string) {
        super("w:highlight");
        this.root.push(
            new Attributes({
                val: color,
            }),
        );
    }
}

/**
 * Represents text highlighting for complex scripts.
 *
 * Used for highlighting text in complex script languages
 * (e.g., Arabic, Hebrew, Thai).
 *
 * @internal
 */
export class HighlightComplexScript extends XmlComponent {
    public constructor(color: string) {
        super("w:highlightCs");
        this.root.push(
            new Attributes({
                val: color,
            }),
        );
    }
}
