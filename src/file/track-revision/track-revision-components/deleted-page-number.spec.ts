import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { DeletedNumberOfPages, DeletedNumberOfPagesSection, DeletedPage } from "./deleted-page-number";

describe("Deleted Page", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new DeletedPage());
            expect(tree).to.deep.equal({ "w:delInstrText": [{ _attr: { "xml:space": "preserve" } }, "PAGE"] });
        });
    });
});

describe("Deleted NumberOfPages", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new DeletedNumberOfPages());
            expect(tree).to.deep.equal({ "w:delInstrText": [{ _attr: { "xml:space": "preserve" } }, "NUMPAGES"] });
        });
    });
});

describe("Deleted NumberOfPagesSection", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new DeletedNumberOfPagesSection());
            expect(tree).to.deep.equal({ "w:delInstrText": [{ _attr: { "xml:space": "preserve" } }, "SECTIONPAGES"] });
        });
    });
});
