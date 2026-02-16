/**
 * Font module for WordprocessingML documents.
 *
 * Provides support for font definitions and embedded fonts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_font-1.html
 *
 * @module
 */
import { BuilderElement, OnOffElement, XmlComponent, createStringElement } from "@file/xml-components";

/**
 * Options for a font relationship (embedded font).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_embedRegular-1.html
 *
 * @property id - Relationship to Part
 * @property fontKey - Embedded Font Obfuscation Key (GUID)
 * @property subsetted - Whether the embedded font is subsetted
 */
export type IFontRelationshipOptions = {
    /** Relationship to Part */
    readonly id: string;
    /** Embedded Font Obfuscation Key (GUID) */
    readonly fontKey?: string;
    /** Whether the embedded font is subsetted */
    readonly subsetted?: boolean;
};

/**
 * Character set constants for font definitions.
 * Maps character set names to their hexadecimal identifiers.
 */
export const CharacterSet = {
    ANSI: "00",
    DEFAULT: "01",
    SYMBOL: "02",
    MAC: "4D",
    JIS: "80",
    HANGUL: "81",
    JOHAB: "82",
    GB_2312: "86",
    CHINESEBIG5: "88",
    GREEK: "A1",
    TURKISH: "A2",
    VIETNAMESE: "A3",
    HEBREW: "B1",
    ARABIC: "B2",
    BALTIC: "BA",
    RUSSIAN: "CC",
    THAI: "DE",
    EASTEUROPE: "EE",
    OEM: "FF",
} as const;

/**
 * Options for defining a font in the document.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_font-1.html
 *
 * @property name - Font name (required)
 * @property altName - Alternative font name
 * @property panose1 - PANOSE-1 classification
 * @property charset - Character set identifier
 * @property family - Font family
 * @property notTrueType - Whether this is not a TrueType font
 * @property pitch - Font pitch
 * @property sig - Font signature (Unicode and code page ranges)
 * @property embedRegular - Embedded regular font relationship
 * @property embedBold - Embedded bold font relationship
 * @property embedItalic - Embedded italic font relationship
 * @property embedBoldItalic - Embedded bold-italic font relationship
 */
export type FontOptions = {
    /** Font name (required) */
    readonly name: string;
    /** Alternative font name */
    readonly altName?: string;
    /** PANOSE-1 classification */
    readonly panose1?: string;
    /** Character set identifier */
    readonly charset?: (typeof CharacterSet)[keyof typeof CharacterSet];
    /** Font family */
    readonly family?: string;
    /** Whether this is not a TrueType font */
    readonly notTrueType?: boolean;
    /** Font pitch */
    readonly pitch?: string;
    /** Font signature (Unicode and code page ranges) */
    readonly sig?: {
        /** Unicode Subset Bitfield 0 */
        readonly usb0: string;
        /** Unicode Subset Bitfield 1 */
        readonly usb1: string;
        /** Unicode Subset Bitfield 2 */
        readonly usb2: string;
        /** Unicode Subset Bitfield 3 */
        readonly usb3: string;
        /** Code Page Bitfield 0 */
        readonly csb0: string;
        /** Code Page Bitfield 1 */
        readonly csb1: string;
    };
    /** Embedded regular font relationship */
    readonly embedRegular?: IFontRelationshipOptions;
    /** Embedded bold font relationship */
    readonly embedBold?: IFontRelationshipOptions;
    /** Embedded italic font relationship */
    readonly embedItalic?: IFontRelationshipOptions;
    /** Embedded bold-italic font relationship */
    readonly embedBoldItalic?: IFontRelationshipOptions;
};

/**
 * Creates a font relationship element for embedding fonts.
 */
const createFontRelationship = ({ id, fontKey, subsetted }: IFontRelationshipOptions, name: string): XmlComponent =>
    new BuilderElement({
        name,
        attributes: {
            id: { key: "r:id", value: id },
            ...(fontKey ? { fontKey: { key: "w:fontKey", value: `{${fontKey}}` } } : {}),
        },
        children: [...(subsetted ? [new OnOffElement("w:subsetted", subsetted)] : [])],
    });

/**
 * Creates a font element with the specified options.
 *
 * This function builds a complete font definition including optional embedded font files,
 * font signature, character set, and other font properties.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_font-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Font">
 *   <xsd:sequence>
 *     <xsd:element name="altName" type="CT_String" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="panose1" type="CT_Panose" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="charset" type="CT_Charset" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="family" type="CT_FontFamily" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="notTrueType" type="CT_OnOff" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="pitch" type="CT_Pitch" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="sig" type="CT_FontSig" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="embedRegular" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="embedBold" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="embedItalic" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="embedBoldItalic" type="CT_FontRel" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="s:ST_String" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const font = createFont({
 *   name: "Arial",
 *   family: "swiss",
 *   pitch: "variable",
 *   charset: CharacterSet.ANSI
 * });
 * ```
 */
export const createFont = ({
    name,
    altName,
    panose1,
    charset,
    family,
    notTrueType,
    pitch,
    sig,
    embedRegular,
    embedBold,
    embedItalic,
    embedBoldItalic,
}: FontOptions): XmlComponent =>
    new BuilderElement({
        name: "w:font",
        attributes: {
            name: { key: "w:name", value: name },
        },
        children: [
            // http://www.datypic.com/sc/ooxml/e-w_altName-1.html
            ...(altName ? [createStringElement("w:altName", altName)] : []),
            // http://www.datypic.com/sc/ooxml/e-w_panose1-1.html
            ...(panose1 ? [createStringElement("w:panose1", panose1)] : []),
            // http://www.datypic.com/sc/ooxml/e-w_charset-1.html
            ...(charset ? [createStringElement("w:charset", charset)] : []),
            // http://www.datypic.com/sc/ooxml/e-w_family-1.html
            ...(family ? [createStringElement("w:family", family)] : []),
            // http://www.datypic.com/sc/ooxml/e-w_notTrueType-1.html
            ...(notTrueType ? [new OnOffElement("w:notTrueType", notTrueType)] : []),
            ...(pitch ? [createStringElement("w:pitch", pitch)] : []),
            // http://www.datypic.com/sc/ooxml/e-w_sig-1.html
            ...(sig
                ? [
                      new BuilderElement({
                          name: "w:sig",
                          attributes: {
                              usb0: { key: "w:usb0", value: sig.usb0 },
                              usb1: { key: "w:usb1", value: sig.usb1 },
                              usb2: { key: "w:usb2", value: sig.usb2 },
                              usb3: { key: "w:usb3", value: sig.usb3 },
                              csb0: { key: "w:csb0", value: sig.csb0 },
                              csb1: { key: "w:csb1", value: sig.csb1 },
                          },
                      }),
                  ]
                : []),
            // http://www.datypic.com/sc/ooxml/e-w_embedRegular-1.html
            ...(embedRegular ? [createFontRelationship(embedRegular, "w:embedRegular")] : []),
            // http://www.datypic.com/sc/ooxml/e-w_embedBold-1.html
            ...(embedBold ? [createFontRelationship(embedBold, "w:embedBold")] : []),
            // http://www.datypic.com/sc/ooxml/e-w_embedItalic-1.html
            ...(embedItalic ? [createFontRelationship(embedItalic, "w:embedItalic")] : []),
            // http://www.datypic.com/sc/ooxml/e-w_embedBoldItalic-1.html
            ...(embedBoldItalic ? [createFontRelationship(embedBoldItalic, "w:embedBoldItalic")] : []),
        ],
    });
