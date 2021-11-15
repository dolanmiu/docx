import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
export declare class TabStop extends XmlComponent {
    constructor(type: TabStopType, position: number, leader?: LeaderType);
}
export declare enum TabStopType {
    LEFT = "left",
    RIGHT = "right",
    CENTER = "center",
    BAR = "bar",
    CLEAR = "clear",
    DECIMAL = "decimal",
    END = "end",
    NUM = "num",
    START = "start"
}
export declare enum LeaderType {
    DOT = "dot",
    HYPHEN = "hyphen",
    MIDDLE_DOT = "middleDot",
    NONE = "none",
    UNDERSCORE = "underscore"
}
export declare enum TabStopPosition {
    MAX = 9026
}
export declare class TabAttributes extends XmlAttributeComponent<{
    readonly val: TabStopType;
    readonly pos: string | number;
    readonly leader?: LeaderType;
}> {
    protected readonly xmlKeys: {
        val: string;
        pos: string;
        leader: string;
    };
}
export declare class TabStopItem extends XmlComponent {
    constructor(value: TabStopType, position: string | number, leader?: LeaderType);
}
