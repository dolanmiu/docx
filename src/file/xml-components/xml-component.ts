import { BaseXmlComponent } from "./base";
import { IXmlableObject } from "./xmlable-object";
export { BaseXmlComponent };

export abstract class XmlComponent extends BaseXmlComponent {
    // tslint:disable-next-line:readonly-keyword
    protected root: Array<BaseXmlComponent | string>;

    constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent | string>();
    }

    public prepForXml(): IXmlableObject | undefined {
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
            .filter((comp) => comp !== undefined); // Exclude undefined
        return {
            [this.rootKey]: children,
        };
    }

    public addChildElement(child: XmlComponent | string): XmlComponent {
        this.root.push(child);

        return this;
    }

    public delete(): void {
        this.deleted = true;
    }
}
