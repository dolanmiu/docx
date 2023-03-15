import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { TextRun } from "@file/paragraph";
import { IContext } from "@file/xml-components";
import { expect } from "chai";
import * as sinon from "sinon";

import { PatchType } from "./from-docx";

import { replacer } from "./replacer";

const MOCK_JSON = {
    elements: [
        {
            type: "element",
            name: "w:hdr",
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
                    name: "w:p",
                    attributes: { "w14:paraId": "3BE1A671", "w14:textId": "74E856C4", "w:rsidR": "000D38A7", "w:rsidRDefault": "000D38A7" },
                    elements: [
                        {
                            type: "element",
                            name: "w:pPr",
                            elements: [{ type: "element", name: "w:pStyle", attributes: { "w:val": "Header" } }],
                        },
                        {
                            type: "element",
                            name: "w:r",
                            elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "This is a {{head" }] }],
                        },
                        {
                            type: "element",
                            name: "w:r",
                            attributes: { "w:rsidR": "004A3A99" },
                            elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "er" }] }],
                        },
                        {
                            type: "element",
                            name: "w:r",
                            elements: [
                                { type: "element", name: "w:t", elements: [{ type: "text", text: "_adjective}} don’t you think?" }] },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

describe("replacer", () => {
    describe("replacer", () => {
        it("should return the same object if nothing is added", () => {
            const output = replacer(
                {
                    elements: [],
                },
                {
                    type: PatchType.PARAGRAPH,
                    children: [],
                },
                "hello",
                [],
                sinon.mock() as unknown as IContext,
            );

            expect(output).to.deep.equal({
                elements: [],
            });
        });

        it("should return the same object if nothing is added", () => {
            const output = replacer(
                MOCK_JSON,
                {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("Delightful Header")],
                },
                "{{header_adjective}}",
                [
                    {
                        text: "This is a {{header_adjective}} don’t you think?",
                        runs: [
                            {
                                text: "This is a {{head",
                                parts: [{ text: "This is a {{head", index: 0, start: 0, end: 15 }],
                                index: 1,
                                start: 0,
                                end: 15,
                            },
                            { text: "er", parts: [{ text: "er", index: 0, start: 16, end: 17 }], index: 2, start: 16, end: 17 },
                            {
                                text: "_adjective}} don’t you think?",
                                parts: [{ text: "_adjective}} don’t you think?", index: 0, start: 18, end: 46 }],
                                index: 3,
                                start: 18,
                                end: 46,
                            },
                        ],
                        index: 0,
                        path: [0, 0, 0],
                    },
                ],
                {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            );

            expect(JSON.stringify(output)).to.contain("Delightful Header");
        });
    });
});
