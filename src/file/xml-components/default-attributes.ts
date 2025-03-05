import { BaseXmlComponent, IContext } from "./base";
import { IXmlAttribute, IXmlableObject } from "./xmlable-object";

export type AttributeMap<T> = Record<keyof T, string>;

export type AttributeData = Record<string, boolean | number | string>;
export type AttributePayload<T> = { readonly [P in keyof T]: { readonly key: string; readonly value: T[P] } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class XmlAttributeComponent<T extends Record<string, any>> extends BaseXmlComponent {
    protected readonly xmlKeys?: AttributeMap<T>;

    public constructor(private readonly root: T) {
        super("_attr");
    }

    public prepForXml(_: IContext): IXmlableObject {
        const attrs: Record<string, string> = {};
        Object.entries(this.root).forEach(([key, value]) => {
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
