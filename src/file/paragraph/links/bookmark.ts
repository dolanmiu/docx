// http://officeopenxml.com/WPbookmark.php
import { XmlComponent } from "file/xml-components";
import * as shortid from "shortid";
import { TextRun } from "../run";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

export class Bookmark {
    public readonly start: BookmarkStart;
    public readonly text: TextRun;
    public readonly end: BookmarkEnd;

    constructor(name: string, text: string) {
        const linkId = shortid.generate().toLowerCase();

        this.start = new BookmarkStart(name, linkId);
        this.text = new TextRun(text);
        this.end = new BookmarkEnd(linkId);
    }
}

export class BookmarkStart extends XmlComponent {
    constructor(name: string, linkId: string) {
        super("w:bookmarkStart");

        const attributes = new BookmarkStartAttributes({
            name,
            id: linkId,
        });
        this.root.push(attributes);
    }
}

export class BookmarkEnd extends XmlComponent {
    constructor(linkId: string) {
        super("w:bookmarkEnd");

        const attributes = new BookmarkEndAttributes({
            id: linkId,
        });
        this.root.push(attributes);
    }
}
