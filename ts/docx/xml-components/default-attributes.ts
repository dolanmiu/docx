import * as _ from "lodash";
import { BaseXmlComponent } from "./base";

export abstract class XmlAttributeComponent extends BaseXmlComponent {
    protected root: object;
    private xmlKeys: object;

    constructor(xmlKeys: object, properties: object) {
        super("_attr");
        this.xmlKeys = xmlKeys;

        this.root = properties;

        if (!properties) {
            this.root = {};
        }
    }

    public replaceKey(): void {
        if (this.root !== undefined) {
            _.forOwn(this.root, (value, key) => {
                const newKey = this.xmlKeys[key];
                this.root[newKey] = value;
                delete this.root[key];
            });
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}
