import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { ColumnBreak, PageBreak, PageBreakBefore } from "./break";

describe("PageBreak", () => {
    let pageBreak: PageBreak;

    beforeEach(() => {
        pageBreak = new PageBreak();
    });

    describe("#constructor()", () => {
        it("should create a Page Break with correct attributes", () => {
            const tree = new Formatter().format(pageBreak);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:br": {
                            _attr: {
                                "w:type": "page",
                            },
                        },
                    },
                ],
            });
        });
    });
});

describe("ColumnBreak", () => {
    let columnBreak: ColumnBreak;

    beforeEach(() => {
        columnBreak = new ColumnBreak();
    });

    describe("#constructor()", () => {
        it("should create a Column Break with correct attributes", () => {
            const tree = new Formatter().format(columnBreak);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:br": {
                            _attr: {
                                "w:type": "column",
                            },
                        },
                    },
                ],
            });
        });
    });
});

describe("PageBreakBefore", () => {
    it("should create page break before", () => {
        const pageBreakBefore = new PageBreakBefore();
        const tree = new Formatter().format(pageBreakBefore);
        expect(tree).to.deep.equal({
            "w:pageBreakBefore": {},
        });
    });
});
