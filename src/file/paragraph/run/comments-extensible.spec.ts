import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CommentsExtensible } from "./comments-extensible";

describe("CommentsExtensible", () => {
    describe("#constructor()", () => {
        it("should create with a single entry including dateUtc", () => {
            const component = new CommentsExtensible([{ durableId: "10000001", dateUtc: "2026-04-15T14:47:00.000Z" }]);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w16cex:commentsExtensible": [
                    {
                        _attr: {
                            "xmlns:w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "mc:Ignorable": "w16cex",
                        },
                    },
                    {
                        "w16cex:commentExtensible": {
                            _attr: {
                                "w16cex:durableId": "10000001",
                                "w16cex:dateUtc": "2026-04-15T14:47:00.000Z",
                            },
                        },
                    },
                ],
            });
        });

        it("should omit dateUtc attribute when not provided", () => {
            const component = new CommentsExtensible([{ durableId: "10000001" }]);
            const tree = new Formatter().format(component);
            const entries = (tree["w16cex:commentsExtensible"] as readonly unknown[]).slice(1);
            expect(entries).to.deep.equal([
                {
                    "w16cex:commentExtensible": { _attr: { "w16cex:durableId": "10000001" } },
                },
            ]);
        });

        it("should create with multiple entries", () => {
            const component = new CommentsExtensible([
                { durableId: "10000001", dateUtc: "2026-04-15T14:47:00.000Z" },
                { durableId: "10000002", dateUtc: "2026-04-15T15:00:00.000Z" },
            ]);
            const tree = new Formatter().format(component);
            const entries = (tree["w16cex:commentsExtensible"] as readonly unknown[]).slice(1);
            expect(entries).to.have.length(2);
        });
    });
});
