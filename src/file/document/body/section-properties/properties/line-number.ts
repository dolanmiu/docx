import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, decimalNumber, twipsMeasureValue } from "@util/values";

/**
 * This simple type specifies when the line numbering in the parent section shall be reset to its restart value. The line numbering increments for each line (even if the line number itself is not displayed) until it reaches the restart point specified by this element.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_LineNumberRestart_topic_ID0EUS42.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:simpleType name="ST_LineNumberRestart">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="newPage"/>
 *     <xsd:enumeration value="newSection"/>
 *     <xsd:enumeration value="continuous"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const LineNumberRestartFormat = {
    /**
     * ## Restart Line Numbering on Each Page
     *
     * Specifies that line numbering for the parent section shall restart to the starting value whenever a new page is displayed.
     */
    NEW_PAGE: "newPage",
    /**
     * ## Restart Line Numbering for Each Section
     *
     * Specifies that line numbering for the parent section shall restart to the starting value whenever the parent begins.
     */
    NEW_SECTION: "newSection",
    /**
     * ## Continue Line Numbering From Previous Section
     *
     * Specifies that line numbering for the parent section shall continue from the line numbering from the end of the previous section, if any.
     */
    CONTINUOUS: "continuous",
} as const;

export type ILineNumberAttributes = {
    /**
     * Specifies the line number increments to be displayed in the current document.
     *
     * Although each line has an associated line number, only lines which are an even multiple of this value shall be displayed.
     *
     * ### Example
     *
     * ```xml
     * <w:lnNumType … w:countBy="5"/>
     * ```
     *
     * This setting ensures that only lines whose number is a multiple of  (e.g. 5, 10, and 15) will have a line number displayed. ]
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly countBy?: number;
    /**
     * ## Line Numbering Starting Value
     *
     * Specifies the starting value used for the first line whenever the line numbering is restarted by use of the `restart` attribute.
     *
     * ### Example
     *
     * ```xml
     * <w:lnNumType w:start="3" w:countBy="5"/>
     * ```
     *
     * The `start` attribute specifies that line numbers shall be counted starting from the number 3.
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly start?: number;
    /**
     * ## Line Numbering Restart Setting
     *
     * Specifies when the line numbering in this section shall be reset to the line number specified by the `start` attribute's value.
     *
     * The line numbering increments for each line (even if it is not displayed) until it reaches the restart point specified by this element.
     *
     * ### Example
     *
     * ```xml
     * <w:sectPr>
     *   ...
     *   <w:lnNumType w:restart="newPage" ... />
     * </w:sectPr>
     * ```
     *
     * The value of `newPage` specifies that the line numbers shall restart at the top of each page to the value specified by the `start` attribute. In this case, `newPage` is the default, so this value could have been omitted entirely.
     *
     * The possible values for this attribute are defined by the ST_LineNumberRestart simple type (§2.18.54).
     */
    readonly restart?: (typeof LineNumberRestartFormat)[keyof typeof LineNumberRestartFormat];
    /**
     * Specifies the distance between the text margin and the edge of any line numbers appearing in that section.
     *
     * ```.xml
     * <w:lnNumType ... w:distance="720"/>
     * ```
     *
     * The possible values for this attribute are defined by the ST_TwipsMeasure simple type (§2.18.105).
     */
    readonly distance?: number | PositiveUniversalMeasure;
};

/**
 * This element specifies the settings for line numbering to be displayed before each column of text in this section in the document.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_lnNumType_topic_ID0EVRAT.html
 * - http://officeopenxml.com/WPsectionLineNumbering.php
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_LineNumber">
 *   <xsd:attribute name="countBy" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="start" type="ST_DecimalNumber" use="optional" default="1"/>
 *   <xsd:attribute name="distance" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="restart" type="ST_LineNumberRestart" use="optional" default="newPage"/>
 * </xsd:complexType>
 * ```
 */
export const createLineNumberType = ({ countBy, start, restart, distance }: ILineNumberAttributes): XmlComponent =>
    new BuilderElement<ILineNumberAttributes>({
        name: "w:lnNumType",
        attributes: {
            countBy: { key: "w:countBy", value: countBy === undefined ? undefined : decimalNumber(countBy) },
            start: { key: "w:start", value: start === undefined ? undefined : decimalNumber(start) },
            restart: { key: "w:restart", value: restart },
            distance: {
                key: "w:distance",
                value: distance === undefined ? undefined : twipsMeasureValue(distance),
            },
        },
    });
