/**
 * App Properties Attributes module for WordprocessingML documents.
 *
 * Provides namespace attributes for extended document properties.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesExtended.xsd
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML namespace attributes for the app properties element.
 *
 * @property xmlns - Main namespace for extended properties
 * @property vt - Namespace for variant types
 */
export class AppPropertiesAttributes extends XmlAttributeComponent<{
    /** Main namespace for extended properties */
    readonly xmlns: string;
    /** Namespace for variant types */
    readonly vt: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
        vt: "xmlns:vt",
    };
}
