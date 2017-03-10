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

class NumAttributes extends XmlAttributeComponent<INumAttributesProperties> {
    protected xmlKeys = {numId: "w:numId"};
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
