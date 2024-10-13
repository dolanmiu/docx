import { describe, expect, it } from "vitest";

import { findRunElementIndexWithToken, splitRunElement } from "./paragraph-split-inject";

describe("paragraph-split-inject", () => {
    describe("findRunElementIndexWithToken", () => {
        it("should find the index of a run element with a token", () => {
            const output = findRunElementIndexWithToken(
                {
                    name: "w:p",
                    type: "element",
                    elements: [
                        {
                            name: "w:r",
                            type: "element",
                            elements: [
                                {
                                    name: "w:t",
                                    type: "element",
                                    elements: [
                                        {
                                            type: "text",
                                            text: "hello world",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                "hello",
            );
            expect(output).to.deep.equal(0);
        });

        it("should throw an exception when ran with empty elements", () => {
            expect(() =>
                findRunElementIndexWithToken(
                    {
                        name: "w:p",
                        type: "element",
                    },
                    "hello",
                ),
            ).to.throw();
        });

        it("should throw an exception when ran with empty elements", () => {
            expect(() =>
                findRunElementIndexWithToken(
                    {
                        name: "w:p",
                        type: "element",
                        elements: [
                            {
                                name: "w:r",
                                type: "element",
                            },
                        ],
                    },
                    "hello",
                ),
            ).to.throw();
        });

        it("should throw an exception when ran with empty elements", () => {
            expect(() =>
                findRunElementIndexWithToken(
                    {
                        name: "w:p",
                        type: "element",
                        elements: [
                            {
                                name: "w:r",
                                type: "element",
                                elements: [
                                    {
                                        name: "w:t",
                                        type: "element",
                                    },
                                ],
                            },
                        ],
                    },
                    "hello",
                ),
            ).to.throw();
        });

        it("should continue if text run doesn't have text", () => {
            expect(() =>
                findRunElementIndexWithToken(
                    {
                        name: "w:p",
                        type: "element",
                        elements: [
                            {
                                name: "w:r",
                                type: "element",
                                elements: [
                                    {
                                        name: "w:t",
                                        type: "element",
                                    },
                                ],
                            },
                        ],
                    },
                    "hello",
                ),
            ).to.throw();
        });

        it("should continue if text run doesn't have text", () => {
            expect(() =>
                findRunElementIndexWithToken(
                    {
                        name: "w:p",
                        type: "element",
                        elements: [
                            {
                                name: "w:r",
                                type: "element",
                                elements: [
                                    {
                                        name: "w:t",
                                        type: "element",
                                        elements: [
                                            {
                                                type: "text",
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    "hello",
                ),
            ).to.throw();
        });
    });

    describe("splitRunElement", () => {
        it("should split a run element", () => {
            const output = splitRunElement(
                {
                    name: "w:r",
                    type: "element",
                    elements: [
                        {
                            name: "w:t",
                            type: "element",
                            elements: [
                                {
                                    type: "text",
                                    text: "hello*world",
                                },
                            ],
                        },
                        {
                            name: "w:x",
                            type: "element",
                        },
                    ],
                },
                "*",
            );

            expect(output).to.deep.equal({
                left: {
                    elements: [
                        {
                            attributes: {
                                "xml:space": "preserve",
                            },
                            elements: [
                                {
                                    text: "hello",
                                    type: "text",
                                },
                            ],
                            name: "w:t",
                            type: "element",
                        },
                    ],
                    name: "w:r",
                    type: "element",
                },
                right: {
                    elements: [
                        {
                            attributes: {
                                "xml:space": "preserve",
                            },
                            elements: [
                                {
                                    text: "world",
                                    type: "text",
                                },
                            ],
                            name: "w:t",
                            type: "element",
                        },
                        {
                            name: "w:x",
                            type: "element",
                        },
                    ],
                    name: "w:r",
                    type: "element",
                },
            });
        });

        it("should try to split even if elements is empty for text", () => {
            const output = splitRunElement(
                {
                    name: "w:r",
                    type: "element",
                    elements: [
                        {
                            name: "w:t",
                            type: "element",
                        },
                    ],
                },
                "*",
            );

            expect(output).to.deep.equal({
                left: {
                    elements: [
                        {
                            attributes: {
                                "xml:space": "preserve",
                            },
                            elements: [],
                            name: "w:t",
                            type: "element",
                        },
                    ],
                    name: "w:r",
                    type: "element",
                },
                right: {
                    elements: [],
                    name: "w:r",
                    type: "element",
                },
            });
        });

        it("should return empty elements", () => {
            const output = splitRunElement(
                {
                    name: "w:r",
                    type: "element",
                },
                "*",
            );

            expect(output).to.deep.equal({
                left: {
                    elements: [],
                    name: "w:r",
                    type: "element",
                },
                right: {
                    elements: [],
                    name: "w:r",
                    type: "element",
                },
            });
        });

        it("should create an empty end element if it is at the end", () => {
            const output = splitRunElement(
                {
                    type: "element",
                    name: "w:r",
                    elements: [
                        {
                            type: "element",
                            name: "w:rPr",
                            elements: [
                                { type: "element", name: "w:rFonts", attributes: { "w:eastAsia": "Times New Roman" } },
                                { type: "element", name: "w:kern", attributes: { "w:val": "0" } },
                                { type: "element", name: "w:sz", attributes: { "w:val": "20" } },
                                {
                                    type: "element",
                                    name: "w:lang",
                                    attributes: { "w:val": "en-US", "w:eastAsia": "en-US", "w:bidi": "ar-SA" },
                                },
                            ],
                        },
                        { type: "element", name: "w:t", elements: [], attributes: { "xml:space": "preserve" } },
                        { type: "element", name: "w:br" },
                        { type: "element", name: "w:t", elements: [{ type: "text", text: "ɵ" }] },
                    ],
                },
                "ɵ",
            );

            expect(output).to.deep.equal({
                left: {
                    type: "element",
                    name: "w:r",
                    elements: [
                        {
                            type: "element",
                            name: "w:rPr",
                            elements: [
                                { type: "element", name: "w:rFonts", attributes: { "w:eastAsia": "Times New Roman" } },
                                { type: "element", name: "w:kern", attributes: { "w:val": "0" } },
                                { type: "element", name: "w:sz", attributes: { "w:val": "20" } },
                                {
                                    type: "element",
                                    name: "w:lang",
                                    attributes: { "w:val": "en-US", "w:eastAsia": "en-US", "w:bidi": "ar-SA" },
                                },
                            ],
                        },
                        { type: "element", name: "w:t", elements: [], attributes: { "xml:space": "preserve" } },
                        { type: "element", name: "w:br" },
                        { type: "element", name: "w:t", elements: [], attributes: { "xml:space": "preserve" } },
                    ],
                },
                right: {
                    type: "element",
                    name: "w:r",
                    elements: [{ type: "element", name: "w:t", elements: [], attributes: { "xml:space": "preserve" } }],
                },
            });
        });
    });
});
