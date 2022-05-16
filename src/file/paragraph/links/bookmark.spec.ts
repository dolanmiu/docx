import { assert, expect } from "chai";

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
});
