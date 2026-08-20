import { describe, expect, it } from "vitest";

import { BookmarkIds } from "./bookmark-ids";

describe("BookmarkIds", () => {
    it("should number bookmarks from one, in the order they are asked for", () => {
        const ids = new BookmarkIds();

        expect(ids.getId("first")).to.equal(1);
        expect(ids.getId("second")).to.equal(2);
        expect(ids.getId("third")).to.equal(3);
    });

    it("should return the same id for the same name, so start and end markers pair", () => {
        const ids = new BookmarkIds();

        const first = ids.getId("intro");
        ids.getId("other");

        expect(ids.getId("intro")).to.equal(first);
    });

    it("should start again at one for a new instance, so ids are per document", () => {
        const first = new BookmarkIds();
        first.getId("a");
        first.getId("b");

        const second = new BookmarkIds();

        expect(second.getId("a")).to.equal(1);
    });

    it("should not allocate an id that was reserved", () => {
        const ids = new BookmarkIds();
        ids.reserve(1);

        expect(ids.getId("first")).to.equal(2);
    });

    it("should skip past a run of reserved ids", () => {
        const ids = new BookmarkIds();
        ids.reserve(1);
        ids.reserve(2);
        ids.reserve(4);

        expect(ids.getId("first")).to.equal(3);
        expect(ids.getId("second")).to.equal(5);
    });

    it("should keep a reserved id that was already allocated", () => {
        const ids = new BookmarkIds();
        const allocated = ids.getId("first");
        ids.reserve(allocated);

        expect(ids.getId("first")).to.equal(allocated);
    });
});
