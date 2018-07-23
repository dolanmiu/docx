import { XmlComponent } from "file/xml-components";
import { Paragraph } from "../../paragraph";
export declare enum FootnoteType {
    SEPERATOR = "separator",
    CONTINUATION_SEPERATOR = "continuationSeparator"
}
export declare class Footnote extends XmlComponent {
    constructor(id: number, type?: FootnoteType);
    addParagraph(paragraph: Paragraph): void;
}
