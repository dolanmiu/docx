import { BaseXmlComponent, IContext } from "./base";
import { IXmlableObject } from "./xmlable-object";

export type AttributeMap<T> = { readonly [P in keyof T]: string };

export abstract class XmlAttributeComponent<T extends object> extends BaseXmlComponent {
    // tslint:disable-next-line:readonly-keyword
    protected readonly root: T;
    protected readonly xmlKeys?: AttributeMap<T>;

    public constructor(properties: T) {
        super("_attr");
        this.root = properties;
    }

    public prepForXml(_: IContext): IXmlableObject {
        const attrs = {};
        Object.keys(this.root).forEach((key) => {
            const value = this.root[key];
            if (value !== undefined) {
                const newKey = (this.xmlKeys && this.xmlKeys[key]) || key;
                // eslint-disable-next-line functional/immutable-data
                attrs[newKey] = value;
            }
        });
        return { _attr: attrs };
    }
}
