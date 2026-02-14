/**
 * Custom Property Attributes module for WordprocessingML documents.
 *
 * Provides attributes for individual custom document properties.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML attributes for a custom property element.
 *
 * @property formatId - Format identifier (GUID)
 * @property pid - Property identifier (unique ID)
 * @property name - Property name
 */
export class CustomPropertyAttributes extends XmlAttributeComponent<{
    /** Format identifier (GUID) */
    readonly formatId: string;
    /** Property identifier (unique ID) */
    readonly pid: string;
    /** Property name */
    readonly name: string;
}> {
    protected readonly xmlKeys = {
        formatId: "fmtid",
        pid: "pid",
        name: "name",
    };
}
