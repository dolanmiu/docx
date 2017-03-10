import { XmlAttributeComponent, XmlComponent } from "../docx/xml-components";
import { Level } from "./level";
import { MultiLevelType } from "./multi-level-type";

interface IAbstractNumberingAttributesProperties {
    abstractNumId?: number;
    restartNumberingAfterBreak?: number;
}

class AbstractNumberingAttributes extends XmlAttributeComponent<IAbstractNumberingAttributesProperties> {
    protected xmlKeys = {
        abstractNumId: "w:abstractNumId",
        restartNumberingAfterBreak: "w15:restartNumberingAfterBreak",
    };
}

export class AbstractNumbering extends XmlComponent {
    public id: number;

    constructor(id: number) {
        super("w:abstractNum");
        this.root.push(new AbstractNumberingAttributes({
            abstractNumId: id,
            restartNumberingAfterBreak: 0,
        }));
        this.root.push(new MultiLevelType("hybridMultilevel"));
        this.id = id;
    }

    public addLevel(level: Level): void {
        this.root.push(level);
    }

    public createLevel(num: number, format: string, text: string, align: string = "start"): Level {
        const level = new Level(num, format, text, align);
        this.addLevel(level);
        return level;
    }
}
