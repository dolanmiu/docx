import { XmlComponent } from "../../../file/xml-components";
export declare enum EmphasisMarkType {
    DOT = "dot"
}
export declare abstract class BaseEmphasisMark extends XmlComponent {
    protected constructor(emphasisMarkType: EmphasisMarkType);
}
export declare class EmphasisMark extends BaseEmphasisMark {
    constructor(emphasisMarkType?: EmphasisMarkType);
}
export declare class DotEmphasisMark extends BaseEmphasisMark {
    constructor();
}
