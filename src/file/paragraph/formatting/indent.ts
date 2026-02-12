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
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, UniversalMeasure, signedTwipsMeasureValue, twipsMeasureValue } from "@util/values";

/**
 * Properties for configuring paragraph indentation.
 *
 * Values can be specified as numbers (in twips) or as universal measures (e.g., "1in", "2.5cm").
 */
export type IIndentAttributesProperties = {
    readonly start?: number | UniversalMeasure;
    readonly end?: number | UniversalMeasure;
    readonly left?: number | UniversalMeasure;
    readonly right?: number | UniversalMeasure;
    readonly hanging?: number | PositiveUniversalMeasure;
    readonly firstLine?: number | PositiveUniversalMeasure;
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
export const createIndent = ({ start, end, left, right, hanging, firstLine }: IIndentAttributesProperties): XmlComponent =>
    new BuilderElement<IIndentAttributesProperties>({
        name: "w:ind",
        attributes: {
            start: { key: "w:start", value: start === undefined ? undefined : signedTwipsMeasureValue(start) },
            end: { key: "w:end", value: end === undefined ? undefined : signedTwipsMeasureValue(end) },
            left: { key: "w:left", value: left === undefined ? undefined : signedTwipsMeasureValue(left) },
            right: { key: "w:right", value: right === undefined ? undefined : signedTwipsMeasureValue(right) },
            hanging: { key: "w:hanging", value: hanging === undefined ? undefined : twipsMeasureValue(hanging) },
            firstLine: { key: "w:firstLine", value: firstLine === undefined ? undefined : twipsMeasureValue(firstLine) },
        },
    });
