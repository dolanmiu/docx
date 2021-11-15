import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export declare enum SectionType {
    NEXT_PAGE = "nextPage",
    NEXT_COLUMN = "nextColumn",
    CONTINUOUS = "continuous",
    EVEN_PAGE = "evenPage",
    ODD_PAGE = "oddPage"
}
export declare class SectionTypeAttributes extends XmlAttributeComponent<{
    readonly val: SectionType;
}> {
    protected readonly xmlKeys: {
        val: string;
    };
}
export declare class Type extends XmlComponent {
    constructor(value: SectionType);
}
