/**
 * Character style module for WordprocessingML documents.
 *
 * Character styles define formatting that applies to individual text runs.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { type IRunStylePropertiesOptions, RunProperties } from "@file/paragraph/run/properties";

import { type IStyleOptions, Style } from "./style";

/**
 * Base options for character style configuration.
 *
 * @property run - Run properties (font, size, color, etc.) for this character style
 */
export type IBaseCharacterStyleOptions = {
    /** Run properties (font, size, color, etc.) for this character style */
    readonly run?: IRunStylePropertiesOptions;
} & IStyleOptions;

/**
 * Options for creating a character style.
 *
 * @property id - Unique identifier for the character style
 */
export type ICharacterStyleOptions = {
    /** Unique identifier for the character style */
    readonly id: string;
} & IBaseCharacterStyleOptions;

/**
 * Represents a character style in a WordprocessingML document.
 *
 * Character styles apply formatting to individual runs of text within a paragraph,
 * such as font, size, color, bold, italic, and other text-level formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <!-- Style elements including rPr for run properties -->
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a custom character style for highlighting
 * new StyleForCharacter({
 *   id: "Highlight",
 *   name: "Highlight Text",
 *   basedOn: "DefaultParagraphFont",
 *   run: {
 *     color: "FF0000",
 *     bold: true
 *   }
 * });
 * ```
 */
export class StyleForCharacter extends Style {
    private readonly runProperties: RunProperties;

    public constructor(options: ICharacterStyleOptions) {
        super(
            { type: "character", styleId: options.id },
            {
                uiPriority: 99,
                unhideWhenUsed: true,
                ...options,
            },
        );

        this.runProperties = new RunProperties(options.run);
        this.root.push(this.runProperties);
    }
}
