/**
 * Paragraph style module for WordprocessingML documents.
 *
 * Paragraph styles define formatting that applies to entire paragraphs.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { IParagraphStylePropertiesOptions, IRunStylePropertiesOptions, ParagraphProperties } from "@file/paragraph";
import { RunProperties } from "@file/paragraph/run/properties";

import { IStyleOptions, Style } from "./style";

/**
 * Base options for paragraph style configuration.
 *
 * @property paragraph - Paragraph properties (alignment, spacing, indentation, etc.)
 * @property run - Run properties that apply to text within this paragraph style
 */
export type IBaseParagraphStyleOptions = {
    /** Paragraph properties (alignment, spacing, indentation, etc.) */
    readonly paragraph?: IParagraphStylePropertiesOptions;
    /** Run properties that apply to text within this paragraph style */
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

/**
 * Options for creating a paragraph style.
 *
 * @property id - Unique identifier for the paragraph style
 */
export type IParagraphStyleOptions = {
    /** Unique identifier for the paragraph style */
    readonly id: string;
} & IBaseParagraphStyleOptions;

/**
 * Represents a paragraph style in a WordprocessingML document.
 *
 * Paragraph styles apply formatting to entire paragraphs, including both
 * paragraph-level properties (spacing, alignment, indentation) and
 * run-level properties (font, size, color) for text within the paragraph.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <!-- Style elements including pPr for paragraph properties -->
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a custom heading style
 * new StyleForParagraph({
 *   id: "CustomHeading",
 *   name: "Custom Heading",
 *   basedOn: "Normal",
 *   paragraph: {
 *     spacing: { before: 240, after: 120 },
 *     alignment: AlignmentType.LEFT
 *   },
 *   run: {
 *     size: 28,
 *     bold: true,
 *     color: "2E74B5"
 *   }
 * });
 * ```
 */
export class StyleForParagraph extends Style {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    public constructor(options: IParagraphStyleOptions) {
        super({ type: "paragraph", styleId: options.id }, options);

        this.paragraphProperties = new ParagraphProperties(options.paragraph);
        this.runProperties = new RunProperties(options.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }
}
