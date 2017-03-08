import * as _ from "lodash";
import { XmlAttributeComponent, XmlComponent } from "../docx/xml-components";
import { Level } from "./level";
import { MultiLevelType } from "./multi-level-type";

interface IAbstractNumberingAttributesProperties {
    abstractNumId?: number;
    restartNumberingAfterBreak?: number;
}

class AbstractNumberingAttributes extends XmlAttributeComponent {

    constructor(properties: IAbstractNumberingAttributesProperties) {
        super({
            abstractNumId: "w:abstractNumId",
            restartNumberingAfterBreak: "w15:restartNumberingAfterBreak",
        }, properties);
    }
}

export class AbstractNumbering extends XmlComponent {

    constructor(id: number) {
        super("w:abstractNum");
        this.root.push(new AbstractNumberingAttributes({
            abstractNumId: id,
            restartNumberingAfterBreak: 0,
        }));
        this.root.push(new MultiLevelType("hybridMultilevel"));
    }

    public addLevel(level: Level): void {
        this.root.push(level);
    }

    public clearVariables(): void {
        _.forEach(this.root, (element) => {
            element.clearVariables();
        });
    }
}
