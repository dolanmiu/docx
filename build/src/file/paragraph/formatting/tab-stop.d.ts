import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
export declare class TabStop extends XmlComponent {
    constructor(tab: Tab);
}
export declare type TabValue = "left" | "right" | "center" | "bar" | "clear" | "decimal" | "end" | "num" | "start";
export declare class TabAttributes extends XmlAttributeComponent<{
    val: TabValue;
    pos: string | number;
}> {
    protected xmlKeys: {
        val: string;
        pos: string;
    };
}
export declare class Tab extends XmlComponent {
    constructor(value: TabValue, position: string | number);
}
export declare class MaxRightTabStop extends TabStop {
    constructor();
}
export declare class LeftTabStop extends TabStop {
    constructor(position: number);
}
export declare class RightTabStop extends TabStop {
    constructor(position: number);
}
export declare class CenterTabStop extends TabStop {
    constructor(position: number);
}
