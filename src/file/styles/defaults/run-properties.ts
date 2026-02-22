import { type IRunStylePropertiesOptions, RunProperties } from "@file/paragraph/run/properties";
import { XmlComponent } from "@file/xml-components";

/**
 * Represents default run properties in a WordprocessingML document.
 *
 * This element defines the default text run formatting properties that apply
 * to all text runs in the document unless overridden by styles or direct formatting.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RPrDefault">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set default font and size
 * new RunPropertiesDefaults({
 *   font: "Calibri",
 *   size: 22
 * });
 * ```
 */
export class RunPropertiesDefaults extends XmlComponent {
    public constructor(options?: IRunStylePropertiesOptions) {
        super("w:rPrDefault");

        this.root.push(new RunProperties(options));
    }
}
