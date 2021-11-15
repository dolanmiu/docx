import { XmlAttributeComponent, XmlComponent } from "../../file/xml-components";
export declare enum VerticalAlign {
    BOTH = "both",
    BOTTOM = "bottom",
    CENTER = "center",
    TOP = "top"
}
export declare class VerticalAlignAttributes extends XmlAttributeComponent<{
    readonly verticalAlign?: VerticalAlign;
}> {
    protected readonly xmlKeys: {
        verticalAlign: string;
    };
}
export declare class VerticalAlignElement extends XmlComponent {
    constructor(value: VerticalAlign);
}
