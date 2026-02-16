/**
 * Math Accent Character module for Office MathML.
 *
 * This module provides the accent character for n-ary operators.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_chr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for creating an accent character element.
 */
type MathAccentCharacterOptions = {
    /** The n-ary operator character (e.g., "∑", "∫", "∏") */
    readonly accent: string;
};

/**
 * Creates an accent character element for n-ary operators.
 *
 * This element specifies the character used for the n-ary operator,
 * such as summation (∑), integral (∫), or product (∏) symbols.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_chr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Char">
 *   <xsd:attribute name="val" type="ST_Char" use="required"/>
 * </xsd:complexType>
 * ```
 */
export const createMathAccentCharacter = ({ accent }: MathAccentCharacterOptions): XmlComponent =>
    new BuilderElement<MathAccentCharacterOptions>({
        name: "m:chr",
        attributes: {
            accent: { key: "m:val", value: accent },
        },
    });
