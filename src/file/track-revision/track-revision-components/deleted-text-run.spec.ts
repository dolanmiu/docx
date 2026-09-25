import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { FootnoteReferenceRun } from "@file/footnotes";
import { PageNumber, Tab } from "@file/paragraph";

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

    describe("#constructor without children or text", () => {
        it("should create a deleted text run with no text content", () => {
            const deletedTextRun = new DeletedTextRun({ id: 0, date: "123", author: "Author" });
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
                        "w:r": {},
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
        it("should write a footnote reference in the children as a run after the deleted run, not inside it", () => {
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
                        ],
                    },
                    {
                        "w:r": [
                            { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "FootnoteReference" } } }] },
                            { "w:footnoteReference": { _attr: { "w:id": 1 } } },
                        ],
                    },
                ],
            });
        });

        it("should keep other elements in the children, such as a tab, in the deleted run", () => {
            const deletedTextRun = new DeletedTextRun({ children: [new Tab(), "A"], id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    { _attr: { "w:author": "Author", "w:date": "123", "w:id": 0 } },
                    { "w:r": [{ "w:tab": {} }, { "w:delText": [{ _attr: { "xml:space": "preserve" } }, "A"] }] },
                ],
            });
        });

        it("should split the deleted run at each footnote reference, and keep its properties for the text after it", () => {
            const deletedTextRun = new DeletedTextRun({
                children: ["A", new FootnoteReferenceRun(1), "B", new FootnoteReferenceRun(2)],
                bold: true,
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            const bold = { "w:rPr": [{ "w:b": {} }, { "w:bCs": {} }] };
            const deleted = (text: string) => ({ "w:r": [bold, { "w:delText": [{ _attr: { "xml:space": "preserve" } }, text] }] });
            const reference = (id: number) => ({
                "w:r": [
                    { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "FootnoteReference" } } }] },
                    { "w:footnoteReference": { _attr: { "w:id": id } } },
                ],
            });
            expect(tree).to.deep.equal({
                "w:del": [
                    { _attr: { "w:author": "Author", "w:date": "123", "w:id": 0 } },
                    deleted("A"),
                    reference(1),
                    deleted("B"),
                    reference(2),
                ],
            });
        });
    });
});
