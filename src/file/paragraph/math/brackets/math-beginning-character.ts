/**
 * Math Beginning Character module for Office MathML.
 *
 * This module provides the beginning (opening) character for bracket delimiters.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_begChr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for creating a beginning character element.
 */
type MathBeginningCharacterOptions = {
    /** The opening bracket character */
    readonly character: string;
};

/**
 * Creates a beginning character element for bracket delimiters.
 *
 * This element specifies the opening/beginning character for a delimiter object,
 * such as "(", "[", "{", or "⟨".
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_begChr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Char">
 *   <xsd:attribute name="val" type="ST_Char" use="required"/>
 * </xsd:complexType>
 * ```
 */
export const createMathBeginningCharacter = ({ character }: MathBeginningCharacterOptions): XmlComponent =>
    new BuilderElement<MathBeginningCharacterOptions>({
        name: "m:begChr",
        attributes: {
            character: { key: "m:val", value: character },
        },
    });
