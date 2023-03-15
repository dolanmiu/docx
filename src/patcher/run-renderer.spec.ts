import { expect } from "chai";
import { renderParagraphNode } from "./run-renderer";

describe("run-renderer", () => {
    describe("renderParagraphNode", () => {
        it("should return a rendered paragraph node if theres no elements", () => {
            const output = renderParagraphNode({ element: { name: "w:p" }, index: 0, parent: undefined });
            expect(output).to.deep.equal({
                index: -1,
                path: [],
                runs: [],
                text: "",
            });
        });

        it("should return a rendered paragraph node if there are elements", () => {
            const output = renderParagraphNode({
                element: {
                    name: "w:p",
                    elements: [
                        {
                            name: "w:r",
                            elements: [
                                {
                                    name: "w:t",
                                    elements: [
                                        {
                                            type: "text",
                                            text: "hello",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                index: 0,
                parent: undefined,
            });
            expect(output).to.deep.equal({
                index: 0,
                path: [0],
                runs: [
                    {
                        end: 4,
                        index: 0,
                        parts: [
                            {
                                end: 4,
                                index: 0,
                                start: 0,
                                text: "hello",
                            },
                        ],
                        start: 0,
                        text: "hello",
                    },
                ],
                text: "hello",
            });
        });

        it("should throw an error if the element is not a paragraph", () => {
            expect(() => renderParagraphNode({ element: { name: "w:r" }, index: 0, parent: undefined })).to.throw();
        });

        it("should return blank defaults if run is empty", () => {
            const output = renderParagraphNode({
                element: {
                    name: "w:p",
                    elements: [
                        {
                            name: "w:r",
                        },
                    ],
                },
                index: 0,
                parent: undefined,
            });
            expect(output).to.deep.equal({
                index: 0,
                path: [0],
                runs: [
                    {
                        end: 0,
                        index: -1,
                        parts: [],
                        start: 0,
                        text: "",
                    },
                ],
                text: "",
            });
        });
    });
});
