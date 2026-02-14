/**
 * Custom Property module for WordprocessingML documents.
 *
 * Provides support for individual custom document properties.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { CustomPropertyAttributes } from "./custom-property-attributes";

/**
 * Options for creating a custom property.
 *
 * @property name - The property name
 * @property value - The property value (as string)
 */
export type ICustomPropertyOptions = {
    /** The property name */
    readonly name: string;
    /** The property value (as string) */
    readonly value: string;
};

/**
 * Represents a single custom document property.
 *
 * Custom properties allow storing arbitrary key-value pairs in the document metadata.
 * Each property has a unique name and a string value.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Property">
 *   <xsd:sequence>
 *     <xsd:element name="lpwstr" type="xsd:string" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="fmtid" type="ST_Guid" use="required"/>
 *   <xsd:attribute name="pid" type="xsd:int" use="required"/>
 *   <xsd:attribute name="name" type="xsd:string"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const customProp = new CustomProperty(2, {
 *   name: "Department",
 *   value: "Engineering"
 * });
 * ```
 */
export class CustomProperty extends XmlComponent {
    public constructor(id: number, properties: ICustomPropertyOptions) {
        super("property");
        this.root.push(
            new CustomPropertyAttributes({
                formatId: "{D5CDD505-2E9C-101B-9397-08002B2CF9AE}",
                pid: id.toString(),
                name: properties.name,
            }),
        );
        this.root.push(new CustomPropertyValue(properties.value));
    }
}

/**
 * Represents the value of a custom property.
 * Uses the variant type "long pointer to wide string" for string values.
 */
export class CustomPropertyValue extends XmlComponent {
    public constructor(value: string) {
        super("vt:lpwstr");
        this.root.push(value);
    }
}
