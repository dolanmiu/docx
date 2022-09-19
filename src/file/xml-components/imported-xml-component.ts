import { Element as XmlElement, xml2js } from "xml-js";

import { IXmlableObject, XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { IContext } from "./base";

/**
 * Converts the given xml element (in json format) into XmlComponent.
 *
 * @param element the xml element in json presentation
 */

export const convertToXmlComponent = (element: XmlElement): ImportedXmlComponent | string | undefined => {
    switch (element.type) {
        case undefined:
        case "element":
            // eslint-disable-next-line no-case-declarations
            const xmlComponent = new ImportedXmlComponent(element.name as string, element.attributes);
            // eslint-disable-next-line no-case-declarations
            const childElements = element.elements || [];
            for (const childElm of childElements) {
                const child = convertToXmlComponent(childElm);
                if (child !== undefined) {
                    xmlComponent.push(child);
                }
            }
            return xmlComponent;
        case "text":
            return element.text as string;
        default:
            return undefined;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ImportedXmlComponentAttributes extends XmlAttributeComponent<any> {
    // noop
}

/**
 * Represents imported xml component from xml file.
 */
export class ImportedXmlComponent extends XmlComponent {
    /**
     * Converts the xml string to a XmlComponent tree.
     *
     * @param importedContent xml content of the imported component
     */
    public static fromXmlString(importedContent: string): ImportedXmlComponent {
        const xmlObj = xml2js(importedContent, { compact: false }) as XmlElement;
        return convertToXmlComponent(xmlObj) as ImportedXmlComponent;
    }
    /**
     * Converts the xml string to a XmlComponent tree.
     *
     * @param importedContent xml content of the imported component
     */

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(rootKey: string, _attr?: any) {
        super(rootKey);
        if (_attr) {
            this.root.push(new ImportedXmlComponentAttributes(_attr));
        }
    }

    public push(xmlComponent: XmlComponent | string): void {
        this.root.push(xmlComponent);
    }
}

/**
 * Used for the attributes of root element that is being imported.
 */
export class ImportedRootElementAttributes extends XmlComponent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(private readonly _attr: any) {
        super("");
    }

    public prepForXml(_: IContext): IXmlableObject {
        return {
            _attr: this._attr,
        };
    }
}
