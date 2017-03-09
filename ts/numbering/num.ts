import { Attributes, XmlAttributeComponent, XmlComponent } from "../docx/xml-components";

class AbstractNumId extends XmlComponent {

    constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

interface INumAttributesProperties {
    numId: number;
}

class NumAttributes extends XmlAttributeComponent {

    constructor(properties: INumAttributesProperties) {
        super({
            numId: "w:numId",
        }, properties);
    }
}

export class Num extends XmlComponent {
    public id: number;

    constructor(numId: number, abstractNumId: number) {
        super("w:num");
        this.root.push(new NumAttributes({
            numId: numId,
        }));
        this.root.push(new AbstractNumId(abstractNumId));
        this.id = numId;
    }
}
