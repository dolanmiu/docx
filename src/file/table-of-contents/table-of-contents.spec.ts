import { expect } from "chai";

import { Formatter } from "../../export/formatter";
import { TableOfContents } from "./";

const DEFAULT_TOC = {
    "w:p": [
        {
            "w:pPr": [],
        },
    ],
};

describe("Table of Contents", () => {
    describe("#constructor", () => {
        it("should construct a TOC with default options", () => {
            const toc = new TableOfContents();
            const tree = new Formatter().format(toc);
            expect(tree).to.be.deep.equal(DEFAULT_TOC);
        });
    });
});
