/**
 * Custom Properties Attributes module for WordprocessingML documents.
 *
 * Provides namespace attributes for custom document properties.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML namespace attributes for the custom properties element.
 *
 * @property xmlns - Main namespace for custom properties
 * @property vt - Namespace for variant types
 */
export class CustomPropertiesAttributes extends XmlAttributeComponent<{
    /** Main namespace for custom properties */
    readonly xmlns: string;
    /** Namespace for variant types */
    readonly vt: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
        vt: "xmlns:vt",
    };
}
