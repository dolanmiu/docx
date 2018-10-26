import { assert } from "chai";

import { Utility } from "tests/utility";

import { PageBreak, PageBreakBefore } from "./page-break";

describe("PageBreak", () => {
    let pageBreak: PageBreak;

    beforeEach(() => {
        pageBreak = new PageBreak();
    });

    describe("#constructor()", () => {
        it("should create a Page Break with correct attributes", () => {
            const newJson = Utility.jsonify(pageBreak);
            const attributes = {
                type: "page",
            };
            assert.equal(JSON.stringify(newJson.root[1].root[0].root), JSON.stringify(attributes));
        });

        it("should create a Page Break with w:r", () => {
            const newJson = Utility.jsonify(pageBreak);
            assert.equal(newJson.rootKey, "w:r");
        });

        it("should create a Page Break with a Break inside", () => {
            const newJson = Utility.jsonify(pageBreak);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });
});

describe("PageBreakBefore", () => {
    it("should create page break before", () => {
        const pageBreakBefore = new PageBreakBefore();
        const newJson = Utility.jsonify(pageBreakBefore);
        assert.equal(newJson.rootKey, "w:pageBreakBefore");
    });
});
