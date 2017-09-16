import { XmlAttributeComponent, XmlComponent } from "../xml-components";

interface IIndentAttributesProperties {
    left?: number;
    hanging?: number;
    firstLine?: number;
}

class IndentAttributes extends XmlAttributeComponent<IIndentAttributesProperties> {
    protected xmlKeys = {
        left: "w:left",
        hanging: "w:hanging",
        firstLine: "w:firstLine",
    };
}

export class Indent extends XmlComponent {

    constructor(left: number, hanging?: number, firstLine?: number) {
        super("w:ind");
        this.root.push(new IndentAttributes({
            left: left,
            hanging: hanging,
            firstLine: firstLine,
        }));
    }
}
