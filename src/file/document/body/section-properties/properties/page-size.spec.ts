import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { PageOrientation, createPageSize } from "./page-size";

describe("PageSize", () => {
    describe("#constructor()", () => {
        it("should create page size with portrait", () => {
            const properties = createPageSize({ width: 100, height: 200, orientation: PageOrientation.PORTRAIT });
            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:pgSz"]);
            expect(tree["w:pgSz"]).to.deep.equal({ _attr: { "w:h": 200, "w:w": 100, "w:orient": "portrait" } });
        });

        it("should create page size with horizontal and invert the lengths", () => {
            const properties = createPageSize({ width: 100, height: 200, orientation: PageOrientation.LANDSCAPE });
            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:pgSz"]);
            expect(tree["w:pgSz"]).to.deep.equal({ _attr: { "w:h": 100, "w:w": 200, "w:orient": "landscape" } });
        });
    });
});
