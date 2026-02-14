import { IParagraphStylePropertiesOptions, ParagraphProperties } from "@file/paragraph/properties";
import { XmlComponent } from "@file/xml-components";

/**
 * Represents default paragraph properties in a WordprocessingML document.
 *
 * This element defines the default paragraph formatting properties that apply
 * to all paragraphs in the document unless overridden.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PPrDefault">
 *   <xsd:sequence>
 *     <xsd:element name="pPr" type="CT_PPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default paragraph spacing
 * new ParagraphPropertiesDefaults({
 *   spacing: { after: 200, line: 276 }
 * });
 * ```
 */
export class ParagraphPropertiesDefaults extends XmlComponent {
    public constructor(options?: IParagraphStylePropertiesOptions) {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties(options));
    }
}
