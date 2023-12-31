import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { Paragraph, TextRun } from "@file/paragraph";
import { IContext } from "@file/xml-components";
import { describe, expect, it, vi } from "vitest";

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
                {
                    type: "element",
                    name: "w:p",
                    elements: [
                        {
                            type: "element",
                            name: "w:r",
                            elements: [
                                {
                                    type: "element",
                                    name: "w:rPr",
                                    elements: [{ type: "element", name: "w:b", attributes: { "w:val": "1" } }],
                                },
                                {
                                    type: "element",
                                    name: "w:t",
                                    elements: [{ type: "text", text: "What a {{bold}} text!" }],
                                },
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
            const output = replacer({
                json: {
                    elements: [],
                },
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [],
                },
                patchText: "hello",
                renderedParagraphs: [],
                // eslint-disable-next-line functional/prefer-readonly-type
                context: vi.fn<[], IContext>()(),
            });

            expect(output).to.deep.equal({
                elements: [],
            });
        });

        it("should replace paragraph type", () => {
            const output = replacer({
                json: MOCK_JSON,

                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("Delightful Header")],
                },
                patchText: "{{header_adjective}}",

                renderedParagraphs: [
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
                        pathToParagraph: [0, 0, 0],
                    },
                ],
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(JSON.stringify(output)).to.contain("Delightful Header");
        });

        it("should replace paragraph type keeping original styling if keepOriginalStyles is true", () => {
            const output = replacer({
                json: MOCK_JSON,
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("sweet")],
                },
                patchText: "{{bold}}",
                renderedParagraphs: [
                    {
                        text: "What a {{bold}} text!",
                        runs: [
                            {
                                text: "What a {{bold}} text!",
                                parts: [{ text: "What a {{bold}} text!", index: 1, start: 0, end: 21 }],
                                index: 0,
                                start: 0,
                                end: 21,
                            },
                        ],
                        index: 0,
                        pathToParagraph: [0, 0, 1],
                    },
                ],
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
                keepOriginalStyles: true,
            });

            expect(JSON.stringify(output)).to.contain("sweet");
            expect(output.elements![0].elements![1].elements).toMatchObject([
                {
                    type: "element",
                    name: "w:r",
                    elements: [
                        {
                            type: "element",
                            name: "w:rPr",
                            elements: [{ type: "element", name: "w:b", attributes: { "w:val": "1" } }],
                        },
                        {
                            type: "element",
                            name: "w:t",
                            elements: [{ type: "text", text: "What a " }],
                        },
                    ],
                },
                {
                    type: "element",
                    name: "w:r",
                    elements: [
                        {
                            type: "element",
                            name: "w:rPr",
                            elements: [{ type: "element", name: "w:b", attributes: { "w:val": "1" } }],
                        },
                        {
                            type: "element",
                            name: "w:t",
                            elements: [{ type: "text", text: "sweet" }],
                        },
                    ],
                },
                {
                    type: "element",
                    name: "w:r",
                    elements: [
                        {
                            type: "element",
                            name: "w:rPr",
                            elements: [{ type: "element", name: "w:b", attributes: { "w:val": "1" } }],
                        },
                        {
                            type: "element",
                            name: "w:t",
                            elements: [{ type: "text", text: " text!" }],
                        },
                    ],
                },
            ]);
        });

        it("should replace document type", () => {
            const output = replacer({
                json: MOCK_JSON,
                patch: {
                    type: PatchType.DOCUMENT,
                    children: [new Paragraph("Lorem ipsum paragraph")],
                },
                patchText: "{{header_adjective}}",
                renderedParagraphs: [
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
                        pathToParagraph: [0, 0, 0],
                    },
                ],
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(JSON.stringify(output)).to.contain("Lorem ipsum paragraph");
        });

        it("should throw an error if the type is not supported", () => {
            expect(() =>
                replacer({
                    json: {},
                    patch: {
                        type: PatchType.DOCUMENT,
                        children: [new Paragraph("Lorem ipsum paragraph")],
                    },
                    patchText: "{{header_adjective}}",

                    renderedParagraphs: [
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
                            pathToParagraph: [0, 0, 0],
                        },
                    ],
                    context: {
                        file: {} as unknown as File,
                        viewWrapper: {
                            Relationships: {},
                        } as unknown as IViewWrapper,
                        stack: [],
                    },
                }),
            ).to.throw();
        });
    });
});
