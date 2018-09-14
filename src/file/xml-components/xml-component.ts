import { BaseXmlComponent } from "./base";
import { IXmlableObject } from "./xmlable-object";
export { BaseXmlComponent };

export abstract class XmlComponent extends BaseXmlComponent {
    protected root: Array<BaseXmlComponent | string>;

    constructor(rootKey: string, initContent?: XmlComponent) {
        super(rootKey);
        this.root = initContent ? initContent.root : new Array<BaseXmlComponent>();
    }

    public prepForXml(): IXmlableObject {
        const children = this.root
            .filter((c) => {
                if (c instanceof BaseXmlComponent) {
                    return !c.IsDeleted;
                }
                return true;
            })
            .map((comp) => {
                if (comp instanceof BaseXmlComponent) {
                    return comp.prepForXml();
                }
                return comp;
            })
            .filter((comp) => comp); // Exclude null, undefined, and empty strings
        return {
            [this.rootKey]: children,
        };
    }

    // TODO: Unused method
    public addChildElement(child: XmlComponent | string): XmlComponent {
        this.root.push(child);

        return this;
    }

    public delete(): void {
        this.deleted = true;
    }
}
