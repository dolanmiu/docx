import { XmlComponent } from "../../../file/xml-components";
export declare enum HeadingLevel {
    HEADING_1 = "Heading1",
    HEADING_2 = "Heading2",
    HEADING_3 = "Heading3",
    HEADING_4 = "Heading4",
    HEADING_5 = "Heading5",
    HEADING_6 = "Heading6",
    TITLE = "Title"
}
export declare class Style extends XmlComponent {
    constructor(styleId: string);
}
