import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";

import { Endnote, EndnoteType } from "./endnote";

describe("Endnote", () => {
    describe("#constructor", () => {
        it("should create an endnote with an endnote type", () => {
            const endnote = new Endnote({
                id: 1,
                type: EndnoteType.SEPARATOR,
                children: [],
            });
            const tree = new Formatter().format(endnote);

            expect(Object.keys(tree)).to.deep.equal(["w:endnote"]);
            expect(tree["w:endnote"]).to.deep.equal({ _attr: { "w:type": "separator", "w:id": 1 } });
        });

        it("should create a endnote without a endnote type", () => {
            const endnote = new Endnote({
                id: 1,
                children: [],
            });
            const tree = new Formatter().format(endnote);

            expect(Object.keys(tree)).to.deep.equal(["w:endnote"]);
            expect(tree["w:endnote"]).to.deep.equal({ _attr: { "w:id": 1 } });
        });

        it("should append endnote ref run on the first endnote paragraph", () => {
            const endnote = new Endnote({
                id: 1,
                children: [new Paragraph({ children: [new TextRun("test-endnote")] })],
            });
            const tree = new Formatter().format(endnote);

            expect(tree).to.deep.equal({
                "w:endnote": [
                    {
                        _attr: {
                            "w:id": 1,
                        },
                    },
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:rPr": [
                                            {
                                                "w:rStyle": {
                                                    _attr: {
                                                        "w:val": "EndnoteReference",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:endnoteRef": {},
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test-endnote",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should add multiple paragraphs", () => {
            const endnote = new Endnote({
                id: 1,
                children: [
                    new Paragraph({ children: [new TextRun("test-endnote")] }),
                    new Paragraph({ children: [new TextRun("test-endnote-2")] }),
                ],
            });
            const tree = new Formatter().format(endnote);

            expect(tree).to.deep.equal({
                "w:endnote": [
                    {
                        _attr: {
                            "w:id": 1,
                        },
                    },
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:rPr": [
                                            {
                                                "w:rStyle": {
                                                    _attr: {
                                                        "w:val": "EndnoteReference",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:endnoteRef": {},
                                    },
                                ],
                            },
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test-endnote",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "test-endnote-2",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
