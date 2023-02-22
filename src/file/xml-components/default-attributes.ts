import { BaseXmlComponent, IContext } from "./base";
import { IXmlableObject, IXmlAttribute } from "./xmlable-object";

export type AttributeMap<T> = { readonly [P in keyof T]: string };

export type AttributeData = { readonly [key: string]: boolean | number | string };
export type AttributePayload<T> = { readonly [P in keyof T]: { readonly key: string; readonly value: T[P] } };

export abstract class XmlAttributeComponent<T extends object> extends BaseXmlComponent {
    protected readonly xmlKeys?: AttributeMap<T>;

    public constructor(private readonly root: T) {
        super("_attr");
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

export class NextAttributeComponent<T extends AttributeData> extends BaseXmlComponent {
    public constructor(private readonly root: AttributePayload<T>) {
        super("_attr");
    }

    public prepForXml(_: IContext): IXmlableObject {
        const attrs = Object.values<{ readonly key: string; readonly value: string | boolean | number }>(this.root)
            .filter(({ value }) => value !== undefined)
            .reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as IXmlAttribute);
        return { _attr: attrs };
    }
}
