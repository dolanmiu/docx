// http://officeopenxml.com/WPbookmark.php
import { XmlComponent } from "file/xml-components";
import { TextRun } from "../run";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

export class Bookmark {
    public readonly linkId: number;
    public readonly start: BookmarkStart;
    public readonly text: TextRun;
    public readonly end: BookmarkEnd;

    constructor(name: string, text: string, relationshipsCount: number) {
        this.linkId = relationshipsCount + 1;

        this.start = new BookmarkStart(name, this.linkId);
        this.text = new TextRun(text);
        this.end = new BookmarkEnd(this.linkId);
    }
}

export class BookmarkStart extends XmlComponent {
    public readonly linkId: number;

    constructor(name: string, relationshipsCount: number) {
        super("w:bookmarkStart");

        this.linkId = relationshipsCount;
        const id = `${this.linkId}`;
        const attributes = new BookmarkStartAttributes({
            name,
            id,
        });
        this.root.push(attributes);
    }
}

export class BookmarkEnd extends XmlComponent {
    public readonly linkId: number;

    constructor(relationshipsCount: number) {
        super("w:bookmarkEnd");

        this.linkId = relationshipsCount;
        const id = `${this.linkId}`;
        const attributes = new BookmarkEndAttributes({
            id,
        });
        this.root.push(attributes);
    }
}
