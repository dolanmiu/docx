import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
export declare type AlignmentOptions = "left" | "center" | "right" | "both";
export declare class AlignmentAttributes extends XmlAttributeComponent<{
    val: AlignmentOptions;
}> {
    protected xmlKeys: {
        val: string;
    };
}
export declare class Alignment extends XmlComponent {
    constructor(type: AlignmentOptions);
}
