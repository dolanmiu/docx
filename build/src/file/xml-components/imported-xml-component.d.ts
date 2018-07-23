import { XmlComponent, IXmlableObject } from ".";
export declare const parseOptions: {
    ignoreAttributes: boolean;
    attributeNamePrefix: string;
    attrNodeName: string;
};
export declare function convertToXmlComponent(elementName: string, element: any): ImportedXmlComponent | ImportedXmlComponent[];
export declare class ImportedXmlComponent extends XmlComponent {
    private _attr;
    constructor(rootKey: string, _attr?: any);
    prepForXml(): IXmlableObject;
    push(xmlComponent: XmlComponent): void;
    static fromXmlString(importedContent: string): ImportedXmlComponent;
}
export declare class ImportedRootElementAttributes extends XmlComponent {
    private _attr;
    constructor(_attr: any);
    prepForXml(): IXmlableObject;
}
