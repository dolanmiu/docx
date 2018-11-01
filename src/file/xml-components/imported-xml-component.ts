// tslint:disable:no-any
import { Element as XmlElement, xml2js } from "xml-js";
import { IXmlableObject, XmlComponent } from ".";

/**
 * Converts the given xml element (in json format) into XmlComponent.
 * @param element the xml element in json presentation
 */

export function convertToXmlComponent(element: XmlElement): ImportedXmlComponent | string | undefined {
    switch (element.type) {
        case undefined:
        case "element":
            const xmlComponent = new ImportedXmlComponent(element.name as string, element.attributes);
            const childElments = element.elements || [];
            for (const childElm of childElments) {
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

    // tslint:disable-next-line:variable-name
    private readonly _attr: any;

    // tslint:disable-next-line:variable-name
    constructor(rootKey: string, _attr?: any) {
        super(rootKey);
        if (_attr) {
            this._attr = _attr;
        }
    }

    /**
     * Transforms the object so it can be converted to xml. Example:
     * <w:someKey someAttr="1" otherAttr="11">
     *    <w:child childAttr="2">
     *    </w:child>
     * </w:someKey>
     * {
     *   'w:someKey': [
     *      {
     *          _attr: {
     *              someAttr: "1",
     *              otherAttr: "11"
     *          }
     *      },
     *      {
     *          'w:child': [
     *              {
     *                  _attr: {
     *                      childAttr: "2"
     *                  }
     *              }
     *           ]
     *      }
     *    ]
     * }
     */
    public prepForXml(): IXmlableObject | undefined {
        const result = super.prepForXml();
        if (!result) {
            return undefined;
        }

        if (!!this._attr) {
            if (!Array.isArray(result[this.rootKey])) {
                result[this.rootKey] = [result[this.rootKey]];
            }
            result[this.rootKey].unshift({ _attr: this._attr });
        }
        return result;
    }

    public push(xmlComponent: XmlComponent | string): void {
        this.root.push(xmlComponent);
    }
}

/**
 * Used for the attributes of root element that is being imported.
 */
export class ImportedRootElementAttributes extends XmlComponent {
    // tslint:disable-next-line:variable-name
    constructor(private readonly _attr: any) {
        super("");
    }

    public prepForXml(): IXmlableObject {
        return {
            _attr: this._attr,
        };
    }
}
