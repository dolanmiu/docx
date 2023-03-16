import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { Paragraph, TextRun } from "@file/paragraph";
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

        it("should replace paragraph type", () => {
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

        it("should replace document type", () => {
            const output = replacer(
                MOCK_JSON,
                {
                    type: PatchType.DOCUMENT,
                    children: [new Paragraph("Lorem ipsum paragraph")],
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

            expect(JSON.stringify(output)).to.contain("Lorem ipsum paragraph");
        });

        it("should throw an error if the type is not supported", () => {
            expect(() =>
                replacer(
                    {},
                    {
                        type: PatchType.DOCUMENT,
                        children: [new Paragraph("Lorem ipsum paragraph")],
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
                ),
            ).to.throw();
        });
    });
});
