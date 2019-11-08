import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { ILevelsOptions, Level } from "./level";
import { MultiLevelType } from "./multi-level-type";

interface IAbstractNumberingAttributesProperties {
    readonly abstractNumId?: number;
    readonly restartNumberingAfterBreak?: number;
}

class AbstractNumberingAttributes extends XmlAttributeComponent<IAbstractNumberingAttributesProperties> {
    protected readonly xmlKeys = {
        abstractNumId: "w:abstractNumId",
        restartNumberingAfterBreak: "w15:restartNumberingAfterBreak",
    };
}

export class AbstractNumbering extends XmlComponent {
    public readonly id: number;

    constructor(id: number, levelOptions: ILevelsOptions[]) {
        super("w:abstractNum");
        this.root.push(
            new AbstractNumberingAttributes({
                abstractNumId: id,
                restartNumberingAfterBreak: 0,
            }),
        );
        this.root.push(new MultiLevelType("hybridMultilevel"));
        this.id = id;

        for (const option of levelOptions) {
            this.root.push(new Level(option));
        }
    }
}
