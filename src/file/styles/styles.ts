/**
 * Styles module for WordprocessingML documents.
 *
 * This module provides style definitions for paragraphs and characters.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import type { IDefaultStylesOptions } from "@file/styles/factory";
import { type BaseXmlComponent, type IContext, type IXmlableObject, type ImportedXmlComponent, XmlComponent } from "@file/xml-components";

import { StyleForCharacter, StyleForParagraph } from "./style";
import type { ICharacterStyleOptions } from "./style/character-style";
import type { IParagraphStyleOptions } from "./style/paragraph-style";

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
    /**
     * Default styles for document, headings, and common elements. With `externalStyles`, each one given here takes the
     * place of the external style with its id, or of the external document defaults
     */
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

/** The name of a formatted element, such as `w:style`, or `_attr` for its parent's attributes */
const nameOf = (child: unknown): string | undefined => (typeof child === "object" ? Object.keys(child as object)[0] : undefined);

/** The id of a formatted `w:style` */
const styleIdOf = (style: IXmlableObject): string | undefined => [style["w:style"]].flat().find((part) => part._attr)?._attr["w:styleId"];

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

    /**
     * Writes the styles in the schema's order: the document defaults, the latent styles, then the styles. A style id
     * can only be used once, so a style replaces an earlier one with its id. That way external styles replace docx's
     * default styles, and paragraph and character styles replace the default and imported ones. Of several document
     * defaults, or several latent styles, the last is kept.
     */
    public prepForXml(context: IContext): IXmlableObject {
        const xml = super.prepForXml(context) as IXmlableObject;
        const children: unknown = xml["w:styles"];
        if (!Array.isArray(children)) {
            return xml;
        }
        const named = (name: string): readonly unknown[] => children.filter((child) => nameOf(child) === name);
        const ids = children.map((child) => (nameOf(child) === "w:style" ? styleIdOf(child) : undefined));
        const styles = children.filter(
            (child, index) =>
                !["_attr", "w:docDefaults", "w:latentStyles"].includes(nameOf(child) as string) &&
                (ids[index] === undefined || ids.lastIndexOf(ids[index]) === index),
        );
        return {
            "w:styles": [...named("_attr"), ...named("w:docDefaults").slice(-1), ...named("w:latentStyles").slice(-1), ...styles],
        };
    }
}
