import { assert, beforeEach, describe, expect, it } from "vitest";

import { Utility } from "tests/utility";

import { TextRun } from "../run";
import { Bookmark } from "./bookmark";

describe("Bookmark", () => {
    let bookmark: Bookmark;

    beforeEach(() => {
        bookmark = new Bookmark({
            id: "anchor",
            children: [new TextRun("Internal Link")],
        });
    });

    it("should create a bookmark with three root elements", () => {
        const newJson = Utility.jsonify(bookmark);
        assert.equal(newJson.rootKey, undefined);
        assert.equal(newJson.start.rootKey, "w:bookmarkStart");
        assert.equal(newJson.children[0].rootKey, "w:r");
        assert.equal(newJson.end.rootKey, "w:bookmarkEnd");
    });

    it("should create a bookmark with the correct attributes on the bookmark start element", () => {
        const newJson = Utility.jsonify(bookmark);

        assert.equal(newJson.start.root[0].root.name, "anchor");
    });

    it("should create a bookmark with the correct attributes on the text element", () => {
        const newJson = Utility.jsonify(bookmark);
        assert.equal(JSON.stringify(newJson.children[0].root[1].root[1]), JSON.stringify("Internal Link"));
    });

    it("should create a bookmark with the correct attributes on the bookmark end element", () => {
        const newJson = Utility.jsonify(bookmark);
        expect(newJson.end.root[0].root.id).to.be.a("number");
    });

    it("should pair the start and end elements with the same id", () => {
        const newJson = Utility.jsonify(bookmark);
        expect(newJson.end.root[0].root.id).to.equal(newJson.start.root[0].root.id);
    });

    it("should give each bookmark a distinct id", () => {
        // Regression for https://github.com/dolanmiu/docx/issues/3478 — each
        // Bookmark held its own generator, so every bookmark was written with
        // `w:id="1"` and Word could not tell their starts and ends apart.
        const ids = ["first", "second", "third"].map(
            (id) => Utility.jsonify(new Bookmark({ id, children: [new TextRun(id)] })).start.root[0].root.id,
        );

        expect(new Set(ids).size).to.equal(3);
    });

    describe("#writtenAs", () => {
        it("should be the start, the children and the end", () => {
            expect(bookmark.writtenAs).to.deep.equal([bookmark.start, ...bookmark.children, bookmark.end]);
        });

        it("should write a bookmark in the children the same way", () => {
            const inner = new Bookmark({ id: "inner", children: [new TextRun("Inner")] });
            const text = new TextRun("Outer");
            const outer = new Bookmark({ id: "outer", children: [text, inner] });

            expect(outer.writtenAs).to.deep.equal([outer.start, text, inner.start, ...inner.children, inner.end, outer.end]);
        });
    });
});
