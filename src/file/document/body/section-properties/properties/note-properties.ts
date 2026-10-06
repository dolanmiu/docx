/**
 * Footnote and endnote properties module for WordprocessingML section properties.
 *
 * Defines where and how the footnotes and endnotes of a section are placed and numbered.
 *
 * @module
 */
import type { NumberFormat } from "@file/shared/number-format";
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Where the footnotes of a section are placed.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_FtnPos">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="pageBottom"/>
 *     <xsd:enumeration value="beneathText"/>
 *     <xsd:enumeration value="sectEnd"/>
 *     <xsd:enumeration value="docEnd"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const FootnotePosition = {
    /** At the bottom of each page */
    PAGE_BOTTOM: "pageBottom",
    /** Directly below the text on each page */
    BENEATH_TEXT: "beneathText",
    /** At the end of the section */
    SECTION_END: "sectEnd",
    /** At the end of the document */
    DOCUMENT_END: "docEnd",
} as const;

/**
 * Where the endnotes of a section are placed.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_EdnPos">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="sectEnd"/>
 *     <xsd:enumeration value="docEnd"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const EndnotePosition = {
    /** At the end of the section */
    SECTION_END: "sectEnd",
    /** At the end of the document */
    DOCUMENT_END: "docEnd",
} as const;

/**
 * When the footnote or endnote numbering restarts.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_RestartNumber">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="continuous"/>
 *     <xsd:enumeration value="eachSect"/>
 *     <xsd:enumeration value="eachPage"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const NoteNumberRestart = {
    /** Numbering never restarts */
    CONTINUOUS: "continuous",
    /** Numbering restarts in each section */
    EACH_SECTION: "eachSect",
    /** Numbering restarts on each page */
    EACH_PAGE: "eachPage",
} as const;

/**
 * Number format of the footnotes or endnotes of a section.
 *
 * @property type - Number format (decimal, roman, letter, etc.)
 * @property format - Pattern used with `NumberFormat.CUSTOM`, such as "001"
 */
export type INoteNumberFormatOptions = {
    /** Number format (decimal, roman, letter, etc.) */
    readonly type: (typeof NumberFormat)[keyof typeof NumberFormat];
    /** Pattern used with `NumberFormat.CUSTOM`, such as "001" */
    readonly format?: string;
};

type INotePropertiesBaseOptions = {
    /** Number format of the notes */
    readonly numberFormat?: INoteNumberFormatOptions;
    /** Number of the first note */
    readonly start?: number;
    /** When the numbering restarts */
    readonly restart?: (typeof NoteNumberRestart)[keyof typeof NoteNumberRestart];
};

/**
 * Footnote settings of a section.
 *
 * @property position - Where the footnotes are placed
 * @property numberFormat - Number format of the footnotes
 * @property start - Number of the first footnote
 * @property restart - When the numbering restarts
 */
export type IFootnotePropertiesOptions = INotePropertiesBaseOptions & {
    /** Where the footnotes are placed */
    readonly position?: (typeof FootnotePosition)[keyof typeof FootnotePosition];
};

/**
 * Endnote settings of a section.
 *
 * @property position - Where the endnotes are placed
 * @property numberFormat - Number format of the endnotes
 * @property start - Number of the first endnote
 * @property restart - When the numbering restarts
 */
export type IEndnotePropertiesOptions = INotePropertiesBaseOptions & {
    /** Where the endnotes are placed */
    readonly position?: (typeof EndnotePosition)[keyof typeof EndnotePosition];
};

const createNoteProperties = ({
    name,
    position,
    numberFormat,
    start,
    restart,
}: INotePropertiesBaseOptions & { readonly name: string; readonly position?: string }): XmlComponent =>
    new BuilderElement({
        name,
        children: [
            ...(position === undefined
                ? []
                : [new BuilderElement({ name: "w:pos", attributes: { val: { key: "w:val", value: position } } })]),
            ...(numberFormat
                ? [
                      new BuilderElement<{ readonly val: string; readonly format?: string }>({
                          name: "w:numFmt",
                          attributes: {
                              val: { key: "w:val", value: numberFormat.type },
                              format: { key: "w:format", value: numberFormat.format },
                          },
                      }),
                  ]
                : []),
            ...(start === undefined
                ? []
                : [new BuilderElement({ name: "w:numStart", attributes: { val: { key: "w:val", value: decimalNumber(start) } } })]),
            ...(restart === undefined
                ? []
                : [new BuilderElement({ name: "w:numRestart", attributes: { val: { key: "w:val", value: restart } } })]),
        ],
    });

/**
 * Creates the footnote properties (footnotePr) of a section.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FtnProps">
 *   <xsd:sequence>
 *     <xsd:element name="pos" type="CT_FtnPos" minOccurs="0"/>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
 *     <xsd:group ref="EG_FtnEdnNumProps" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Footnotes at the end of the section, numbered a, b, c and restarting in each section
 * createFootnoteProperties({
 *   position: FootnotePosition.SECTION_END,
 *   numberFormat: { type: NumberFormat.LOWER_LETTER },
 *   restart: NoteNumberRestart.EACH_SECTION,
 * });
 * ```
 */
export const createFootnoteProperties = (options: IFootnotePropertiesOptions): XmlComponent =>
    createNoteProperties({ name: "w:footnotePr", ...options });

/**
 * Creates the endnote properties (endnotePr) of a section.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_EdnProps">
 *   <xsd:sequence>
 *     <xsd:element name="pos" type="CT_EdnPos" minOccurs="0"/>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
 *     <xsd:group ref="EG_FtnEdnNumProps" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Endnotes at the end of the document, numbered 001, 002, 003
 * createEndnoteProperties({
 *   position: EndnotePosition.DOCUMENT_END,
 *   numberFormat: { type: NumberFormat.CUSTOM, format: "001" },
 * });
 * ```
 */
export const createEndnoteProperties = (options: IEndnotePropertiesOptions): XmlComponent =>
    createNoteProperties({ name: "w:endnotePr", ...options });
