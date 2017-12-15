import { BaseXmlComponent } from "./base";
import { IXmlableObject } from "./xmlable-object";
export { BaseXmlComponent };

export abstract class XmlComponent extends BaseXmlComponent {
    protected root: Array<BaseXmlComponent | string>;

    constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent>();
    }

    public prepForXml(): IXmlableObject {
        const children = this.root.map((comp) => {
            if (comp instanceof BaseXmlComponent) {
                return comp.prepForXml();
            }
            return comp;
        }).filter((comp) => comp); // Exclude null, undefined, and empty strings
        return {
            [this.rootKey]: children,
        };
    }
}
