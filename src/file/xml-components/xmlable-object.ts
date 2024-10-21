export type IXmlAttribute = Readonly<Record<string, string | number | boolean>>;

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions
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
