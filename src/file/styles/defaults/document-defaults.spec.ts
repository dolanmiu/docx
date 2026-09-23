import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { DocumentWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";

import { DocumentDefaults } from "./document-defaults";

describe("DocumentDefaults", () => {
    it("#constructor", () => {
        const defaults = new DocumentDefaults({
            paragraph: { spacing: { line: 240 } },
            run: { color: "808080" },
        });
        const tree = new Formatter().format(defaults);
        expect(tree).to.deep.equal({
            "w:docDefaults": [
                {
                    "w:rPrDefault": [
                        {
                            "w:rPr": [
                                {
                                    "w:color": { _attr: { "w:val": "808080" } },
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:pPrDefault": [
                        {
                            "w:pPr": [
                                {
                                    "w:spacing": {
                                        _attr: {
                                            "w:line": 240,
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("should not add the ListParagraph style when the paragraph defaults define numbering", () => {
        const defaults = new DocumentDefaults({
            paragraph: { numbering: { reference: "test-reference", level: 0 } },
            run: { color: "808080" },
        });
        const tree = new Formatter().format(defaults, {
            file: {
                Numbering: {
                    createConcreteNumberingInstance: (_: string, __: number) => undefined,
                },
            } as File,
            viewWrapper: new DocumentWrapper({ background: {} }),
            stack: [],
        });
        expect(tree).to.deep.equal({
            "w:docDefaults": [
                {
                    "w:rPrDefault": [
                        {
                            "w:rPr": [
                                {
                                    "w:color": { _attr: { "w:val": "808080" } },
                                },
                            ],
                        },
                    ],
                },
                {
                    "w:pPrDefault": [
                        {
                            "w:pPr": [
                                {
                                    "w:numPr": [
                                        { "w:ilvl": { _attr: { "w:val": 0 } } },
                                        { "w:numId": { _attr: { "w:val": "{test-reference-0}" } } },
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
