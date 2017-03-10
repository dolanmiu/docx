import { XmlAttributeComponent, XmlComponent } from "../xml-components";

interface IIndentAttributesProperties {
    left?: number;
    hanging?: number;
}

class IndentAttributes extends XmlAttributeComponent<IIndentAttributesProperties> {
    protected xmlKeys = {
        left: "w:left",
        hanging: "w:hanging",
    };
}

export class Indent extends XmlComponent {

    constructor(left: number, hanging?: number) {
        super("w:ind");
        this.root.push(new IndentAttributes({
            left: left,
            hanging: hanging,
        }));
    }
}
