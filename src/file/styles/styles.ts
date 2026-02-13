/**
 * Styles module for WordprocessingML documents.
 *
 * This module provides style definitions for paragraphs and characters.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { IDefaultStylesOptions } from "@file/styles/factory";
import { BaseXmlComponent, ImportedXmlComponent, XmlComponent } from "@file/xml-components";

import { StyleForCharacter, StyleForParagraph } from "./style";
import { ICharacterStyleOptions } from "./style/character-style";
import { IParagraphStyleOptions } from "./style/paragraph-style";

/**
 * Options for configuring document styles.
 *
 * @property default - Default styles for document, headings, and common elements
 * @property initialStyles - Initial base XML component for styles root element
 * @property paragraphStyles - Array of custom paragraph style definitions
 * @property characterStyles - Array of custom character style definitions
 * @property importedStyles - Array of styles imported from external sources
 *
 * @see {@link Styles}
 */
export type IStylesOptions = {
    /** Default styles for document, headings, and common elements */
    readonly default?: IDefaultStylesOptions;
    /** Initial base XML component for styles root element */
    readonly initialStyles?: BaseXmlComponent;
    /** Array of custom paragraph style definitions */
    readonly paragraphStyles?: readonly IParagraphStyleOptions[];
    /** Array of custom character style definitions */
    readonly characterStyles?: readonly ICharacterStyleOptions[];
    /** Array of styles imported from external sources */
    readonly importedStyles?: readonly (XmlComponent | StyleForParagraph | StyleForCharacter | ImportedXmlComponent)[];
};

/**
 * Represents the styles definitions in a WordprocessingML document.
 *
 * The styles element contains document defaults, latent styles, and
 * individual style definitions for paragraphs and characters. Styles provide
 * a way to define consistent formatting across a document.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Styles">
 *   <xsd:sequence>
 *     <xsd:element name="docDefaults" type="CT_DocDefaults" minOccurs="0"/>
 *     <xsd:element name="latentStyles" type="CT_LatentStyles" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="style" type="CT_Style" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create styles with custom paragraph and character styles
 * new Styles({
 *   paragraphStyles: [{
 *     id: "CustomHeading",
 *     name: "Custom Heading",
 *     basedOn: "Normal",
 *     run: { bold: true, size: 28 }
 *   }],
 *   characterStyles: [{
 *     id: "Highlight",
 *     name: "Highlight",
 *     run: { color: "FF0000" }
 *   }]
 * });
 * ```
 */
export class Styles extends XmlComponent {
    public constructor(options: IStylesOptions) {
        super("w:styles");

        if (options.initialStyles) {
            this.root.push(options.initialStyles);
        }

        if (options.importedStyles) {
            for (const style of options.importedStyles) {
                this.root.push(style);
            }
        }

        if (options.paragraphStyles) {
            for (const style of options.paragraphStyles) {
                this.root.push(new StyleForParagraph(style));
            }
        }

        if (options.characterStyles) {
            for (const style of options.characterStyles) {
                this.root.push(new StyleForCharacter(style));
            }
        }
    }
}
