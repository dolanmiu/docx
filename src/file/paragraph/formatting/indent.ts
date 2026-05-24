/**
 * Paragraph indentation module for WordprocessingML documents.
 *
 * This module provides indentation options for paragraphs including left, right,
 * hanging, and first line indentation.
 *
 * Reference: http://officeopenxml.com/WPindentation.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import {
    type PositiveUniversalMeasure,
    type UniversalMeasure,
    decimalNumber,
    signedTwipsMeasureValue,
    twipsMeasureValue,
} from "@util/values";

/**
 * Properties for configuring paragraph indentation.
 *
 * Values can be specified as numbers (in twips) or as universal measures (e.g., "1in", "2.5cm").
 */
export type IIndentAttributesProperties = {
    // Indentation from the leading edge — left in LTR, right in RTL (ST_SignedTwipsMeasure)
    readonly start?: number | UniversalMeasure;
    // Indentation from the trailing edge — right in LTR, left in RTL (ST_SignedTwipsMeasure)
    readonly end?: number | UniversalMeasure;
    // Indentation from the left margin (ST_SignedTwipsMeasure)
    readonly left?: number | UniversalMeasure;
    // Indentation from the right margin (ST_SignedTwipsMeasure)
    readonly right?: number | UniversalMeasure;
    // Hanging indent removed from the first line (ST_TwipsMeasure)
    readonly hanging?: number | PositiveUniversalMeasure;
    // Additional first-line indent in twips (ST_TwipsMeasure)
    readonly firstLine?: number | PositiveUniversalMeasure;
    // Hundredths of a character width (ST_DecimalNumber); e.g. 200 = 2 characters
    readonly firstLineChars?: number;
};

/**
 * Creates paragraph indentation element for a WordprocessingML document.
 *
 * The ind element specifies the indentation of the paragraph from the margins.
 *
 * Reference: http://officeopenxml.com/WPindentation.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Ind">
 *   <xsd:attribute name="start" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="startChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="end" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="endChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="left" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="leftChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="right" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="rightChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="hanging" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="hangingChars" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="firstLine" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="firstLineChars" type="ST_DecimalNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export const createIndent = ({ start, end, left, right, hanging, firstLine, firstLineChars }: IIndentAttributesProperties): XmlComponent =>
    new BuilderElement<IIndentAttributesProperties>({
        name: "w:ind",
        attributes: {
            start: { key: "w:start", value: start === undefined ? undefined : signedTwipsMeasureValue(start) },
            end: { key: "w:end", value: end === undefined ? undefined : signedTwipsMeasureValue(end) },
            left: { key: "w:left", value: left === undefined ? undefined : signedTwipsMeasureValue(left) },
            right: { key: "w:right", value: right === undefined ? undefined : signedTwipsMeasureValue(right) },
            hanging: { key: "w:hanging", value: hanging === undefined ? undefined : twipsMeasureValue(hanging) },
            firstLine: { key: "w:firstLine", value: firstLine === undefined ? undefined : twipsMeasureValue(firstLine) },
            firstLineChars: { key: "w:firstLineChars", value: firstLineChars === undefined ? undefined : decimalNumber(firstLineChars) },
        },
    });
