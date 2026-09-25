import { describe, expect, it, vi } from "vitest";
import type { Element } from "xml-js";

import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { Paragraph, TextRun } from "@file/paragraph";

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
        });
    });
});
