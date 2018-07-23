import { IXmlableObject } from "./xmlable-object";
export declare abstract class BaseXmlComponent {
    protected rootKey: string;
    protected deleted: boolean;
    constructor(rootKey: string);
    abstract prepForXml(): IXmlableObject;
    readonly isDeleted: boolean;
}
