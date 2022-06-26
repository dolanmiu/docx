import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { FootnoteReferenceRun } from "@file/footnotes";
import { PageNumber } from "@file/paragraph";

import { DeletedTextRun } from "./deleted-text-run";

describe("DeletedTextRun", () => {
    describe("#constructor", () => {
        it("should create a deleted text run", () => {
            const deletedTextRun = new DeletedTextRun({ text: "some text", id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "some text",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#constructor with formatting", () => {
        it("should create a deleted text run", () => {
            const deletedTextRun = new DeletedTextRun({ text: "some text", bold: true, id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:rPr": [
                                    {
                                        "w:b": {},
                                    },
                                    {
                                        "w:bCs": {},
                                    },
                                ],
                            },
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "some text",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#break()", () => {
        it("should add a break", () => {
            const deletedTextRun = new DeletedTextRun({
                break: 1,
                children: ["some text"],
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:br": {},
                            },
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "some text",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("page numbering", () => {
        it("should be able to delete the total pages", () => {
            const deletedTextRun = new DeletedTextRun({
                children: [" to ", PageNumber.TOTAL_PAGES],
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    " to ",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "begin",
                                    },
                                },
                            },
                            {
                                "w:delInstrText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "NUMPAGES",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "separate",
                                    },
                                },
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "end",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should be able to delete the total pages in section", () => {
            const deletedTextRun = new DeletedTextRun({
                children: [" to ", PageNumber.TOTAL_PAGES_IN_SECTION],
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    " to ",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "begin",
                                    },
                                },
                            },
                            {
                                "w:delInstrText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "SECTIONPAGES",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "separate",
                                    },
                                },
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "end",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should be able to delete the current page", () => {
            const deletedTextRun = new DeletedTextRun({
                children: [" to ", PageNumber.CURRENT],
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    " to ",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "begin",
                                    },
                                },
                            },
                            {
                                "w:delInstrText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "PAGE",
                                ],
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "separate",
                                    },
                                },
                            },
                            {
                                "w:fldChar": {
                                    _attr: {
                                        "w:fldCharType": "end",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("footnote references", () => {
        it("should add a valid footnote reference", () => {
            const deletedTextRun = new DeletedTextRun({
                children: ["some text", new FootnoteReferenceRun(1)],
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    {
                        _attr: {
                            "w:author": "Author",
                            "w:date": "123",
                            "w:id": 0,
                        },
                    },
                    {
                        "w:r": [
                            {
                                "w:delText": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "some text",
                                ],
                            },
                            {
                                "w:r": [
                                    { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "FootnoteReference" } } }] },
                                    { "w:footnoteReference": { _attr: { "w:id": 1 } } },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
