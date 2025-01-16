import { BuilderElement, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Specifies the type of the current document grid, which defines the grid behavior.
 *
 * The grid can define a grid which snaps all East Asian characters to grid positions, but leaves Latin text with its default spacing; a grid which adds the specified character pitch to all characters on each row; or a grid which affects only the line pitch for the current section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_DocGrid_topic_ID0ELYP2.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_DocGrid">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="default"/>
 *     <xsd:enumeration value="lines"/>
 *     <xsd:enumeration value="linesAndChars"/>
 *     <xsd:enumeration value="snapToChars"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const DocumentGridType = {
    /**
     * Specifies that no document grid shall be applied to the contents of the current section in the document.
     */
    DEFAULT: "default",
    /**
     * Specifies that the parent section shall have additional line pitch added to each line within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain the specified number of lines per page.
     */
    LINES: "lines",
    /**
     * Specifies that the parent section shall have both the additional line pitch and character pitch added to each line and character within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain a specific number of lines per page and characters per line.
     *
     * When this value is set, the input specified via the user interface may be allowed in exact number of line/character pitch units. */
    LINES_AND_CHARS: "linesAndChars",
    /**
     * Specifies that the parent section shall have both the additional line pitch and character pitch added to each line and character within it (as specified on the <docGrid> element (§2.6.5)) in order to maintain a specific number of lines per page and characters per line.
     *
     * When this value is set, the input specified via the user interface may be restricted to the number of lines per page and characters per line, with the consumer or producer translating this information based on the current font data to get the resulting line and character pitch values
     */
    SNAP_TO_CHARS: "snapToChars",
} as const;

export type IDocGridAttributesProperties = {
    /**
     * Specifies the type of the current document grid, which defines the grid behavior.
     *
     * The grid can define a grid which snaps all East Asian characters to grid positions, but leaves Latin text with its default spacing; a grid which adds the specified character pitch to each character on each row; or a grid which affects only the line pitch for the current section.
     */
    readonly type?: (typeof DocumentGridType)[keyof typeof DocumentGridType];
    /**
     * Specifies the number of lines to be allowed on the document grid for the current page assuming all lines have equal line pitch applied to them. This line pitch shall not be added to any line which appears within a table cell unless the <adjustLineHeightInTable> element (§2.15.3.1) is present in the document's compatibility settings.
     *
     * This attribute is specified in twentieths of a point, and defines the pitch for each line of text on this page such that the desired number of single spaced lines of text fits on the current page.
     *
     * ```xml
     * <w:docGrid w:linePitch="684" …/>
     * ```
     *
     * The `linePitch` attribute specifies that 34.2 points is to the amount of pitch allowed for each line on this page in order to maintain the specific document grid. ]
     *
     * Individual paragraphs can override the line pitch information specified for the document grid by either:
     *
     * Specifying an exact line spacing value using the `lineRule` attribute of value exact on the <spacing> element (§2.3.1.33).
     *
     * Specifying that the paragraph text shall not snap to the document grid via the <snapToGrid> element (§2.3.1.32).
     *
     * The possible values for this attribute are defined by the ST_DecimalNumber simple type (§2.18.16).
     */
    readonly linePitch: number;
    /**
     * Specifies the number of characters to be allowed on the document grid for each line in this section.
     *
     * This attribute's value shall be specified by multiplying the difference between the desired character pitch and the character pitch for that character in the font size of the Normal font by 4096.
     *
     * This value shall then be used to add the character pitch for the specified point size to each character in the section [: This results in text in the Normal style having a specific number of characters per line. ]
     *
     * ```xml
     * <w:docGrid w:charSize="40960" …/>
     * ```
     * The `charSpace` attribute specifies a value of 40960, which means that the delta between the character pitch of each character in the grid and the Normal font is 10 points, resulting in a character pitch of 11+10 = 21 points for all characters in this section. ]
     *
     * Individual runs of text can override the line pitch information specified for the document grid by specifying that the run text shall not snap to the document grid via the <snapToGrid> element (§2.3.2.32).
     *
     * The possible values for this attribute are defined by the `ST_DecimalNumber` simple type (§2.18.16).
     */
    readonly charSpace?: number;
};

/**
 * This element specifies the settings for the document grid, which enables precise layout of full-width East Asian language characters within a document by specifying the desired number of characters per line and lines per page for all East Asian text content in this section.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_docGrid_topic_ID0EHU5S.html
 *
 * ```xml
 * <xsd:complexType name="CT_DocGrid">
 *   <xsd:attribute name="type" type="ST_DocGrid"/>
 *   <xsd:attribute name="linePitch" type="ST_DecimalNumber"/>
 *   <xsd:attribute name="charSpace" type="ST_DecimalNumber"/>
 * </xsd:complexType>
 * ```
 * @returns
 */
export const createDocumentGrid = ({ type, linePitch, charSpace }: IDocGridAttributesProperties): XmlComponent =>
    new BuilderElement<IDocGridAttributesProperties>({
        name: "w:docGrid",
        attributes: {
            type: { key: "w:type", value: type },
            linePitch: { key: "w:linePitch", value: decimalNumber(linePitch) },
            charSpace: { key: "w:charSpace", value: charSpace ? decimalNumber(charSpace) : undefined },
        },
    });
