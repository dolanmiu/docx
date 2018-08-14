export interface IXmlableObject extends Object {
    _attr?: { [key: string]: string | number | boolean };
}

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND3 = "";
