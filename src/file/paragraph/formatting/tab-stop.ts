// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TabStop extends XmlComponent {
    constructor(tab: TabStopItem) {
        super("w:tabs");
        this.root.push(tab);
    }
}

export type TabValue = "left" | "right" | "center" | "bar" | "clear" | "decimal" | "end" | "num" | "start";
export type LeaderType = "dot" | "hyphen" | "middleDot" | "none" | "underscore";

export class TabAttributes extends XmlAttributeComponent<{ val: TabValue; pos: string | number; leader?: LeaderType }> {
    protected xmlKeys = { val: "w:val", pos: "w:pos", leader: "w:leader" };
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
        super(new TabStopItem("right", 9026, leader));
    }
}

export class LeftTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem("left", position, leader));
    }
}

export class RightTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem("right", position, leader));
    }
}

export class CenterTabStop extends TabStop {
    constructor(position: number, leader?: LeaderType) {
        super(new TabStopItem("center", position, leader));
    }
}
