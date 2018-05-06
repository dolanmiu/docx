// tslint:disable:no-any
import { IXmlableObject, XmlComponent } from "./";

/**
 * Represents imported xml component from xml file.
 */
export class ImportedXmlComponent extends XmlComponent {
    private attr: any;

    constructor(rootKey: string, attr?: any) {
        super(rootKey);

        if (attr) {
            this.attr = attr;
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
    public prepForXml(): IXmlableObject {
        const result = super.prepForXml();
        if (!!this.attr) {
            if (!Array.isArray(result[this.rootKey])) {
                result[this.rootKey] = [result[this.rootKey]];
            }
            result[this.rootKey].unshift({ _attr: this.attr });
        }
        return result;
    }

    public push(xmlComponent: XmlComponent): void {
        this.root.push(xmlComponent);
    }
}

/**
 * Used for the attributes of root element that is being imported.
 */
export class ImportedRootElementAttributes extends XmlComponent {
    constructor(private attr: any) {
        super("");
    }

    public prepForXml(): IXmlableObject {
        return {
            _attr: this.attr,
        };
    }
}
