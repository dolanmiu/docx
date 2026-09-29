import { describe, expect, it } from "vitest";
import type { Element } from "xml-js";

import { findBookmarkIds, renumberBookmarksAvoiding } from "./bookmark-ids";
import { toJson } from "./util";

const elementsOf = (xml: string): readonly Element[] => toJson(`<root>${xml}</root>`).elements![0].elements!;

const bookmarkIdsIn = (elements: readonly Element[]): readonly number[] => elements.flatMap(findBookmarkIds);

describe("bookmark-ids", () => {
    describe("findBookmarkIds", () => {
        it("should find the ids of bookmark starts and ends at any depth", () => {
            const document = toJson(
                `<w:document><w:body>` +
                    `<w:p><w:bookmarkStart w:id="3" w:name="a"/><w:r><w:t>A</w:t></w:r><w:bookmarkEnd w:id="3"/></w:p>` +
                    `<w:tbl><w:tr><w:tc><w:p><w:bookmarkStart w:id="7" w:name="b"/><w:bookmarkEnd w:id="7"/></w:p></w:tc></w:tr></w:tbl>` +
                    `</w:body></w:document>`,
            );

            expect(findBookmarkIds(document)).to.deep.equal([3, 3, 7, 7]);
        });

        it("should ignore the ids of other elements, such as comments and revisions", () => {
            const document = toJson(
                `<w:p><w:commentRangeStart w:id="1"/><w:ins w:id="2"><w:r><w:t>A</w:t></w:r></w:ins><w:commentRangeEnd w:id="1"/></w:p>`,
            );

            expect(findBookmarkIds(document)).to.deep.equal([]);
        });

        it("should ignore a bookmark whose id is not a number", () => {
            expect(findBookmarkIds(toJson(`<w:bookmarkStart w:id="first" w:name="a"/>`))).to.deep.equal([]);
        });
    });

    describe("renumberBookmarksAvoiding", () => {
        it("should keep an id the document does not use", () => {
            const renumber = renumberBookmarksAvoiding([1, 2]);

            const output = renumber(elementsOf(`<w:bookmarkStart w:id="5" w:name="a"/><w:bookmarkEnd w:id="5"/>`));

            expect(bookmarkIdsIn(output)).to.deep.equal([5, 5]);
        });

        it("should give an id the document uses the next unused one, on both the start and the end", () => {
            const renumber = renumberBookmarksAvoiding([1, 4]);

            const output = renumber(elementsOf(`<w:bookmarkStart w:id="1" w:name="a"/><w:bookmarkEnd w:id="1"/>`));

            expect(bookmarkIdsIn(output)).to.deep.equal([5, 5]);
        });

        it("should renumber bookmarks nested in other content", () => {
            const renumber = renumberBookmarksAvoiding([1]);

            const output = renumber(
                elementsOf(`<w:p><w:bookmarkStart w:id="1" w:name="a"/><w:r><w:t>A</w:t></w:r><w:bookmarkEnd w:id="1"/></w:p>`),
            );

            expect(bookmarkIdsIn(output)).to.deep.equal([2, 2]);
        });

        it("should renumber an id the same way in later content, so a start and end in separate patches still match", () => {
            const renumber = renumberBookmarksAvoiding([1]);

            const start = renumber(elementsOf(`<w:bookmarkStart w:id="1" w:name="a"/>`));
            const end = renumber(elementsOf(`<w:bookmarkEnd w:id="1"/>`));

            expect(bookmarkIdsIn([...start, ...end])).to.deep.equal([2, 2]);
        });

        it("should not give a later bookmark an id it already gave to a renumbered one", () => {
            // 1 is taken by the template, so becomes 3. The bookmark that was 3 all along then needs a new id too
            const renumber = renumberBookmarksAvoiding([1, 2]);

            const output = renumber(
                elementsOf(
                    `<w:bookmarkStart w:id="1" w:name="a"/><w:bookmarkEnd w:id="1"/>` +
                        `<w:bookmarkStart w:id="3" w:name="b"/><w:bookmarkEnd w:id="3"/>`,
                ),
            );

            expect(bookmarkIdsIn(output)).to.deep.equal([3, 3, 4, 4]);
        });

        it("should not give a renumbered bookmark an id that an earlier inserted one kept", () => {
            const renumber = renumberBookmarksAvoiding([1]);

            const output = renumber(
                elementsOf(
                    `<w:bookmarkStart w:id="9" w:name="a"/><w:bookmarkEnd w:id="9"/>` +
                        `<w:bookmarkStart w:id="1" w:name="b"/><w:bookmarkEnd w:id="1"/>`,
                ),
            );

            expect(bookmarkIdsIn(output)).to.deep.equal([9, 9, 10, 10]);
        });

        it("should keep the bookmark's other attributes and leave other elements' ids alone", () => {
            const renumber = renumberBookmarksAvoiding([1]);

            const [bookmarkStart, commentRangeStart] = renumber(
                elementsOf(`<w:bookmarkStart w:id="1" w:name="a" w:colFirst="0"/><w:commentRangeStart w:id="1"/>`),
            );

            expect(bookmarkStart.attributes).to.deep.equal({ "w:id": "2", "w:name": "a", "w:colFirst": "0" });
            expect(commentRangeStart.attributes).to.deep.equal({ "w:id": "1" });
        });

        it("should not change the elements it is given", () => {
            const renumber = renumberBookmarksAvoiding([1]);
            const elements = elementsOf(`<w:bookmarkStart w:id="1" w:name="a"/>`);

            renumber(elements);

            expect(elements[0].attributes).to.deep.equal({ "w:id": "1", "w:name": "a" });
        });
    });
});
