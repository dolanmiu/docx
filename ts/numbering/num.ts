import {XmlComponent, Attributes, XmlAttributeComponent} from "../docx/xml-components";

class AbstractNumId extends XmlComponent {
    
    constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(new Attributes({
            val: value
        }));
    }
}

interface NumAttributesProperties {
    numId: number
}

class NumAttributes extends XmlAttributeComponent {
    
    constructor(properties: NumAttributesProperties) {
        super({
            numId: "w:numId"
        }, properties);
    }
}

export class Num extends XmlComponent {
    
    constructor(numId: number, abstractNumId: number) {
        super("w:num");
        this.root.push(new NumAttributes({
            numId: numId
        }));
        this.root.push(new AbstractNumId(abstractNumId));
    }
}