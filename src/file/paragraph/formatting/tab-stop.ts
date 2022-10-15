// http://officeopenxml.com/WPtab.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export interface TabStopDefinition {
    readonly type: TabStopType;
    readonly position: number | TabStopPosition;
    readonly leader?: LeaderType;
}

export class TabStop extends XmlComponent {
    public constructor(tabDefinitions: readonly TabStopDefinition[]) {
        super("w:tabs");

        for (const tabDefinition of tabDefinitions) {
            this.root.push(new TabStopItem(tabDefinition));
        }
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
    public constructor({ type, position, leader }: TabStopDefinition) {
        super("w:tab");
        this.root.push(
            new TabAttributes({
                val: type,
                pos: position,
                leader: leader,
            }),
        );
    }
}
