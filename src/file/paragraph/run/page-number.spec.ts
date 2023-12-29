import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CurrentSection, NumberOfPages, NumberOfPagesSection, Page } from "./page-number";

describe("Page", () => {
    describe("#constructor()", () => {
        it("should work", () => {
            const tree = new Formatter().format(new Page());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "PAGE"] });
        });
    });
});

describe("NumberOfPages", () => {
    describe("#constructor()", () => {
        it("should work", () => {
            const tree = new Formatter().format(new NumberOfPages());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "NUMPAGES"] });
        });
    });
});

describe("NumberOfPagesSection", () => {
    describe("#constructor()", () => {
        it("should work", () => {
            const tree = new Formatter().format(new NumberOfPagesSection());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "SECTIONPAGES"] });
        });
    });
});

describe("CurrentSection", () => {
    describe("#constructor()", () => {
        it("should work", () => {
            const tree = new Formatter().format(new CurrentSection());
            expect(tree).to.deep.equal({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "SECTION"] });
        });
    });
});
