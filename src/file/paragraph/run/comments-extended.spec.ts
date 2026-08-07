import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CommentsExtended, CommentsIds } from "./comments-extended";

describe("CommentsExtended", () => {
    describe("#constructor()", () => {
        it("should create with a single comment entry (no parent)", () => {
            const component = new CommentsExtended([{ paraId: "00000001" }]);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w15:commentsEx": [
                    {
                        _attr: {
                            "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                            "mc:Ignorable": "w15",
                        },
                    },
                    {
                        "w15:commentEx": { _attr: { "w15:paraId": "00000001" } },
                    },
                ],
            });
        });

        it("should create with parent-child threading", () => {
            const component = new CommentsExtended([{ paraId: "00000001" }, { paraId: "00000002", parentParaId: "00000001" }]);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w15:commentsEx": [
                    {
                        _attr: {
                            "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                            "mc:Ignorable": "w15",
                        },
                    },
                    {
                        "w15:commentEx": { _attr: { "w15:paraId": "00000001" } },
                    },
                    {
                        "w15:commentEx": { _attr: { "w15:paraId": "00000002", "w15:paraIdParent": "00000001" } },
                    },
                ],
            });
        });

        it("should include done attribute when specified", () => {
            const component = new CommentsExtended([
                { paraId: "00000001", done: true },
                { paraId: "00000002", parentParaId: "00000001", done: false },
            ]);
            const tree = new Formatter().format(component);
            const entries = (tree["w15:commentsEx"] as readonly unknown[]).slice(1);
            expect(entries).to.deep.equal([
                {
                    "w15:commentEx": { _attr: { "w15:paraId": "00000001", "w15:done": "1" } },
                },
                {
                    "w15:commentEx": { _attr: { "w15:paraId": "00000002", "w15:paraIdParent": "00000001", "w15:done": "0" } },
                },
            ]);
        });
    });
});

describe("CommentsIds", () => {
    describe("#constructor()", () => {
        it("should create with a single comment id (non-threaded)", () => {
            const component = new CommentsIds([{ paraId: "00000001", durableId: "12AB34CD" }]);
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
                        "w16cid:commentId": { _attr: { "w16cid:paraId": "00000001", "w16cid:durableId": "12AB34CD" } },
                    },
                ],
            });
        });

        it("should map paraId to durableId for multiple (threaded) comments", () => {
            const component = new CommentsIds([
                { paraId: "00000001", durableId: "11112222" },
                { paraId: "00000002", durableId: "33334444" },
            ]);
            const tree = new Formatter().format(component);
            const entries = (tree["w16cid:commentsIds"] as readonly unknown[]).slice(1);
            expect(entries).to.deep.equal([
                {
                    "w16cid:commentId": { _attr: { "w16cid:paraId": "00000001", "w16cid:durableId": "11112222" } },
                },
                {
                    "w16cid:commentId": { _attr: { "w16cid:paraId": "00000002", "w16cid:durableId": "33334444" } },
                },
            ]);
        });
    });
});
