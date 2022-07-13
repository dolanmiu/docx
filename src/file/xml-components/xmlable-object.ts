import { XmlObject } from "xml";

export interface IXmlAttribute {
    readonly [key: string]: string | number | boolean;
}
export type IXmlableObject = XmlObject & {
    readonly _attr?: IXmlAttribute;
};

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND3 = "";
