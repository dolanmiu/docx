import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Hyperlink } from "./";

describe("Hyperlink", () => {
    let hyperlink: Hyperlink;

    beforeEach(() => {
        hyperlink = new Hyperlink("https://example.com", 0);
    });

    describe("#constructor()", () => {
        it("should create a hyperlink with correct root key", () => {
            const tree = new Formatter().format(hyperlink);
            expect(tree).to.deep.equal({
                "w:hyperlink": [
                    {
                        _attr: {
                            "w:history": 1,
                            "r:id": "rId1",
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
                hyperlink = new Hyperlink("Anchor Text", 0, "anchor");
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
