import { expect } from "chai";

import { Formatter } from "export/formatter";

import { File } from "./file";
import { Footer, Header } from "./header";
import { Paragraph } from "./paragraph";

describe("File", () => {
    describe("#constructor", () => {
        it("should create with correct headers and footers", () => {
            const doc = new File({
                sections: [
                    {
                        headers: {
                            default: new Header(),
                        },
                        footers: {
                            default: new Footer(),
                        },
                        children: [],
                    },
                ],
            });

            const tree = new Formatter().format(doc.Document.View.Body);

            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("default");
        });

        it("should create with first headers and footers", () => {
            const doc = new File({
                sections: [
                    {
                        headers: {
                            first: new Header(),
                        },
                        footers: {
                            first: new Footer(),
                        },
                        children: [],
                    },
                ],
            });

            const tree = new Formatter().format(doc.Document.View.Body);
            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("first");
        });

        it("should create with correct headers", () => {
            const doc = new File({
                sections: [
                    {
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
                    },
                ],
            });

            const tree = new Formatter().format(doc.Document.View.Body);

            expect(tree["w:body"][0]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][5]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][6]["w:headerReference"]._attr["w:type"]).to.equal("even");

            expect(tree["w:body"][0]["w:sectPr"][7]["w:footerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][0]["w:sectPr"][8]["w:footerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][0]["w:sectPr"][9]["w:footerReference"]._attr["w:type"]).to.equal("even");
        });

        it("should add child", () => {
            const doc = new File({
                sections: [
                    {
                        children: [new Paragraph("test")],
                    },
                ],
            });

            const tree = new Formatter().format(doc.Document.View.Body);

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
                                        "w:sep": false,
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
                            {
                                "w:pgNumType": {
                                    _attr: {},
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#addTrackRevisionsFeature", () => {
        it("should call the underlying document's add", () => {
            const file = new File({
                features: {
                    trackRevisions: true,
                },
                sections: [],
            });

            // tslint:disable-next-line: no-unused-expression no-string-literal
            expect(file.Settings["trackRevisions"]).to.exist;
        });
    });

    describe("#createFootnote", () => {
        it("should create footnote", () => {
            const wrapper = new File({
                footnotes: {
                    1: {
                        children: [new Paragraph("hello")],
                    },
                },
                sections: [],
            });

            const tree = new Formatter().format(wrapper.FootNotes.View);

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

    it("should create default run and paragraph property document defaults", () => {
        const doc = new File({
            styles: {
                default: {},
            },
            sections: [],
        });

        const tree = new Formatter().format(doc.Styles);

        expect(tree["w:styles"][1]).to.deep.equal({
            "w:docDefaults": [
                {
                    "w:rPrDefault": {},
                },
                {
                    "w:pPrDefault": {},
                },
            ],
        });
    });

    it("should create with even and odd headers and footers", () => {
        const doc = new File({
            evenAndOddHeaderAndFooters: true,
            sections: [],
        });

        const tree = new Formatter().format(doc.Settings);

        expect(tree["w:settings"][2]).to.deep.equal({ "w:evenAndOddHeaders": {} });
    });
});
