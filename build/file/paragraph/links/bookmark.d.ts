import { XmlComponent } from "../../../file/xml-components";
import { ParagraphChild } from "../paragraph";
export declare class Bookmark {
    readonly start: BookmarkStart;
    readonly children: ParagraphChild[];
    readonly end: BookmarkEnd;
    constructor(options: {
        readonly id: string;
        readonly children: ParagraphChild[];
    });
}
export declare class BookmarkStart extends XmlComponent {
    constructor(id: string, linkId: number);
}
export declare class BookmarkEnd extends XmlComponent {
    constructor(linkId: number);
}
