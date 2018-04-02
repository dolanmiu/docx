import { IXmlableObject } from "./xmlable-object";
export declare abstract class BaseXmlComponent {
    protected rootKey: string;
    constructor(rootKey: string);
    abstract prepForXml(): IXmlableObject;
}
