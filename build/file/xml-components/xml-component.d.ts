import { BaseXmlComponent } from "./base";
import { IXmlableObject } from "./xmlable-object";
export { BaseXmlComponent };
export declare abstract class XmlComponent extends BaseXmlComponent {
    protected root: Array<BaseXmlComponent | string>;
    constructor(rootKey: string);
    prepForXml(): IXmlableObject;
}
