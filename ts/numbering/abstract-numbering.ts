import {XmlComponent} from "../docx/xml-components";
import {XmlAttributeComponent} from "../docx/xml-components";
import {Level} from "./level";
import {MultiLevelType} from "./multi-level-type";

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

    constructor(id: number) {
        super("w:abstractNum");
        this.root.push(new AbstractNumberingAttributes({
            abstractNumId: id,
            restartNumberingAfterBreak: 0
        }));
        this.root.push(new MultiLevelType("hybridMultilevel"));
    }
    
    addLevel(level: Level): void {
        this.root.push(level);
    }
}