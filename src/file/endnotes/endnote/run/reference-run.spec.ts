import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { EndnoteIdReference, EndnoteReferenceRun } from "./reference-run";

describe("EndnoteReference", () => {
    describe("#constructor()", () => {
        it("should create an EndnoteReference with correct root key and id", () => {
            const tree = new Formatter().format(new EndnoteIdReference(1));
            expect(tree).to.deep.equal({
                "w:endnoteReference": {
                    _attr: {
                        "w:id": 1,
                    },
                },
            });
        });
    });
});

describe("EndnoteReferenceRun", () => {
    describe("#constructor()", () => {
        it("should create an EndnoteReferenceRun with correct style and reference", () => {
            const run = new EndnoteReferenceRun(1);
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
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
                        "w:endnoteReference": {
                            _attr: {
                                "w:id": 1,
                            },
                        },
                    },
                ],
            });
        });
    });
});
