import {BaseXmlComponent} from "./base";

export abstract class XmlUnitComponent extends BaseXmlComponent {
    protected root: string;

    constructor(rootKey: string) {
        super(rootKey);
    }

    public replaceKey(): void {
        if (this.root !== undefined) {
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}
