import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { TextRun } from "../run";
import { ConcreteHyperlink, ExternalHyperlink, InternalHyperlink } from "./hyperlink";

describe("ConcreteHyperlink", () => {
    let hyperlink: ConcreteHyperlink;

    beforeEach(() => {
        hyperlink = new ConcreteHyperlink(
            [
                new TextRun({
                    text: "https://example.com",
                    style: "Hyperlink",
                }),
            ],
            "superid",
        );
    });

    describe("#constructor()", () => {
        it("should create a hyperlink with correct root key", () => {
            const tree = new Formatter().format(hyperlink);
            expect(tree).to.deep.equal({
                "w:hyperlink": [
                    {
                        _attr: {
                            "w:history": 1,
                            "r:id": "rIdsuperid",
                        },
                    },
                    {
                        "w:r": [
                            { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "Hyperlink" } } }] },
                            { "w:t": [{ _attr: { "xml:space": "preserve" } }, "https://example.com"] },
                        ],
                    },
                ],
            });
        });

        describe("with optional anchor parameter", () => {
            beforeEach(() => {
                hyperlink = new ConcreteHyperlink(
                    [
                        new TextRun({
                            text: "Anchor Text",
                            style: "Hyperlink",
                        }),
                    ],
                    "superid2",
                    "anchor",
                );
            });

            it("should create an internal link with anchor tag", () => {
                const tree = new Formatter().format(hyperlink);
                expect(tree).to.deep.equal({
                    "w:hyperlink": [
                        {
                            _attr: {
                                "w:history": 1,
                                "w:anchor": "anchor",
                            },
                        },
                        {
                            "w:r": [
                                { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "Hyperlink" } } }] },
                                { "w:t": [{ _attr: { "xml:space": "preserve" } }, "Anchor Text"] },
                            ],
                        },
                    ],
                });
            });
        });
    });
});

describe("ExternalHyperlink", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const externalHyperlink = new ExternalHyperlink({
                children: [new TextRun("test")],
                link: "http://www.google.com",
            });

            expect(externalHyperlink.options.link).to.equal("http://www.google.com");
        });
    });
});

describe("InternalHyperlink", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const internalHyperlink = new InternalHyperlink({
                children: [new TextRun("test")],
                anchor: "test-id",
            });

            const tree = new Formatter().format(internalHyperlink);

            expect(tree).to.deep.equal({
                "w:hyperlink": [
                    {
                        _attr: {
                            "w:anchor": "test-id",
                            "w:history": 1,
                        },
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
                                    "test",
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
