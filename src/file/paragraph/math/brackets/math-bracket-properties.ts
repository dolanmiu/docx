/**
 * Math Bracket Properties module for Office MathML.
 *
 * This module provides properties for bracket delimiters in math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_dPr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createMathBeginningCharacter } from "./math-beginning-character";
import { createMathEndingCharacter } from "./math-ending-char";

/**
 * Options for creating math bracket properties.
 */
type MathBracketPropertiesOptions = {
    /** Optional custom characters for bracket delimiters */
    readonly characters?: {
        /** The opening/beginning bracket character */
        readonly beginningCharacter: string;
        /** The closing/ending bracket character */
        readonly endingCharacter: string;
    };
};

/**
 * Creates bracket properties for math delimiter objects.
 *
 * This element specifies properties for the delimiter object,
 * including custom beginning and ending characters.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_dPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DPr">
 *   <xsd:sequence>
 *     <xsd:element name="begChr" type="CT_Char" minOccurs="0"/>
 *     <xsd:element name="sepChr" type="CT_Char" minOccurs="0"/>
 *     <xsd:element name="endChr" type="CT_Char" minOccurs="0"/>
 *     <xsd:element name="grow" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="shp" type="CT_Shp" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathBracketProperties = ({ characters }: MathBracketPropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "m:dPr",
        children: !!characters
            ? [
                  createMathBeginningCharacter({ character: characters.beginningCharacter }),
                  createMathEndingCharacter({ character: characters.endingCharacter }),
              ]
            : [],
    });
