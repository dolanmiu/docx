import { describe, expect, it } from "vitest";

import type { XmlElement as Element } from "@util/xml";

import { renderParagraphNode } from "./run-renderer";

describe("run-renderer", () => {
    describe("renderParagraphNode", () => {
        it("should return a rendered paragraph node if theres no elements", () => {
            const output = renderParagraphNode({ element: { name: "w:p" }, index: 0, parent: undefined });
            expect(output).to.deep.equal({
                index: -1,
                pathToParagraph: [],
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
                pathToParagraph: [0],
                runs: [
                    {
                        end: 4,
                        path: [0],
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
                pathToParagraph: [0],
                runs: [
                    {
                        end: 0,
                        path: [0],
                        parts: [],
                        start: 0,
                        text: "",
                    },
                ],
                text: "",
            });
        });

        it("should handle w:t elements with undefined text", () => {
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
                                            // text is undefined
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
                pathToParagraph: [0],
                runs: [
                    {
                        end: -1,
                        path: [0],
                        parts: [
                            {
                                end: -1,
                                index: 0,
                                start: 0,
                                text: "",
                            },
                        ],
                        start: 0,
                        text: "",
                    },
                ],
                text: "",
            });
        });

        it("should start each text in a run straight after the one before it", () => {
            const output = renderParagraphNode({
                element: {
                    name: "w:p",
                    elements: [
                        {
                            name: "w:r",
                            elements: [
                                { name: "w:t", elements: [{ type: "text", text: "Name:" }] },
                                { name: "w:tab" },
                                { name: "w:t", elements: [{ type: "text", text: "{{ph}}" }] },
                            ],
                        },
                    ],
                },
                index: 0,
                parent: undefined,
            });

            expect(output.runs).to.deep.equal([
                {
                    text: "Name:{{ph}}",
                    parts: [
                        { text: "Name:", index: 0, start: 0, end: 4 },
                        { text: "{{ph}}", index: 2, start: 5, end: 10 },
                    ],
                    path: [0],
                    start: 0,
                    end: 10,
                },
            ]);
        });

        describe("runs in other elements of the paragraph", () => {
            const run = (text: string): Element => ({ name: "w:r", elements: [{ name: "w:t", elements: [{ type: "text", text }] }] });
            const element = (name: string, ...elements: readonly Element[]): Element => ({ name, elements: [...elements] });
            const render = (...elements: readonly Element[]) =>
                renderParagraphNode({ element: element("w:p", ...elements), index: 0, parent: undefined });

            it("should read the runs in a link, a content control, a tracked insertion or move, a smart tag, custom XML, a field and text in a direction, in order", () => {
                const output = render(
                    run("A"),
                    element("w:hyperlink", run("B")),
                    element("w:sdt", element("w:sdtPr", element("w:rPr")), element("w:sdtContent", run("C"))),
                    element("w:ins", run("D")),
                    element("w:moveTo", run("E")),
                    element("w:smartTag", element("w:smartTagPr"), run("F")),
                    element("w:customXml", run("G")),
                    element("w:fldSimple", run("H")),
                    element("w:dir", element("w:bdo", run("I"))),
                );

                expect(output.text).to.equal("ABCDEFGHI");
                expect(output.runs.map(({ path, start }) => ({ path, start }))).to.deep.equal([
                    { path: [0], start: 0 },
                    { path: [1, 0], start: 1 },
                    { path: [2, 1, 0], start: 2 },
                    { path: [3, 0], start: 3 },
                    { path: [4, 0], start: 4 },
                    { path: [5, 1], start: 5 },
                    { path: [6, 0], start: 6 },
                    { path: [7, 0], start: 7 },
                    { path: [8, 0, 0], start: 8 },
                ]);
            });

            it("should leave out deleted and moved-away text, as it isn't the paragraph's", () => {
                const output = render(run("A"), element("w:del", run("B")), element("w:moveFrom", run("C")), run("D"));

                expect(output.text).to.equal("AD");
                expect(output.runs.map(({ path }) => path)).to.deep.equal([[0], [3]]);
            });
        });
    });
});
