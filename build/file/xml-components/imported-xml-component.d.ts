import { Element as XmlElement } from "xml-js";
import { IXmlableObject, XmlComponent } from ".";
import { IContext } from "./base";
export declare function convertToXmlComponent(element: XmlElement): ImportedXmlComponent | string | undefined;
export declare class ImportedXmlComponent extends XmlComponent {
    static fromXmlString(importedContent: string): ImportedXmlComponent;
    constructor(rootKey: string, _attr?: any);
    push(xmlComponent: XmlComponent | string): void;
}
export declare class ImportedRootElementAttributes extends XmlComponent {
    private readonly _attr;
    constructor(_attr: any);
    prepForXml(_: IContext): IXmlableObject;
}
