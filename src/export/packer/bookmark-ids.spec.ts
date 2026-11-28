import { describe, expect, it } from "vitest";

import { createBookmarkNumbering } from "./bookmark-ids";

const bookmark = (id: number, name = "a"): string =>
    `<w:bookmarkStart w:name="${name}" w:id="${id}"/><w:r><w:t>${name}</w:t></w:r><w:bookmarkEnd w:id="${id}"/>`;

const idsOf = (xml: string): readonly string[] =>
    [...xml.matchAll(/<(w:bookmarkStart|w:bookmarkEnd) [^>]*w:id="(-?\d+)"/g)].map(
        ([, name, id]) => `${name === "w:bookmarkStart" ? "start" : "end"} ${id}`,
    );

describe("createBookmarkNumbering", () => {
    it("should number bookmarks from 1, in the order they start, with each end sharing its start's id", () => {
        const xml = createBookmarkNumbering()(`<w:p>${bookmark(40, "a")}</w:p><w:p>${bookmark(7, "b")}</w:p>`);

        expect(idsOf(xml)).to.deep.equal(["start 1", "end 1", "start 2", "end 2"]);
    });

    it("should number bookmarks inside one another", () => {
        const xml = createBookmarkNumbering()(
            `<w:p><w:bookmarkStart w:name="outer" w:id="8"/>${bookmark(9, "inner")}<w:bookmarkEnd w:id="8"/></w:p>`,
        );

        expect(idsOf(xml)).to.deep.equal(["start 1", "start 2", "end 2", "end 1"]);
    });

    it("should carry on numbering in the parts after the first", () => {
        const numberBookmarks = createBookmarkNumbering();

        expect(idsOf(numberBookmarks(`<w:p>${bookmark(40)}</w:p>`))).to.deep.equal(["start 1", "end 1"]);
        expect(idsOf(numberBookmarks(`<w:p>${bookmark(40)}</w:p>`))).to.deep.equal(["start 2", "end 2"]);
    });

    it("should start again from 1 for each document", () => {
        expect(idsOf(createBookmarkNumbering()(bookmark(40)))).to.deep.equal(["start 1", "end 1"]);
        expect(idsOf(createBookmarkNumbering()(bookmark(41)))).to.deep.equal(["start 1", "end 1"]);
    });

    it("should give a bookmark that is in the document twice two ids", () => {
        expect(idsOf(createBookmarkNumbering()(`<w:p>${bookmark(5)}</w:p><w:p>${bookmark(5)}</w:p>`))).to.deep.equal([
            "start 1",
            "end 1",
            "start 2",
            "end 2",
        ]);
    });

    it("should give an end without a start an id of its own, so it can't end another bookmark", () => {
        const xml = createBookmarkNumbering()(`<w:p><w:bookmarkEnd w:id="5"/>${bookmark(6)}</w:p>`);

        expect(idsOf(xml)).to.deep.equal(["end 1", "start 2", "end 2"]);
    });

    it("should change only the bookmarks' ids", () => {
        const xml = `<w:p><w:bookmarkStart w:name="a" w:colFirst="0" w:id="5"/><w:commentRangeStart w:id="5"/><w:bookmarkEnd w:id="5"/></w:p>`;

        expect(createBookmarkNumbering()(xml)).to.equal(
            `<w:p><w:bookmarkStart w:name="a" w:colFirst="0" w:id="1"/><w:commentRangeStart w:id="5"/><w:bookmarkEnd w:id="1"/></w:p>`,
        );
    });

    it("should leave a bookmark whose id isn't a number, and elements that only start with the same name", () => {
        const xml = `<w:p><w:bookmarkStart w:name="a" w:id="first"/><w:bookmarkStartThing w:id="4"/></w:p>`;

        expect(createBookmarkNumbering()(xml)).to.equal(xml);
    });
});
