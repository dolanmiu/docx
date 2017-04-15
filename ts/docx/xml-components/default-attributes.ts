import { BaseXmlComponent } from "./base";

type AttributeMap<T> = {[P in keyof T]: string};

export abstract class XmlAttributeComponent<T> extends BaseXmlComponent {
    protected root: T;
    protected xmlKeys: AttributeMap<T>;

    constructor(properties: T) {
        super("_attr");
        this.root = properties;
    }

    public prepForXml(): XmlableObject {
        const attrs = {};
        Object.keys(this.root).forEach((key) => {
            const value = this.root[key];
            if (value !== undefined) {
                const newKey = this.xmlKeys[key];
                attrs[newKey] = value;
            }
        });
        return {_attr: attrs};
    }
}
