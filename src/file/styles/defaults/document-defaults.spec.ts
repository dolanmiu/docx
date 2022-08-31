import { expect } from "chai";

import { Formatter } from "@export/formatter";

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
});
