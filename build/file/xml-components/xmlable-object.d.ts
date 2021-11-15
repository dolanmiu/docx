export interface IXmlAttribute {
    readonly [key: string]: string | number | boolean;
}
export interface IXmlableObject extends Object {
    readonly _attr?: IXmlAttribute;
}
export declare const WORKAROUND3 = "";
