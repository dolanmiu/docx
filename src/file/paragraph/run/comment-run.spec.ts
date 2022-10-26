import { expect } from "chai";
import * as sinon from "sinon";

import { Formatter } from "@export/formatter";
import { Comment, CommentRangeEnd, CommentRangeStart, CommentReference, Comments } from "./comment-run";

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
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        const now = new Date(1999, 0, 1);
        clock = sinon.useFakeTimers(now.getTime());
    });

    afterEach(() => {
        clock.restore();
    });

    describe("#constructor()", () => {
        it("should create", () => {
            const component = new Comment({
                id: 0,
                text: "test-comment",
                date: new Date(1999, 0, 1),
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

        it("should create by using default date", () => {
            const component = new Comment({
                id: 0,
                text: "test-comment",
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
                        text: "test-comment",
                        date: new Date(1999, 0, 1),
                    },
                    {
                        id: 1,
                        text: "test-comment-2",
                        date: new Date(1999, 0, 1),
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
    });
});
