import { Paragraph } from "../../../file/paragraph";
import { XmlComponent } from "../../../file/xml-components";
export declare enum FootnoteType {
    SEPERATOR = "separator",
    CONTINUATION_SEPERATOR = "continuationSeparator"
}
export interface IFootnoteOptions {
    readonly id: number;
    readonly type?: FootnoteType;
    readonly children: Paragraph[];
}
export declare class Footnote extends XmlComponent {
    constructor(options: IFootnoteOptions);
}
