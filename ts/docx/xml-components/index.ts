import * as _ from "lodash";
import { BaseXmlComponent } from "./base";

export abstract class XmlComponent extends BaseXmlComponent {
    protected root: BaseXmlComponent[];

    constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent>();
    }

    public replaceKey(): void {
        // console.log(this.rootKey);
        // console.log(this.root);
        if (this.root !== undefined) {
            this.root.forEach((root) => {
                if (root && root instanceof BaseXmlComponent) {
                    root.replaceKey();
                }
            });
            this[this.rootKey] = this.root;
            delete this.root;
        }
    }
}

export * from "./attributes"
export * from "./default-attributes";
export * from "./unit";
