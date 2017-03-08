import { XmlAttributeComponent, XmlComponent } from "../docx/xml-components";

interface IndentAttributesProperties {
    left: number;
    hanging: number;
}

class IndentAttributes extends XmlAttributeComponent {

    constructor(properties: IndentAttributesProperties) {
        super({
            left: "w:left",
            hanging: "w:hanging",
        }, properties);
    }
}

export class Indent extends XmlComponent {

    constructor(left: number, hanging: number) {
        super("w:ind");
        this.root.push(new IndentAttributes({
            left: left,
            hanging: hanging,
        }));
    }
}
