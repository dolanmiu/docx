/**
 * Math Ending Character module for Office MathML.
 *
 * This module provides the ending (closing) character for bracket delimiters.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_endChr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for creating an ending character element.
 */
type MathEndingCharacterOptions = {
    /** The closing bracket character */
    readonly character: string;
};

/**
 * Creates an ending character element for bracket delimiters.
 *
 * This element specifies the closing/ending character for a delimiter object,
 * such as ")", "]", "}", or "⟩".
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_endChr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Char">
 *   <xsd:attribute name="val" type="ST_Char" use="required"/>
 * </xsd:complexType>
 * ```
 */
export const createMathEndingCharacter = ({ character }: MathEndingCharacterOptions): XmlComponent =>
    new BuilderElement<MathEndingCharacterOptions>({
        name: "m:endChr",
        attributes: {
            character: { key: "m:val", value: character },
        },
    });
