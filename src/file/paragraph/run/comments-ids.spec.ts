import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CommentsIds } from "./comments-ids";

describe("CommentsIds", () => {
    describe("#constructor()", () => {
        it("should create with a single mapping", () => {
            const component = new CommentsIds([{ paraId: "00000001", durableId: "10000001" }]);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w16cid:commentsIds": [
                    {
                        _attr: {
                            "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "mc:Ignorable": "w16cid",
                        },
                    },
                    {
                        "w16cid:commentId": {
                            _attr: { "w16cid:paraId": "00000001", "w16cid:durableId": "10000001" },
                        },
                    },
                ],
            });
        });

        it("should create with multiple mappings", () => {
            const component = new CommentsIds([
                { paraId: "00000001", durableId: "10000001" },
                { paraId: "00000002", durableId: "10000002" },
            ]);
            const tree = new Formatter().format(component);
            const entries = (tree["w16cid:commentsIds"] as readonly unknown[]).slice(1);
            expect(entries).to.deep.equal([
                {
                    "w16cid:commentId": { _attr: { "w16cid:paraId": "00000001", "w16cid:durableId": "10000001" } },
                },
                {
                    "w16cid:commentId": { _attr: { "w16cid:paraId": "00000002", "w16cid:durableId": "10000002" } },
                },
            ]);
        });

        it("should create with no entries", () => {
            const component = new CommentsIds([]);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w16cid:commentsIds": {
                    _attr: {
                        "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                        "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                        "mc:Ignorable": "w16cid",
                    },
                },
            });
        });
    });
});
