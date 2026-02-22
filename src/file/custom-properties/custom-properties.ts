/**
 * Custom Properties module for WordprocessingML documents.
 *
 * Provides support for managing custom document properties collection.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * @module
 */
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { CustomPropertiesAttributes } from "./custom-properties-attributes";
import { CustomProperty, type ICustomPropertyOptions } from "./custom-property";

/**
 * Represents the collection of custom document properties.
 *
 * Custom properties allow storing arbitrary metadata as name-value pairs.
 * Each property is assigned a unique ID starting from 2 (per Office specification).
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesCustom.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_CustomProperties">
 *   <xsd:sequence>
 *     <xsd:element name="property" type="CT_Property" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const customProps = new CustomProperties([
 *   { name: "Department", value: "Engineering" },
 *   { name: "Project", value: "Alpha" }
 * ]);
 * ```
 */
export class CustomProperties extends XmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type
    private nextId: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly properties: CustomProperty[] = [];

    public constructor(properties: readonly ICustomPropertyOptions[]) {
        super("Properties");

        this.root.push(
            new CustomPropertiesAttributes({
                xmlns: "http://schemas.openxmlformats.org/officeDocument/2006/custom-properties",
                vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
            }),
        );

        // I'm not sure why, but every example I have seen starts with 2
        // https://docs.microsoft.com/en-us/office/open-xml/how-to-set-a-custom-property-in-a-word-processing-document
        this.nextId = 2;

        for (const property of properties) {
            this.addCustomProperty(property);
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.properties.forEach((x) => this.root.push(x));
        return super.prepForXml(context);
    }

    public addCustomProperty(property: ICustomPropertyOptions): void {
        // eslint-disable-next-line functional/immutable-data
        this.properties.push(new CustomProperty(this.nextId++, property));
    }
}
