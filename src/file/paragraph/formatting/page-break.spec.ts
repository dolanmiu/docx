import { expect } from "chai";

import { Formatter } from "export/formatter";

import { PageBreak, PageBreakBefore } from "./page-break";

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

describe("PageBreakBefore", () => {
    it("should create page break before", () => {
        const pageBreakBefore = new PageBreakBefore();
        const tree = new Formatter().format(pageBreakBefore);
        expect(tree).to.deep.equal({
            "w:pageBreakBefore": {},
        });
    });
});
