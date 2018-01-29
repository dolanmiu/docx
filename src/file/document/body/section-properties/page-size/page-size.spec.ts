import { expect } from "chai";

import { Formatter } from "../../../../../export/formatter";
import { PageSize } from "./page-size";

describe("PageSize", () => {
    describe("#constructor()", () => {
        it("should create page size with portrait", () => {
            const properties = new PageSize(100, 200, "portrait");
            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:pgSz"]);
            expect(tree["w:pgSz"]).to.be.an.instanceof(Array);
            expect(tree["w:pgSz"][0]).to.deep.equal({ _attr: { "w:h": 200, "w:w": 100, "w:orient": "portrait" } });
        });

        it("should create page size with horizontal and invert the lengths", () => {
            const properties = new PageSize(100, 200, "landscape");
            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:pgSz"]);
            expect(tree["w:pgSz"]).to.be.an.instanceof(Array);
            expect(tree["w:pgSz"][0]).to.deep.equal({ _attr: { "w:h": 100, "w:w": 200, "w:orient": "landscape" } });
        });
    });
});
