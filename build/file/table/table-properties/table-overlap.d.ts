import { XmlComponent } from "../../../file/xml-components";
export declare enum OverlapType {
    NEVER = "never",
    OVERLAP = "overlap"
}
export declare class TableOverlap extends XmlComponent {
    constructor(type: OverlapType);
}
