// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TabStop extends XmlComponent {
    constructor(type: TabStopType, position: number, leader?: LeaderType) {
        super("w:tabs");
        this.root.push(new TabStopItem(type, position, leader));
    }
}

export enum TabStopType {
    LEFT = "left",
    RIGHT = "right",
    CENTER = "center",
    BAR = "bar",
    CLEAR = "clear",
    DECIMAL = "decimal",
    END = "end",
    NUM = "num",
    START = "start",
}

export enum LeaderType {
    DOT = "dot",
    HYPHEN = "hyphen",
    MIDDLE_DOT = "middleDot",
    NONE = "none",
    UNDERSCORE = "underscore",
}

export enum TabStopPosition {
    MAX = 9026,
}

export class TabAttributes extends XmlAttributeComponent<{
    readonly val: TabStopType;
    readonly pos: string | number;
    readonly leader?: LeaderType;
}> {
    protected readonly xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
}

export class TabStopItem extends XmlComponent {
    constructor(value: TabStopType, position: string | number, leader?: LeaderType) {
        super("w:tab");
        this.root.push(
            new TabAttributes({
                val: value,
                pos: position,
                leader,
            }),
        );
    }
}
