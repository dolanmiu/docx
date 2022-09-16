import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";

import { Footnote, FootnoteType } from "./footnote";

describe("Footnote", () => {
    describe("#constructor", () => {
        it("should create a footnote with a footnote type", () => {
            const footnote = new Footnote({
                id: 1,
                type: FootnoteType.SEPERATOR,
                children: [],
            });
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.deep.equal({ _attr: { "w:type": "separator", "w:id": 1 } });
        });

        it("should create a footnote without a footnote type", () => {
            const footnote = new Footnote({
                id: 1,
                children: [],
            });
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.deep.equal({ _attr: { "w:id": 1 } });
        });

        it("should append footnote ref run on the first footnote paragraph", () => {
            const footnote = new Footnote({
                id: 1,
                children: [new Paragraph({ children: [new TextRun("test-footnote")] })],
            });
            const tree = new Formatter().format(footnote);

            expect(tree).to.deep.equal({
                "w:footnote": [
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
                                                        "w:val": "FootnoteReference",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:footnoteRef": {},
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
                                            "test-footnote",
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
            const footnote = new Footnote({
                id: 1,
                children: [
                    new Paragraph({ children: [new TextRun("test-footnote")] }),
                    new Paragraph({ children: [new TextRun("test-footnote-2")] }),
                ],
            });
            const tree = new Formatter().format(footnote);

            expect(tree).to.deep.equal({
                "w:footnote": [
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
                                                        "w:val": "FootnoteReference",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        "w:footnoteRef": {},
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
                                            "test-footnote",
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
                                            "test-footnote-2",
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
