export interface IXmlableObject extends Object {
    _attr?: { [key: string]: (string | number | boolean) };
}
