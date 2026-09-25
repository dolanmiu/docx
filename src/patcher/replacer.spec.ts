import { describe, expect, it, vi } from "vitest";
import type { Element } from "xml-js";

import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { ConcreteHyperlink, Paragraph, type ParagraphChild, TextRun } from "@file/paragraph";

import { PatchType } from "./from-docx";
import { replacer } from "./replacer";
import { traverse } from "./traverser";

export const MOCK_JSON = {
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
                                {
                                    type: "element",
                                    name: "w:br",
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
        it("should return { didFindOccurrence: false } if nothing is added", () => {
            const { didFindOccurrence } = replacer({
                json: {
                    elements: [],
                },
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [],
                },
                patchText: "hello",
                context: vi.fn()(),
            });
            expect(didFindOccurrence).toBe(false);
        });

        it("should replace paragraph type", () => {
            const { element, didFindOccurrence } = replacer({
                json: JSON.parse(JSON.stringify(MOCK_JSON)),
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("Delightful Header")],
                },
                patchText: "{{header_adjective}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(JSON.stringify(element)).to.contain("Delightful Header");
            expect(didFindOccurrence).toBe(true);
        });

        it("should replace paragraph type without keeping original styles if keepOriginalStyles is false", () => {
            const { element, didFindOccurrence } = replacer({
                json: JSON.parse(JSON.stringify(MOCK_JSON)),
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("sweet")],
                },
                patchText: "{{bold}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
                keepOriginalStyles: false,
            });

            expect(JSON.stringify(element)).to.contain("sweet");
            expect(didFindOccurrence).toBe(true);
            // When keepOriginalStyles is false, the replacement runs should NOT
            // have the original w:rPr elements copied into them
            const secondParagraph = element.elements![0].elements![1];
            const replacementRun = secondParagraph.elements!.find((e) =>
                e.elements?.some((el) => el.elements?.some((t) => t.text === "sweet")),
            );
            // The replacement run should not contain rPr from the original
            const rPrElements = replacementRun?.elements?.filter((e) => e.name === "w:rPr");
            expect(rPrElements).to.have.length(0);
        });

        it("should replace paragraph type keeping original styling if keepOriginalStyles is true", () => {
            const { element, didFindOccurrence } = replacer({
                json: JSON.parse(JSON.stringify(MOCK_JSON)),
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun("sweet")],
                },
                patchText: "{{bold}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
                keepOriginalStyles: true,
            });

            expect(JSON.stringify(element)).to.contain("sweet");
            expect(element.elements![0].elements![1].elements).toMatchObject([
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
                        {
                            name: "w:br",
                            type: "element",
                        },
                    ],
                },
            ]);
            expect(didFindOccurrence).toBe(true);
        });

        it("should replace document type", () => {
            const { element, didFindOccurrence } = replacer({
                json: JSON.parse(JSON.stringify(MOCK_JSON)),
                patch: {
                    type: PatchType.DOCUMENT,
                    children: [new Paragraph("Lorem ipsum paragraph")],
                },
                patchText: "{{header_adjective}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(JSON.stringify(element)).to.contain("Lorem ipsum paragraph");
            expect(didFindOccurrence).toBe(true);
        });

        it("should replace", () => {
            // cspell:disable
            const { element, didFindOccurrence } = replacer({
                json: {
                    elements: [
                        {
                            type: "element",
                            name: "w:hdr",
                            elements: [
                                {
                                    type: "element",
                                    name: "w:p",
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "{{" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n          " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "s" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n  " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n    " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n      " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "chool_" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "n" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "{{" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "a" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "ddr" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "ess" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                        { type: "text", text: "\n                    " },
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n      " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:kern",
                                                            attributes: { "w:val": "0" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:sz",
                                                            attributes: { "w:val": "20" },
                                                        },
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:lang",
                                                            attributes: {
                                                                "w:val": "en-US",
                                                                "w:eastAsia": "en-US",
                                                                "w:bidi": "ar-SA",
                                                            },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "}}" }],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                // cspell:enable
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new Paragraph("Lorem ipsum paragraph")],
                },
                patchText: "{{address}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(JSON.stringify(element)).to.contain("Lorem ipsum paragraph");
            expect(didFindOccurrence).toBe(true);
        });

        it("should handle empty runs in patches", () => {
            // cspell:disable
            const { element, didFindOccurrence } = replacer({
                json: {
                    elements: [
                        {
                            type: "element",
                            name: "w:hdr",
                            elements: [
                                {
                                    type: "element",
                                    name: "w:p",
                                    elements: [
                                        {
                                            type: "element",
                                            name: "w:r",
                                            elements: [
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:rPr",
                                                    elements: [
                                                        { type: "text", text: "\n                            " },
                                                        {
                                                            type: "element",
                                                            name: "w:rFonts",
                                                            attributes: { "w:eastAsia": "Times New Roman" },
                                                        },
                                                        { type: "text", text: "\n                        " },
                                                    ],
                                                },
                                                { type: "text", text: "\n                        " },
                                                {
                                                    type: "element",
                                                    name: "w:t",
                                                    elements: [{ type: "text", text: "{{empty}}" }],
                                                },
                                                { type: "text", text: "\n                    " },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                // cspell:enable
                patch: {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun({})],
                },
                patchText: "{{empty}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: {
                        Relationships: {},
                    } as unknown as IViewWrapper,
                    stack: [],
                },
                keepOriginalStyles: true,
            });

            expect(JSON.stringify(element)).not.to.contain("{{empty}}");
            expect(didFindOccurrence).toBe(true);
        });

        it("should handle multiple replacements in a single run with multiple text elements", () => {
            // Minimal reproduction of bug where:
            // 1. A w:r (run) contains multiple w:t (text) elements
            // 2. First replacement splits the run, creating additional w:t elements
            // 3. Second replacement must correctly:
            //    - Find the token in the remaining w:t elements (not get confused by earlier parts)
            //    - Split at the correct position in the flattened element array
            const json = {
                elements: [
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
                                        name: "w:t",
                                        elements: [{ type: "text", text: "A{{token1}}B" }],
                                    },
                                    { type: "element", name: "w:tab" },
                                    {
                                        type: "element",
                                        name: "w:t",
                                        elements: [{ type: "text", text: "C{{token2}}D" }],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            // First replacement
            replacer({
                json,
                patch: { type: PatchType.PARAGRAPH, children: [new TextRun("X")] },
                patchText: "{{token1}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: { Relationships: {} } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            // Second replacement - this is where the bug occurred
            const { didFindOccurrence } = replacer({
                json,
                patch: { type: PatchType.PARAGRAPH, children: [new TextRun("Y")] },
                patchText: "{{token2}}",
                context: {
                    file: {} as unknown as File,
                    viewWrapper: { Relationships: {} } as unknown as IViewWrapper,
                    stack: [],
                },
            });

            expect(didFindOccurrence).toBe(true);

            // Verify the rendered text is correct
            const paragraphs = traverse(json);
            expect(paragraphs[0].text).to.equal("AXBCYD");
        });

        describe("document type with the placeholder in more than one paragraph", () => {
            const createParagraph = (text: string) => ({
                type: "element",
                name: "w:p",
                elements: [
                    {
                        type: "element",
                        name: "w:r",
                        elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text }] }],
                    },
                ],
            });

            const replaceWithTwoParagraphs = (json: Element) =>
                replacer({
                    json,
                    patch: {
                        type: PatchType.DOCUMENT,
                        children: [new Paragraph("INSERTED"), new Paragraph("tail")],
                    },
                    patchText: "{{ph}}",
                    context: {
                        file: {} as unknown as File,
                        viewWrapper: { Relationships: {} } as unknown as IViewWrapper,
                        stack: [],
                    },
                });

            it("should replace every occurrence once and keep the content between them", () => {
                const json = {
                    elements: [
                        {
                            type: "element",
                            name: "w:body",
                            elements: [
                                createParagraph("HEADING ONE"),
                                createParagraph("{{ph}}"),
                                createParagraph("HEADING TWO"),
                                createParagraph("{{ph}}"),
                            ],
                        },
                    ],
                };

                const { didFindOccurrence } = replaceWithTwoParagraphs(json);

                expect(didFindOccurrence).toBe(true);
                expect(traverse(json).map((p) => p.text)).to.deep.equal([
                    "HEADING ONE",
                    "INSERTED",
                    "tail",
                    "HEADING TWO",
                    "INSERTED",
                    "tail",
                ]);
            });

            it("should replace occurrences at different depths", () => {
                const cell = { type: "element", name: "w:tc", elements: [createParagraph("{{ph}}")] };
                const body = {
                    type: "element",
                    name: "w:body",
                    elements: [
                        createParagraph("{{ph}}"),
                        {
                            type: "element",
                            name: "w:tbl",
                            elements: [{ type: "element", name: "w:tr", elements: [cell] }],
                        },
                        createParagraph("END"),
                    ],
                };

                replaceWithTwoParagraphs({ elements: [body] });

                expect(body.elements.map((e) => e.name)).to.deep.equal(["w:p", "w:p", "w:tbl", "w:p"]);
                expect(traverse({ elements: [cell] }).map((p) => p.text)).to.deep.equal(["INSERTED", "tail"]);
                expect(traverse({ elements: [body] }).map((p) => p.text)).to.deep.equal(["INSERTED", "tail", "END", "INSERTED", "tail"]);
            });

            it("should replace a paragraph that contains another occurrence, such as in a text box", () => {
                const textBoxRun = {
                    type: "element",
                    name: "w:r",
                    elements: [{ type: "element", name: "w:txbxContent", elements: [createParagraph("{{ph}}")] }],
                };
                const outerParagraph = { type: "element", name: "w:p", elements: [...createParagraph("{{ph}}").elements, textBoxRun] };
                const body = { type: "element", name: "w:body", elements: [outerParagraph, createParagraph("END")] };

                replaceWithTwoParagraphs({ elements: [body] });

                expect(traverse({ elements: [body] }).map((p) => p.text)).to.deep.equal(["INSERTED", "tail", "END"]);
            });

            it("should not patch an occurrence inside a paragraph that is replaced, as it would be thrown away", () => {
                const textBoxRun = {
                    type: "element",
                    name: "w:r",
                    elements: [{ type: "element", name: "w:txbxContent", elements: [createParagraph("{{ph}}")] }],
                };
                const outerParagraph = { type: "element", name: "w:p", elements: [...createParagraph("{{ph}}").elements, textBoxRun] };

                replaceWithTwoParagraphs({ elements: [{ type: "element", name: "w:body", elements: [outerParagraph] }] });

                // The replaced paragraph is no longer in the document, and its text box was left alone
                expect(traverse({ elements: [textBoxRun] }).map((p) => p.text)).to.deep.equal(["{{ph}}"]);
            });
        });

        describe("paragraph type", () => {
            const context = {
                file: {} as unknown as File,
                viewWrapper: { Relationships: {} } as unknown as IViewWrapper,
                stack: [],
            };
            const createText = (text: string): Element => ({ type: "element", name: "w:t", elements: [{ type: "text", text }] });
            const createRun = (...elements: readonly Element[]): Element => ({ type: "element", name: "w:r", elements: [...elements] });
            const createParagraph = (...elements: readonly Element[]): Element => ({
                type: "element",
                name: "w:p",
                elements: [...elements],
            });
            const italic: Element = { type: "element", name: "w:rPr", elements: [{ type: "element", name: "w:i" }] };

            const replaceWith = (
                json: Element,
                children: readonly ParagraphChild[],
                options: { readonly keepOriginalStyles?: boolean; readonly recursive?: boolean } = {},
            ) => replacer({ json, patch: { type: PatchType.PARAGRAPH, children }, patchText: "{{ph}}", context, ...options });

            const textsOf = (json: Element): readonly string[] => traverse(json).map((p) => p.text);
            const namesOf = (elements: readonly Element[] | undefined): readonly (string | undefined)[] =>
                (elements ?? []).map((e) => e.name);

            it("should replace an occurrence in a paragraph and one inside it, such as in a text box", () => {
                const textBoxRun = createRun({
                    type: "element",
                    name: "w:txbxContent",
                    elements: [createParagraph(createRun(createText("{{ph}}")))],
                });
                const body: Element = {
                    type: "element",
                    name: "w:body",
                    elements: [createParagraph(createRun(createText("{{ph}}")), textBoxRun), createParagraph(createRun(createText("END")))],
                };

                replaceWith({ elements: [body] }, [new TextRun("X")]);

                expect(textsOf({ elements: [body] })).to.deep.equal(["X", "END", "X"]);
            });

            it("should replace every occurrence in a paragraph", () => {
                const paragraph = createParagraph(createRun(createText("{{ph}} and {{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")]);

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["X and X"]);
            });

            it("should only replace the first occurrence in a paragraph if recursive is false", () => {
                const paragraph = createParagraph(createRun(createText("{{ph}} and {{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")], { recursive: false });

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["X and {{ph}}"]);
            });

            it("should not replace the placeholder in the content it inserts", () => {
                const paragraph = createParagraph(createRun(createText("{{ph}} and {{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun("[{{ph}}]")]);

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["[{{ph}}] and [{{ph}}]"]);
            });

            it("should replace a placeholder in the second text of a run", () => {
                const paragraph = createParagraph(createRun(createText("Name:"), { type: "element", name: "w:tab" }, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")]);

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["Name:X"]);
            });

            it("should replace the placeholder where it is, when the start of it also comes earlier in the same text", () => {
                const paragraph = createParagraph(createRun(createText("{{p {{p")), createRun(createText("h}} c")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")]);

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["{{p X c"]);
            });

            it("should keep a ɵ that is in the document's own text", () => {
                const paragraph = createParagraph(createRun(createText("Latin ɵ letter ")), createRun(createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")]);

                expect(textsOf({ elements: [paragraph] })).to.deep.equal(["Latin ɵ letter X"]);
            });

            it("should keep the formatting of the text after the placeholder if keepOriginalStyles is false", () => {
                const paragraph = createParagraph(createRun(italic, createText("A {{ph}} B")));

                replaceWith({ elements: [paragraph] }, [new TextRun("X")], { keepOriginalStyles: false });

                expect(paragraph.elements!.map((run) => namesOf(run.elements))).to.deep.equal([
                    ["w:rPr", "w:t"],
                    ["w:t"],
                    ["w:rPr", "w:t"],
                ]);
            });

            it("should merge the original run properties into a run that has its own, keeping its own", () => {
                const originalProperties: Element = {
                    type: "element",
                    name: "w:rPr",
                    elements: [
                        { type: "element", name: "w:i" },
                        { type: "element", name: "w:color", attributes: { "w:val": "FF0000" } },
                    ],
                };
                const paragraph = createParagraph(createRun(originalProperties, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", bold: true, color: "00FF00" })]);

                const insertedRun = paragraph.elements![1];
                expect(namesOf(insertedRun.elements)).to.deep.equal(["w:rPr", "w:t"]);
                expect(insertedRun.elements![0].elements).toMatchObject([
                    { name: "w:b" },
                    { name: "w:bCs" },
                    { name: "w:i" },
                    { name: "w:color", attributes: { "w:val": "00FF00" } },
                ]);
            });

            it("should put the merged run properties in the schema's order, whichever run they come from", () => {
                const originalProperties: Element = {
                    type: "element",
                    name: "w:rPr",
                    elements: [
                        { type: "element", name: "w:sz", attributes: { "w:val": "56" } },
                        { type: "element", name: "w:szCs", attributes: { "w:val": "56" } },
                    ],
                };
                const paragraph = createParagraph(createRun(originalProperties, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", font: "Trebuchet MS", underline: {} })]);

                expect(namesOf(paragraph.elements![1].elements![0].elements)).to.deep.equal(["w:rFonts", "w:sz", "w:szCs", "w:u"]);
            });

            it("should put Word 2010's run properties after the others, and properties it doesn't know after those", () => {
                const originalProperties: Element = {
                    type: "element",
                    name: "w:rPr",
                    elements: [
                        { type: "element", name: "w14:ligatures", attributes: { "w14:val": "standard" } },
                        { type: "element", name: "w16:unknown" },
                        { type: "element", name: "w14:textOutline" },
                        { type: "element", name: "w:lang", attributes: { "w:val": "en-GB" } },
                    ],
                };
                const paragraph = createParagraph(createRun(originalProperties, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", bold: true })]);

                expect(namesOf(paragraph.elements![1].elements![0].elements)).to.deep.equal([
                    "w:b",
                    "w:bCs",
                    "w:lang",
                    "w14:textOutline",
                    "w14:ligatures",
                    "w16:unknown",
                ]);
            });

            it("should keep content without a name, such as an XML comment, after the run properties", () => {
                const originalProperties: Element = {
                    type: "element",
                    name: "w:rPr",
                    elements: [
                        { type: "comment", comment: "kept" },
                        { type: "element", name: "w:i" },
                    ],
                };
                const paragraph = createParagraph(createRun(originalProperties, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", bold: true })]);

                expect(paragraph.elements![1].elements![0].elements!.map((e) => e.name ?? e.type)).to.deep.equal([
                    "w:b",
                    "w:bCs",
                    "w:i",
                    "comment",
                ]);
            });

            it("should keep w:rPrChange after the other run properties when merging them", () => {
                const originalProperties: Element = {
                    type: "element",
                    name: "w:rPr",
                    elements: [
                        { type: "element", name: "w:i" },
                        { type: "element", name: "w:rPrChange", attributes: { "w:id": "1", "w:author": "Author" } },
                    ],
                };
                const paragraph = createParagraph(createRun(originalProperties, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", bold: true })]);

                expect(namesOf(paragraph.elements![1].elements![0].elements)).to.deep.equal(["w:b", "w:bCs", "w:i", "w:rPrChange"]);
            });

            it("should keep a run's own properties when the placeholder's w:rPr is empty", () => {
                const paragraph = createParagraph(createRun({ type: "element", name: "w:rPr" }, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new TextRun({ text: "X", bold: true })]);

                expect(namesOf(paragraph.elements![1].elements)).to.deep.equal(["w:rPr", "w:t"]);
                expect(namesOf(paragraph.elements![1].elements![0].elements)).to.deep.equal(["w:b", "w:bCs"]);
            });

            it("should only give the original run properties to inserted runs, not to content such as a hyperlink", () => {
                const paragraph = createParagraph(createRun(italic, createText("{{ph}}")));

                replaceWith({ elements: [paragraph] }, [new ConcreteHyperlink([new TextRun("link")], "rId1")]);

                expect(paragraph.elements!.map((e) => [e.name, namesOf(e.elements)])).to.deep.equal([
                    ["w:r", ["w:rPr", "w:t"]],
                    ["w:hyperlink", ["w:r"]],
                    ["w:r", ["w:rPr", "w:t"]],
                ]);
            });
        });
    });
});
