import { expect } from "chai";

import { findLocationOfText } from "./traverser";

const MOCK_JSON = {
    elements: [
        {
            type: "element",
            name: "w:document",
            attributes: {
                "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
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
                "xmlns:oel": "http://schemas.microsoft.com/office/2019/extlst",
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
            elements: [
                {
                    type: "element",
                    name: "w:body",
                    elements: [
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "2499FE9F",
                                "w14:textId": "0A3D130F",
                                "w:rsidR": "00B51233",
                                "w:rsidRDefault": "007B52ED",
                                "w:rsidP": "007B52ED",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:pPr",
                                    elements: [{ type: "element", name: "w:pStyle", attributes: { "w:val": "Title" } }],
                                },
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "Hello World" }] }],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "6410D9A0",
                                "w14:textId": "7579AB49",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "57ACF964",
                                "w14:textId": "315D7A05",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "Hello {{name}}," }] }],
                                },
                                {
                                    type: "element",
                                    name: "w:r",
                                    attributes: { "w:rsidR": "008126CB" },
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:t",
                                            attributes: { "xml:space": "preserve" },
                                            elements: [{ type: "text", text: " how are you?" }],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "38C7DF4A",
                                "w14:textId": "66CDEC9A",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "04FABE2B",
                                "w14:textId": "3DACA001",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [
                                        { type: "element", name: "w:t", elements: [{ type: "text", text: "{{paragraph_replace}}" }] },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "7AD7975D",
                                "w14:textId": "77777777",
                                "w:rsidR": "00EF161F",
                                "w:rsidRDefault": "00EF161F",
                            },
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "3BD6D75A",
                                "w14:textId": "19AE3121",
                                "w:rsidR": "00EF161F",
                                "w:rsidRDefault": "00EF161F",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "{{table}}" }] }],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "76023962",
                                "w14:textId": "4E606AB9",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                        },
                        {
                            type: "element",
                            name: "w:tbl",
                            elements: [
                                {
                                    type: "element",
                                    name: "w:tblPr",
                                    elements: [
                                        { type: "element", name: "w:tblStyle", attributes: { "w:val": "TableGrid" } },
                                        { type: "element", name: "w:tblW", attributes: { "w:w": "0", "w:type": "auto" } },
                                        {
                                            type: "element",
                                            name: "w:tblLook",
                                            attributes: {
                                                "w:val": "04A0",
                                                "w:firstRow": "1",
                                                "w:lastRow": "0",
                                                "w:firstColumn": "1",
                                                "w:lastColumn": "0",
                                                "w:noHBand": "0",
                                                "w:noVBand": "1",
                                            },
                                        },
                                    ],
                                },
                                {
                                    type: "element",
                                    name: "w:tblGrid",
                                    elements: [
                                        { type: "element", name: "w:gridCol", attributes: { "w:w": "3003" } },
                                        { type: "element", name: "w:gridCol", attributes: { "w:w": "3003" } },
                                        { type: "element", name: "w:gridCol", attributes: { "w:w": "3004" } },
                                    ],
                                },
                                {
                                    type: "element",
                                    name: "w:tr",
                                    attributes: {
                                        "w:rsidR": "00EF161F",
                                        "w14:paraId": "1DEC5955",
                                        "w14:textId": "77777777",
                                        "w:rsidTr": "00EF161F",
                                    },
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "54DA5587",
                                                        "w14:textId": "625BAC60",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                    elements: [
                                                        {
                                                            type: "element",
                                                            name: "w:r",
                                                            elements: [
                                                                {
                                                                    type: "element",
                                                                    name: "w:t",
                                                                    elements: [{ type: "text", text: "{{table_heading_1}}" }],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "57100910",
                                                        "w14:textId": "71FD5616",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3004", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "1D388FAB",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "element",
                                    name: "w:tr",
                                    attributes: {
                                        "w:rsidR": "00EF161F",
                                        "w14:paraId": "0F53D2DC",
                                        "w14:textId": "77777777",
                                        "w:rsidTr": "00EF161F",
                                    },
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "0F2BCCED",
                                                        "w14:textId": "3C3B6706",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                    elements: [
                                                        {
                                                            type: "element",
                                                            name: "w:r",
                                                            elements: [
                                                                {
                                                                    type: "element",
                                                                    name: "w:t",
                                                                    elements: [{ type: "text", text: "Item: {{item_1}}" }],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "1E6158AC",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3004", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "17937748",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "element",
                                    name: "w:tr",
                                    attributes: {
                                        "w:rsidR": "00EF161F",
                                        "w14:paraId": "781DAC1A",
                                        "w14:textId": "77777777",
                                        "w:rsidTr": "00EF161F",
                                    },
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "1DCD0343",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3003", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "5D02E3CD",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            type: "element",
                                            name: "w:tc",
                                            elements: [
                                                {
                                                    type: "element",
                                                    name: "w:tcPr",
                                                    elements: [
                                                        { type: "element", name: "w:tcW", attributes: { "w:w": "3004", "w:type": "dxa" } },
                                                    ],
                                                },
                                                {
                                                    type: "element",
                                                    name: "w:p",
                                                    attributes: {
                                                        "w14:paraId": "52EA0DBB",
                                                        "w14:textId": "77777777",
                                                        "w:rsidR": "00EF161F",
                                                        "w:rsidRDefault": "00EF161F",
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "47CD1FBC",
                                "w14:textId": "23474CBC",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "0ACCEE90",
                                "w14:textId": "67907499",
                                "w:rsidR": "00EF161F",
                                "w:rsidRDefault": "0077578F",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "{{image_test}}" }] }],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "23FA9862",
                                "w14:textId": "77777777",
                                "w:rsidR": "0077578F",
                                "w:rsidRDefault": "0077578F",
                            },
                        },
                        {
                            type: "element",
                            name: "w:p",
                            attributes: {
                                "w14:paraId": "01578F2F",
                                "w14:textId": "3BDC6C85",
                                "w:rsidR": "007B52ED",
                                "w:rsidRDefault": "007B52ED",
                            },
                            elements: [
                                {
                                    type: "element",
                                    name: "w:r",
                                    elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "Thank you" }] }],
                                },
                            ],
                        },
                        {
                            type: "element",
                            name: "w:sectPr",
                            attributes: { "w:rsidR": "007B52ED", "w:rsidSect": "0072043F" },
                            elements: [
                                { type: "element", name: "w:headerReference", attributes: { "w:type": "default", "r:id": "rId6" } },
                                { type: "element", name: "w:footerReference", attributes: { "w:type": "default", "r:id": "rId7" } },
                                { type: "element", name: "w:pgSz", attributes: { "w:w": "11900", "w:h": "16840" } },
                                {
                                    type: "element",
                                    name: "w:pgMar",
                                    attributes: {
                                        "w:top": "1440",
                                        "w:right": "1440",
                                        "w:bottom": "1440",
                                        "w:left": "1440",
                                        "w:header": "708",
                                        "w:footer": "708",
                                        "w:gutter": "0",
                                    },
                                },
                                { type: "element", name: "w:cols", attributes: { "w:space": "708" } },
                                { type: "element", name: "w:docGrid", attributes: { "w:linePitch": "360" } },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

describe("traverser", () => {
    describe("findLocationOfText", () => {
        it("should find the location of text", () => {
            const output = findLocationOfText(MOCK_JSON, "{{table_heading_1}}");
            expect(output).to.deep.equal([
                {
                    index: 1,
                    path: [0, 0, 0, 8, 2, 0, 1],
                    runs: [
                        {
                            end: 18,
                            index: 0,
                            parts: [
                                {
                                    end: 18,
                                    index: 0,
                                    start: 0,
                                    text: "{{table_heading_1}}",
                                },
                            ],
                            start: 0,
                            text: "{{table_heading_1}}",
                        },
                    ],
                    text: "{{table_heading_1}}",
                },
            ]);
        });
    });
});
