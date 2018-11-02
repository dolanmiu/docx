export interface IXmlAttribute {
    readonly [key: string]: string | number | boolean;
}
export interface IXmlableObject extends Object {
    readonly _attr?: IXmlAttribute;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND3 = "";
