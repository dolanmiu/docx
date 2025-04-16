import { BuilderElement, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

/**
 * This simple type specifies the orientation of all pages in the parent section. This information is used to determine the actual paper size to use when printing the file.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_PageOrientation_topic_ID0EKBK3.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:simpleType name="ST_PageOrientation">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="portrait"/>
 *     <xsd:enumeration value="landscape"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const PageOrientation = {
    /**
     * ## Portrait Mode
     *
     * Specifies that pages in this section shall be printed in portrait mode.
     */
    PORTRAIT: "portrait",
    /**
     * ## Landscape Mode
     *
     * Specifies that pages in this section shall be printed in landscape mode, which prints the page contents with a 90 degree rotation with respect to the normal page orientation.
     */
    LANDSCAPE: "landscape",
} as const;

export type IPageSizeAttributes = {
    /**
     * ## Page Width
     *
     * This attribute indicates the width (in twentieths of a point) for all pages in the current section.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" />
     * ```
     *
     * All pages in this section are displayed on a page that is 15840 twentieths of a point (11") wide.
     *
     * The possible values for this attribute are defined by the ST_TwipsMeasure simple type (§2.18.105).
     */
    readonly width: number | PositiveUniversalMeasure;
    /**
     * ## Page Height
     *
     * Specifies the height (in twentieths of a point) for all pages in the current section.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" />
     * ```
     *
     * All pages in this section are displayed on a page that is `12240` twentieths of a point (`8.5"`) tall.
     *
     * The possible values for this attribute are defined by the `ST_TwipsMeasure` simple type (§2.18.105).
     */
    readonly height: number | PositiveUniversalMeasure;
    /**
     * ## Page Orientation
     *
     * Specifies the orientation of all pages in this section.
     *
     * This information is used to determine the actual paper size to use on the printer.
     *
     * This implies that the actual paper size width and height are reversed for pages in this section. If this attribute is omitted, then portrait shall be implied.
     *
     * ### Example
     *
     * ```xml
     * <w:pgSz w:w="15840" w:h="12240" w:orient="landscape" />
     * ```
     *
     * Although the page width is 11", and page height is 8.5", according to the `w` and `h` attributes, because the `orient` attribute is set to landscape, pages in this section are printed on 8.5x11" paper in landscape mode.
     *
     * The possible values for this attribute are defined by the `ST_PageOrientation` simple type (§2.18.71).
     */
    readonly orientation?: (typeof PageOrientation)[keyof typeof PageOrientation];
    /**
     * ## Printer Paper Code
     *
     * Specifies a printer-specific paper code for the paper type, which shall be used by the printer for pages in this section.
     *
     * This code is stored to ensure the proper paper type is chosen if the specified paper size matches the sizes of multiple paper types supported by the current printer.
     *
     * It will be sent to the printer and used by the printer to determine the appropriate paper type to use when printing.
     *
     * This value is not interpreted or modified other than storing it as specified by the printer.
     *
     * The possible values for this attribute are defined by the `ST_DecimalNumber` simple type (§2.18.16).
     */
    readonly code?: number;
};

/**
 * This element specifies the properties (size and orientation) for all pages in the current section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_pgSz_topic_ID0ENEDT.html?hl=pgsz%2Cpage%2Csize
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_PageSz">
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="h" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="orient" type="ST_PageOrientation" use="optional"/>
 *   <xsd:attribute name="code" type="ST_DecimalNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export const createPageSize = ({ width, height, orientation, code }: IPageSizeAttributes): XmlComponent => {
    const widthTwips = twipsMeasureValue(width);
    const heightTwips = twipsMeasureValue(height);
    return new BuilderElement<IPageSizeAttributes>({
        name: "w:pgSz",
        attributes: {
            width: { key: "w:w", value: orientation === PageOrientation.LANDSCAPE ? heightTwips : widthTwips },
            height: { key: "w:h", value: orientation === PageOrientation.LANDSCAPE ? widthTwips : heightTwips },
            orientation: { key: "w:orient", value: orientation },
            code: { key: "w:code", value: code },
        },
    });
};
