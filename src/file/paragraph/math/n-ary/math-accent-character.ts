/**
 * Math Accent Character module for Office MathML.
 *
 * This module provides the character of an n-ary operator, such as ∑ or ∫. Despite its name, it isn't an accent: for
 * an accent over math, such as a hat or a vector's arrow, use `MathAccent` from `docx/math`.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_chr-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Options for creating an accent character element.
 */
type MathAccentCharacterOptions = {
    /** The n-ary operator character (e.g., "∑", "∫", "∏") */
    readonly accent: string;
};

/**
 * Creates the character of an n-ary operator (`m:chr`), such as summation (∑), integral (∫) or product (∏).
 *
 * It isn't an accent, despite its name. To put an accent over math, such as x̂ or a vector's arrow x⃗, use
 * `MathAccent` from `docx/math`.
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
