import {BaseXmlComponent} from "./base";

export abstract class XmlAttributeComponent extends BaseXmlComponent {
    protected root: Object;
    private xmlKeys: Object;

    constructor(xmlKeys: Object, properties: Object) {
        super("_attr");
        this.xmlKeys = xmlKeys;

        this.root = properties

        if (!properties) {
            this.root = {};
        }
    }

    replaceKey(): void {
        if (this.root !== undefined) {
            _.forOwn(this.root, (value, key) => {
                var newKey = this.xmlKeys[key];
                this.root[newKey] = value;
                delete this.root[key];
            });
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}