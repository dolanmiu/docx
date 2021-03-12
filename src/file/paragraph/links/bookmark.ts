// http://officeopenxml.com/WPbookmark.php
import { uniqueId } from "convenience-functions";
import { XmlComponent } from "file/xml-components";

import { TextRun } from "../run";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

export class Bookmark {
    public readonly start: BookmarkStart;
    public readonly children: TextRun[];
    public readonly end: BookmarkEnd;

    constructor(options: { readonly id: string; readonly children: TextRun[] }) {
        const linkId = uniqueId();

        this.start = new BookmarkStart(options.id, linkId);
        this.children = options.children;
        this.end = new BookmarkEnd(linkId);
    }
}

export class BookmarkStart extends XmlComponent {
    constructor(id: string, linkId: string) {
        super("w:bookmarkStart");

        const attributes = new BookmarkStartAttributes({
            name: id,
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
