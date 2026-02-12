/**
 * Paragraph and table alignment module for WordprocessingML documents.
 *
 * This module provides justification (alignment) options for paragraphs and tables.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * @see http://officeopenxml.com/WPtableAlignment.php
 * @see http://www.datypic.com/sc/ooxml/t-w_ST_Jc.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Paragraph justification (alignment) types.
 *
 * Specifies the horizontal alignment of text within a paragraph.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Jc">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="start"/>
 *     <xsd:enumeration value="center"/>
 *     <xsd:enumeration value="end"/>
 *     <xsd:enumeration value="both"/>
 *     <xsd:enumeration value="mediumKashida"/>
 *     <xsd:enumeration value="distribute"/>
 *     <xsd:enumeration value="numTab"/>
 *     <xsd:enumeration value="highKashida"/>
 *     <xsd:enumeration value="lowKashida"/>
 *     <xsd:enumeration value="thaiDistribute"/>
 *     <xsd:enumeration value="left"/>
 *     <xsd:enumeration value="right"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const AlignmentType = {
    /** Align Start */
    START: "start",
    /** Align Center */
    CENTER: "center",
    /** End */
    END: "end",
    /** Justified */
    BOTH: "both",
    /** Medium Kashida Length */
    MEDIUM_KASHIDA: "mediumKashida",
    /** Distribute All Characters Equally */
    DISTRIBUTE: "distribute",
    /** Align to List Tab */
    NUM_TAB: "numTab",
    /** Widest Kashida Length */
    HIGH_KASHIDA: "highKashida",
    /** Low Kashida Length */
    LOW_KASHIDA: "lowKashida",
    /** Thai Language Justification */
    THAI_DISTRIBUTE: "thaiDistribute",
    /** Align Left */
    LEFT: "left",
    /** Align Right */
    RIGHT: "right",
    /** Justified */
    JUSTIFIED: "both",
} as const;

/**
 * Creates paragraph alignment (justification) element for a WordprocessingML document.
 *
 * The jc element specifies the horizontal alignment of all text in the paragraph.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Jc">
 *   <xsd:attribute name="val" type="ST_Jc" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   alignment: AlignmentType.CENTER,
 *   children: [new TextRun("Centered text")],
 * });
 * ```
 */
export const createAlignment = (type: (typeof AlignmentType)[keyof typeof AlignmentType]): XmlComponent =>
    new BuilderElement<{ readonly val: (typeof AlignmentType)[keyof typeof AlignmentType] }>({
        name: "w:jc",
        attributes: {
            val: { key: "w:val", value: type },
        },
    });
