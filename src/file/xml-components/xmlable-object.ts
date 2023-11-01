export interface IXmlAttribute {
    readonly [key: string]: string | number | boolean;
}
export interface IXmlableObject extends Record<string, unknown> {
    // readonly _attr?: IXmlAttribute;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly [key: string]: any;
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND3 = "";
