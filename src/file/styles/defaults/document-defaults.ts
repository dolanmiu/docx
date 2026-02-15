/**
 * Document defaults module for WordprocessingML styles.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { IParagraphStylePropertiesOptions } from "@file/paragraph/properties";
import { IRunStylePropertiesOptions } from "@file/paragraph/run/properties";
import { XmlComponent } from "@file/xml-components";

import { ParagraphPropertiesDefaults } from "./paragraph-properties";
import { RunPropertiesDefaults } from "./run-properties";

/**
 * Options for configuring document-wide default formatting.
 *
 * @property paragraph - Default paragraph properties applied to all paragraphs
 * @property run - Default run properties applied to all text runs
 */
export type IDocumentDefaultsOptions = {
    /** Default paragraph properties applied to all paragraphs */
    readonly paragraph?: IParagraphStylePropertiesOptions;
    /** Default run properties applied to all text runs */
    readonly run?: IRunStylePropertiesOptions;
};

/**
 * Represents document-wide default formatting in a WordprocessingML document.
 *
 * Document defaults define the base formatting properties that apply to all
 * paragraphs and runs in a document unless overridden by a style or direct formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DocDefaults">
 *   <xsd:sequence>
 *     <xsd:element name="rPrDefault" type="CT_RPrDefault" minOccurs="0"/>
 *     <xsd:element name="pPrDefault" type="CT_PPrDefault" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default font and spacing for the document
 * new DocumentDefaults({
 *   run: {
 *     font: "Calibri",
 *     size: 22
 *   },
 *   paragraph: {
 *     spacing: { after: 200, line: 276 }
 *   }
 * });
 * ```
 */
export class DocumentDefaults extends XmlComponent {
    private readonly runPropertiesDefaults: RunPropertiesDefaults;
    private readonly paragraphPropertiesDefaults: ParagraphPropertiesDefaults;

    public constructor(options: IDocumentDefaultsOptions) {
        super("w:docDefaults");

        this.runPropertiesDefaults = new RunPropertiesDefaults(options.run);
        this.paragraphPropertiesDefaults = new ParagraphPropertiesDefaults(options.paragraph);

        this.root.push(this.runPropertiesDefaults);
        this.root.push(this.paragraphPropertiesDefaults);
    }
}
