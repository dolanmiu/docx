/**
 * Math N-Ary Properties module for Office MathML.
 *
 * This module provides properties for n-ary operators (sum, integral, etc.) in math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createMathAccentCharacter } from "./math-accent-character";
import { createMathLimitLocation } from "./math-limit-location";
import { createMathSubScriptHide } from "./math-sub-script-hide";
import { createMathSuperScriptHide } from "./math-super-script-hide";

/**
 * Options for creating n-ary properties.
 */
type MathNAryPropertiesOptions = {
    /** The n-ary operator character (e.g., "∑" for sum, "∫" for integral) */
    readonly accent: string;
    /** Whether the n-ary has a superscript (upper limit) */
    readonly hasSuperScript: boolean;
    /** Whether the n-ary has a subscript (lower limit) */
    readonly hasSubScript: boolean;
    /** Location of limits: "undOvr" (under/over) or "subSup" (subscript/superscript) */
    readonly limitLocationVal?: string;
};

/**
 * Creates properties for n-ary operator structures.
 *
 * This element specifies properties for n-ary objects like summations
 * and integrals, including the operator character and limit positioning.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_naryPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NaryPr">
 *   <xsd:sequence>
 *     <xsd:element name="chr" type="CT_Char" minOccurs="0"/>
 *     <xsd:element name="limLoc" type="CT_LimLoc" minOccurs="0"/>
 *     <xsd:element name="grow" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="subHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="supHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathNAryProperties = ({
    accent,
    hasSuperScript,
    hasSubScript,
    limitLocationVal,
}: MathNAryPropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "m:naryPr",
        children: [
            ...(!!accent ? [createMathAccentCharacter({ accent })] : []),
            createMathLimitLocation({ value: limitLocationVal }),
            ...(!hasSuperScript ? [createMathSuperScriptHide()] : []),
            ...(!hasSubScript ? [createMathSubScriptHide()] : []),
        ],
    });
