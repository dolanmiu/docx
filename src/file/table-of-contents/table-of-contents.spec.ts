import { expect } from "chai";

import { Formatter } from "../../export/formatter";
import { TableOfContents } from "./";

const DEFAULT_TOC = {
    "w:p": [
        {
            "w:pPr": [],
        },
        {
            "w:fldChar": [
                {
                    _attr: {
                        "w:fldCharType": "begin",
                    },
                },
            ],
        },
        {
            "w:fldChar": [
                {
                    _attr: {
                        "w:fldCharType": "separate",
                    },
                },
            ],
        },
        {
            "w:instrText": [
                {
                    _attr: {
                        "xml:space": "preserve",
                    },
                },
                "TOC",
            ],
        },
        {
            "w:fldChar": [
                {
                    _attr: {
                        "w:fldCharType": "end",
                    },
                },
            ],
        },
    ],
};

describe("Table of Contents", () => {
    describe("#constructor", () => {
        it("should construct a TOC with default options", () => {
            const toc = new TableOfContents();
            const tree = new Formatter().format(toc);
            // console.log(JSON.stringify(tree, null, 2));
            expect(tree).to.be.deep.equal(DEFAULT_TOC);
        });
    });
});
