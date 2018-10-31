import { expect } from "chai";

import { Formatter } from "export/formatter";

import { TitlePage } from "./title-page";

describe("PageSize", () => {
    describe("#constructor()", () => {
        it("should create title page property for different first page header", () => {
            const properties = new TitlePage();
            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:titlePg"]);
            expect(tree["w:titlePg"]).to.be.an.instanceof(Array);
            expect(tree["w:titlePg"][0]).to.deep.equal({ _attr: { "w:val": "1" } });
        });
    });
});
