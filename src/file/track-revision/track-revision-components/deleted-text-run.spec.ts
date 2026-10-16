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
        const attributes = { _attr: { "w:author": "Author", "w:date": "123", "w:id": 0 } };
        const bold = { "w:rPr": [{ "w:b": {} }, { "w:bCs": {} }] };
        const deleted = (text: string) => ({ "w:delText": [{ _attr: { "xml:space": "preserve" } }, text] });
        const fieldChar = (type: string) => ({ "w:fldChar": { _attr: { "w:fldCharType": type } } });
        const instruction = (text: string) => ({ "w:delInstrText": [{ _attr: { "xml:space": "preserve" } }, text] });

        it.each([
            [PageNumber.TOTAL_PAGES, "NUMPAGES"],
            [PageNumber.TOTAL_PAGES_IN_SECTION, "SECTIONPAGES"],
            [PageNumber.CURRENT, "PAGE"],
        ])("should delete %s as a field whose characters and instruction are each in a run of their own", (pageNumber, code) => {
            const deletedTextRun = new DeletedTextRun({ children: [" to ", pageNumber], id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    attributes,
                    { "w:r": [deleted(" to ")] },
                    { "w:r": [fieldChar("begin")] },
                    { "w:r": [instruction(code)] },
                    { "w:r": [fieldChar("separate")] },
                    { "w:r": [fieldChar("end")] },
                ],
            });
        });

        it("should give each run of the field, and the text after it, the run's properties", () => {
            const deletedTextRun = new DeletedTextRun({
                children: [PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                bold: true,
                id: 0,
                date: "123",
                author: "Author",
            });
            const tree = new Formatter().format(deletedTextRun);
            expect(tree).to.deep.equal({
                "w:del": [
                    attributes,
                    { "w:r": [bold, fieldChar("begin")] },
                    { "w:r": [bold, instruction("PAGE")] },
                    { "w:r": [bold, fieldChar("separate")] },
                    { "w:r": [bold, fieldChar("end")] },
                    { "w:r": [bold, deleted(" of ")] },
                    { "w:r": [bold, fieldChar("begin")] },
                    { "w:r": [bold, instruction("NUMPAGES")] },
                    { "w:r": [bold, fieldChar("separate")] },
                    { "w:r": [bold, fieldChar("end")] },
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
