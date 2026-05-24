import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";

import { Table, TableCell, TableRow } from "../../table";
import { Paragraph } from "../paragraph";
import { Comment, CommentRangeEnd, CommentRangeStart, CommentReference, Comments, commentIdToParaId } from "./comment-run";

describe("CommentRangeStart", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const component = new CommentRangeStart(0);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w:commentRangeStart": { _attr: { "w:id": 0 } },
            });
        });
    });
});

describe("CommentRangeEnd", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const component = new CommentRangeEnd(0);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w:commentRangeEnd": { _attr: { "w:id": 0 } },
            });
        });
    });
});

describe("CommentReference", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const component = new CommentReference(0);
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w:commentReference": { _attr: { "w:id": 0 } },
            });
        });
    });
});

describe("Comment", () => {
    beforeEach(() => {
        const now = new Date("1999-01-01T00:00:00.000Z");
        vi.useFakeTimers({
            now: now.getTime(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create", () => {
            const component = new Comment({
                id: 0,
                children: [new Paragraph("test-comment")],
                date: new Date("1999-01-01T00:00:00.000Z"),
            });
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w:comment": [
                    { _attr: { "w:id": 0, "w:date": "1999-01-01T00:00:00.000Z" } },
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test-comment",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should handle paraId gracefully when comment has no paragraph children", () => {
            const component = new Comment({ id: 0, children: [], date: new Date("1999-01-01T00:00:00.000Z") }, "00000001");
            const tree = new Formatter().format(component);
            // Comment with no paragraphs should serialize without crashing, paraId has nowhere to go
            expect(tree).to.deep.equal({
                "w:comment": { _attr: { "w:id": 0, "w:date": "1999-01-01T00:00:00.000Z" } },
            });
        });

        it("should not inject paraId when comment contains only non-paragraph children", () => {
            const table = new Table({
                rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("cell")] })] })],
            });
            const component = new Comment({ id: 0, children: [table], date: new Date("1999-01-01T00:00:00.000Z") }, "00000001");
            const tree = new Formatter().format(component);
            const serialized = JSON.stringify(tree);
            expect(serialized).to.not.contain("w14:paraId");
        });

        it("should not inject paraId when comment contains only an empty paragraph", () => {
            const component = new Comment({ id: 0, children: [new Paragraph({})], date: new Date("1999-01-01T00:00:00.000Z") }, "00000001");
            const tree = new Formatter().format(component);
            const serialized = JSON.stringify(tree);
            expect(serialized).to.not.contain("w14:paraId");
        });

        it("should create by using default date", () => {
            const component = new Comment({
                id: 0,
                children: [new Paragraph("test-comment")],
            });
            const tree = new Formatter().format(component);
            expect(tree).to.deep.equal({
                "w:comment": [
                    { _attr: { "w:id": 0, "w:date": "1999-01-01T00:00:00.000Z" } },
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test-comment",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});

describe("Comments", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const component = new Comments({
                children: [
                    {
                        id: 0,
                        children: [new Paragraph("test-comment")],
                        date: new Date("1999-01-01T00:00:00.000Z"),
                    },
                    {
                        id: 1,
                        children: [new Paragraph("test-comment-2")],
                        date: new Date("1999-01-01T00:00:00.000Z"),
                    },
                ],
            });
            const tree = new Formatter().format(component);

            expect(tree).to.deep.equal({
                "w:comments": [
                    {
                        _attr: {
                            "xmlns:cx": "http://schemas.microsoft.com/office/drawing/2014/chartex",
                            "xmlns:cx1": "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                            "xmlns:cx2": "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                            "xmlns:cx3": "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                            "xmlns:cx4": "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                            "xmlns:cx5": "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                            "xmlns:cx6": "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                            "xmlns:cx7": "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                            "xmlns:cx8": "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "xmlns:aink": "http://schemas.microsoft.com/office/drawing/2016/ink",
                            "xmlns:am3d": "http://schemas.microsoft.com/office/drawing/2017/model3d",
                            "xmlns:o": "urn:schemas-microsoft-com:office:office",
                            "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                            "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                            "xmlns:v": "urn:schemas-microsoft-com:vml",
                            "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                            "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                            "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                            "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                            "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                            "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                            "xmlns:w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                            "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                            "xmlns:w16": "http://schemas.microsoft.com/office/word/2018/wordml",
                            "xmlns:w16sdtdh": "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
                            "xmlns:w16se": "http://schemas.microsoft.com/office/word/2015/wordml/symex",
                            "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                            "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                            "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                            "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                        },
                    },
                    {
                        "w:comment": [
                            { _attr: { "w:id": 0, "w:date": "1999-01-01T00:00:00.000Z" } },
                            { "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-comment"] }] }] },
                        ],
                    },
                    {
                        "w:comment": [
                            { _attr: { "w:id": 1, "w:date": "1999-01-01T00:00:00.000Z" } },
                            { "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test-comment-2"] }] }] },
                        ],
                    },
                ],
            });
        });

        it("should not have ThreadData when no parentId is used", () => {
            const component = new Comments({
                children: [{ id: 0, children: [new Paragraph("comment")], date: new Date("1999-01-01T00:00:00.000Z") }],
            });
            expect(component.ThreadData).to.be.undefined;
        });

        it("should produce ThreadData when parentId is used", () => {
            const component = new Comments({
                children: [
                    { id: 0, children: [new Paragraph("parent")], date: new Date("1999-01-01T00:00:00.000Z") },
                    { id: 1, children: [new Paragraph("reply")], date: new Date("1999-01-01T00:00:00.000Z"), parentId: 0 },
                ],
            });
            expect(component.ThreadData).to.deep.equal([
                { paraId: "00000001", parentParaId: undefined, done: undefined },
                { paraId: "00000002", parentParaId: "00000001", done: undefined },
            ]);
        });

        it("should map resolved option to done in ThreadData", () => {
            const component = new Comments({
                children: [
                    { id: 0, children: [new Paragraph("parent")], date: new Date("1999-01-01T00:00:00.000Z") },
                    { id: 1, children: [new Paragraph("reply")], date: new Date("1999-01-01T00:00:00.000Z"), parentId: 0, resolved: true },
                ],
            });
            expect(component.ThreadData![0].done).to.be.undefined;
            expect(component.ThreadData![1].done).to.equal(true);
        });

        it("should inject w14:paraId into last paragraph when threading is active", () => {
            const component = new Comments({
                children: [
                    { id: 0, children: [new Paragraph("parent")], date: new Date("1999-01-01T00:00:00.000Z") },
                    { id: 1, children: [new Paragraph("reply")], date: new Date("1999-01-01T00:00:00.000Z"), parentId: 0 },
                ],
            });
            const tree = new Formatter().format(component);
            const serialized = JSON.stringify(tree);
            expect(serialized).to.contain('"w14:paraId":"00000001"');
            expect(serialized).to.contain('"w14:textId":"00000001"');
            expect(serialized).to.contain('"w14:paraId":"00000002"');
            expect(serialized).to.contain('"w14:textId":"00000002"');
        });

        it("should not inject w14:paraId when no threading", () => {
            const component = new Comments({
                children: [{ id: 0, children: [new Paragraph("comment")], date: new Date("1999-01-01T00:00:00.000Z") }],
            });
            const tree = new Formatter().format(component);
            const serialized = JSON.stringify(tree);
            expect(serialized).to.not.contain("w14:paraId");
        });
    });
});

describe("commentIdToParaId", () => {
    it("should convert comment id to 8-char uppercase hex", () => {
        expect(commentIdToParaId(0)).to.equal("00000001");
        expect(commentIdToParaId(1)).to.equal("00000002");
        expect(commentIdToParaId(255)).to.equal("00000100");
    });
});
