import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { Name } from "./components";

export interface IStyleAttributes {
    readonly type?: string;
    readonly styleId?: string;
    readonly default?: boolean;
    readonly customStyle?: string;
}

class StyleAttributes extends XmlAttributeComponent<IStyleAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        styleId: "w:styleId",
        default: "w:default",
        customStyle: "w:customStyle",
    };
}

export class Style extends XmlComponent {
    constructor(attributes: IStyleAttributes, name?: string) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (name) {
            this.root.push(new Name(name));
        }
    }
}
