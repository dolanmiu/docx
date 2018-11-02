// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TabStop extends XmlComponent {
    constructor(tab: TabStopItem) {
        super("w:tabs");
        this.root.push(tab);
    }
}

export enum TabValue {
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

export class TabAttributes extends XmlAttributeComponent<{
    readonly val: TabValue;
    readonly pos: string | number;
    readonly leader?: LeaderType;
}> {
    protected readonly xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
}

export class TabStopItem extends XmlComponent {
    constructor(value: TabValue, position: string | number, leader?: LeaderType) {
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

export class MaxRightTabStop extends TabStop {
    constructor(leader?: LeaderType) {
        super(new TabStopItem(TabValue.RIGHT, 9026, leader));
    }
}

export class LeftTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem(TabValue.LEFT, position, leader));
    }
}

export class RightTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem(TabValue.RIGHT, position, leader));
    }
}

export class CenterTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem(TabValue.CENTER, position, leader));
    }
}
