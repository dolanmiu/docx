import { expect } from "chai";

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
                    ],
                    name: "w:r",
                    type: "element",
                },
            });
        });
    });
});
