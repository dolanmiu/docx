import { expect } from "chai";
import * as sinon from "sinon";

import { Formatter } from "export/formatter";

import { File } from "./file";
import { Footer, Header } from "./header";
import { HyperlinkRef, Paragraph } from "./paragraph";
import { Table, TableCell, TableRow } from "./table";
import { TableOfContents } from "./table-of-contents";

describe("File", () => {
    describe("#constructor", () => {
        it("should create with correct headers and footers by default", () => {
            const doc = new File();

            doc.addSection({
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("default");
        });

        it("should create with correct headers and footers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    default: new Header(),
                },
                footers: {
                    default: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("default");
        });

        it("should create with first headers and footers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    first: new Header(),
                },
                footers: {
                    first: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][0]["w:sectPr"][5]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][7]["w:footerReference"]._attr["w:type"]).to.equal("first");
        });

        it("should create with correct headers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    default: new Header(),
                    first: new Header(),
                    even: new Header(),
                },
                footers: {
                    default: new Footer(),
                    first: new Footer(),
                    even: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][6]["w:headerReference"]._attr["w:type"]).to.equal("even");

            expect(tree["w:body"][0]["w:sectPr"][7]["w:footerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][8]["w:footerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][9]["w:footerReference"]._attr["w:type"]).to.equal("even");
        });

        it("should add child", () => {
            const doc = new File(undefined, undefined, [
                {
                    children: [new Paragraph("test")],
                },
            ]);

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree).to.deep.equal({
                "w:body": [
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
                                            "test",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:sectPr": [
                            {
                                "w:pgSz": {
                                    _attr: {
                                        "w:h": 16838,
                                        "w:orient": "portrait",
                                        "w:w": 11906,
                                    },
                                },
                            },
                            {
                                "w:pgMar": {
                                    _attr: {
                                        "w:bottom": 1440,
                                        "w:footer": 708,
                                        "w:gutter": 0,
                                        "w:header": 708,
                                        "w:left": 1440,
                                        "w:mirrorMargins": false,
                                        "w:right": 1440,
                                        "w:top": 1440,
                                    },
                                },
                            },
                            {
                                "w:cols": {
                                    _attr: {
                                        "w:num": 1,
                                        "w:space": 708,
                                    },
                                },
                            },
                            {
                                "w:docGrid": {
                                    _attr: {
                                        "w:linePitch": 360,
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add hyperlink child", () => {
            const doc = new File(undefined, undefined, [
                {
                    children: [new HyperlinkRef("test")],
                },
            ]);

            expect(doc.HyperlinkCache).to.deep.equal({});
        });
    });

    describe("#addSection", () => {
        it("should call the underlying document's add a Paragraph", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [new Paragraph({})],
            });

            expect(spy.called).to.equal(true);
        });

        it("should add hyperlink child", () => {
            const doc = new File();

            doc.addSection({
                children: [new HyperlinkRef("test")],
            });

            expect(doc.HyperlinkCache).to.deep.equal({});
        });

        it("should call the underlying document's add when adding a Table", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("hello")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying document's add when adding an Image (paragraph)", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            // tslint:disable-next-line:no-any
            file.addSection({
                children: [new Paragraph("")],
            });

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addSection", () => {
        it("should call the underlying document's add", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [new TableOfContents()],
            });

            expect(spy.called).to.equal(true);
        });
    });

    describe("#HyperlinkCache", () => {
        it("should initially have empty hyperlink cache", () => {
            const file = new File();

            expect(file.HyperlinkCache).to.deep.equal({});
        });
    });

    describe("#createFootnote", () => {
        it("should create footnote", () => {
            const wrapper = new File({
                footnotes: [new Paragraph("hello")],
            });

            const tree = new Formatter().format(wrapper.FootNotes);

            expect(tree).to.deep.equal({
                "w:footnotes": [
                    {
                        _attr: {
                            "mc:Ignorable": "w14 w15 wp14",
                            "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                            "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                            "xmlns:o": "urn:schemas-microsoft-com:office:office",
                            "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                            "xmlns:v": "urn:schemas-microsoft-com:vml",
                            "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                            "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                            "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                            "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                            "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                            "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                            "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                            "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                            "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                            "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                            "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                        },
                    },
                    {
                        "w:footnote": [
                            {
                                _attr: {
                                    "w:id": -1,
                                    "w:type": "separator",
                                },
                            },
                            {
                                "w:p": [
                                    {
                                        "w:pPr": [
                                            {
                                                "w:spacing": {
                                                    _attr: {
                                                        "w:after": 0,
                                                        "w:line": 240,
                                                        "w:lineRule": "auto",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:r": [
                                            {
                                                "w:rPr": [
                                                    {
                                                        "w:rStyle": {
                                                            _attr: {
                                                                "w:val": "FootnoteReference",
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "w:footnoteRef": {},
                                            },
                                        ],
                                    },
                                    {
                                        "w:r": [
                                            {
                                                "w:separator": {},
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:footnote": [
                            {
                                _attr: {
                                    "w:id": 0,
                                    "w:type": "continuationSeparator",
                                },
                            },
                            {
                                "w:p": [
                                    {
                                        "w:pPr": [
                                            {
                                                "w:spacing": {
                                                    _attr: {
                                                        "w:after": 0,
                                                        "w:line": 240,
                                                        "w:lineRule": "auto",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:r": [
                                            {
                                                "w:rPr": [
                                                    {
                                                        "w:rStyle": {
                                                            _attr: {
                                                                "w:val": "FootnoteReference",
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "w:footnoteRef": {},
                                            },
                                        ],
                                    },
                                    {
                                        "w:r": [
                                            {
                                                "w:continuationSeparator": {},
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:footnote": [
                            {
                                _attr: {
                                    "w:id": 1,
                                },
                            },
                            {
                                "w:p": [
                                    {
                                        "w:r": [
                                            {
                                                "w:rPr": [
                                                    {
                                                        "w:rStyle": {
                                                            _attr: {
                                                                "w:val": "FootnoteReference",
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "w:footnoteRef": {},
                                            },
                                        ],
                                    },
                                    {
                                        "w:r": [
                                            {
                                                "w:t": [
                                                    {
                                                        _attr: {
                                                            "xml:space": "preserve",
                                                        },
                                                    },
                                                    "hello",
                                                ],
                                            },
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
