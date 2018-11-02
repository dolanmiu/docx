import { BaseXmlComponent } from "./base";
import { IXmlableObject } from "./xmlable-object";

export type AttributeMap<T> = { [P in keyof T]: string };

export abstract class XmlAttributeComponent<T> extends BaseXmlComponent {
    // tslint:disable-next-line:readonly-keyword
    protected root: T;
    protected readonly xmlKeys: AttributeMap<T>;

    constructor(properties: T) {
        super("_attr");
        this.root = properties;
    }

    public prepForXml(): IXmlableObject {
        const attrs = {};
        Object.keys(this.root).forEach((key) => {
            const value = this.root[key];
            if (value !== undefined) {
                const newKey = this.xmlKeys[key];
                attrs[newKey] = value;
            }
        });
        return { _attr: attrs };
    }

    public set(properties: T): void {
        this.root = properties;
    }
}
