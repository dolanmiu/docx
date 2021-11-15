import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
export declare enum AlignmentType {
    START = "start",
    END = "end",
    CENTER = "center",
    BOTH = "both",
    JUSTIFIED = "both",
    DISTRIBUTE = "distribute",
    LEFT = "left",
    RIGHT = "right"
}
export declare class AlignmentAttributes extends XmlAttributeComponent<{
    readonly val: AlignmentType;
}> {
    protected readonly xmlKeys: {
        val: string;
    };
}
export declare class Alignment extends XmlComponent {
    constructor(type: AlignmentType);
}
