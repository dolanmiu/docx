import { assert } from "chai";

import { Utility } from "tests/utility";

import { Bookmark } from "./bookmark";

describe("Bookmark", () => {
    let bookmark: Bookmark;

    beforeEach(() => {
        bookmark = new Bookmark("anchor", "Internal Link", 0);
    });

    it("should create a bookmark with three root elements", () => {
        const newJson = Utility.jsonify(bookmark);
        assert.equal(newJson.rootKey, undefined);
        assert.equal(newJson.start.rootKey, "w:bookmarkStart");
        assert.equal(newJson.text.rootKey, "w:r");
        assert.equal(newJson.end.rootKey, "w:bookmarkEnd");
    });

    it("should create a bookmark with the correct attributes on the bookmark start element", () => {
        const newJson = Utility.jsonify(bookmark);
        const attributes = {
            name: "anchor",
            id: "1",
        };
        assert.equal(JSON.stringify(newJson.start.root[0].root), JSON.stringify(attributes));
    });

    it("should create a bookmark with the correct attributes on the text element", () => {
        const newJson = Utility.jsonify(bookmark);
        assert.equal(JSON.stringify(newJson.text.root[1].root[1]), JSON.stringify("Internal Link"));
    });

    it("should create a bookmark with the correct attributes on the bookmark end element", () => {
        const newJson = Utility.jsonify(bookmark);
        const attributes = {
            id: "1",
        };
        assert.equal(JSON.stringify(newJson.end.root[0].root), JSON.stringify(attributes));
    });
});
