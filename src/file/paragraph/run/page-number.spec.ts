import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { NumberOfPages, NumberOfPagesSection, Page } from "./page-number";

describe("Page", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new Page());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "PAGE"] });
        });
    });
});

describe("NumberOfPages", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new NumberOfPages());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "NUMPAGES"] });
        });
    });
});

describe("NumberOfPagesSection", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new NumberOfPagesSection());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "SECTIONPAGES"] });
        });
    });
});
