import {XmlComponent} from "../docx/xml-components";
import {XmlAttributeComponent} from "../docx/xml-components";

interface AbstractNumberingAttributesProperties {
    abstractNumId?: Number,
    restartNumberingAfterBreak?: Number
}

class AbstractNumberingAttributes extends XmlAttributeComponent {
    
    constructor(properties: AbstractNumberingAttributesProperties) {
        super({
            abstractNumId: "w:abstractNumId",
            restartNumberingAfterBreak: "w15:restartNumberingAfterBreak"
        }, properties);
    }
}

export class AbstractNumbering extends XmlComponent {

    constructor() {
        super("w:abstractNum");
        this.root.push(new AbstractNumberingAttributes({
            abstractNumId: 0,
            restartNumberingAfterBreak: 0
        }));
    }
}