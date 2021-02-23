import { XmlAttributeComponent } from "file/xml-components";

export enum SectionType {
    CONTINUOUS = "continuous",
    EVEN_PAGE = "evenPage",
    NEXT_COLUMN = "nextColumn",
    NEXT_PAGE = "nextPage",
    ODD_PAGE = "oddPage",
}

export class SectionTypeAttributes extends XmlAttributeComponent<{
    readonly val: SectionType;
}> {
    protected readonly xmlKeys = {
        val: "w:val",
    };
}
