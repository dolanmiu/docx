import { beforeEach, describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IContext } from "@file/xml-components";

import type { IViewWrapper } from "../../document-wrapper";
import type { File } from "../../file";
import { TextRun } from "../run";
import { Bookmark, BookmarkEnd, BookmarkStart } from "./bookmark";
import { BookmarkIds } from "./bookmark-ids";

const documentContext = (): IContext => ({
    file: { BookmarkIds: new BookmarkIds() } as unknown as File,
    viewWrapper: {} as unknown as IViewWrapper,
    stack: [],
});

describe("Bookmark", () => {
    let context: IContext;
    let textRun: TextRun;
    let bookmark: Bookmark;

    beforeEach(() => {
        context = documentContext();
        textRun = new TextRun("Internal Link");
        bookmark = new Bookmark({ id: "anchor", children: [textRun] });
    });

    it("should create a bookmark with three root elements", () => {
        expect(new Formatter().format(bookmark.start, context)).to.have.property("w:bookmarkStart");
        expect(new Formatter().format(textRun, context)).to.have.property("w:r");
        expect(new Formatter().format(bookmark.end, context)).to.have.property("w:bookmarkEnd");
    });

    it("should create a bookmark with the correct attributes on the bookmark start element", () => {
        const tree = new Formatter().format(bookmark.start, context);

        expect(tree["w:bookmarkStart"]._attr["w:name"]).to.equal("anchor");
    });

    it("should keep the bookmark's children", () => {
        expect(bookmark.children).to.deep.equal([textRun]);
        expect(JSON.stringify(new Formatter().format(textRun, context))).to.contain("Internal Link");
    });

    it("should create a bookmark with the correct attributes on the bookmark end element", () => {
        const tree = new Formatter().format(bookmark.end, context);

        expect(tree["w:bookmarkEnd"]._attr["w:id"]).to.be.a("number");
    });

    it("should pair the start and end elements with the same id", () => {
        const start = new Formatter().format(bookmark.start, context);
        const end = new Formatter().format(bookmark.end, context);

        expect(start["w:bookmarkStart"]._attr["w:id"]).to.equal(end["w:bookmarkEnd"]._attr["w:id"]);
    });

    // Regression: a per-instance generator gave every bookmark `w:id="1"`, so
    // start and end pairing was ambiguous and Word could not resolve references.
    it("should give each bookmark in a document a distinct id", () => {
        const bookmarks = ["first", "second", "third"].map((id) => new Bookmark({ id, children: [new TextRun(id)] }));

        const ids = bookmarks.map((item) => new Formatter().format(item.start, context)["w:bookmarkStart"]._attr["w:id"]);

        expect(ids).to.deep.equal([1, 2, 3]);
    });

    it("should number bookmarks from one in every document", () => {
        const first = new Bookmark({ id: "a", children: [new TextRun("a")] });
        new Formatter().format(first.start, context);

        const otherDocument = documentContext();
        const second = new Bookmark({ id: "b", children: [new TextRun("b")] });

        expect(new Formatter().format(second.start, otherDocument)["w:bookmarkStart"]._attr["w:id"]).to.equal(1);
    });

    it("should keep an explicitly supplied id on the start element", () => {
        const tree = new Formatter().format(new BookmarkStart("named", 7), context);

        expect(tree["w:bookmarkStart"]._attr["w:id"]).to.equal(7);
    });

    it("should keep an explicitly supplied id on the end element", () => {
        const tree = new Formatter().format(new BookmarkEnd(7), context);

        expect(tree["w:bookmarkEnd"]._attr["w:id"]).to.equal(7);
    });
});
