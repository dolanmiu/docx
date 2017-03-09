import * as _ from "lodash";
import { BaseXmlComponent } from "./base";
export { BaseXmlComponent };

export abstract class XmlComponent extends BaseXmlComponent {
    protected root: Array<BaseXmlComponent | string>;

    constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent>();
    }

    public toXml(): object {
        const ret = this.root.map((comp) => {
            if (comp instanceof BaseXmlComponent) {
                return comp.toXml();
            }
            return comp
        }).filter((comp) => comp); // Exclude null, undefined, and empty strings
        return {
            [this.rootKey]: ret,
        }
    }
}

export * from "./attributes"
export * from "./default-attributes";
