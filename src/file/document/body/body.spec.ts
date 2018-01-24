import { assert } from "chai";

import { Utility } from "../../../tests/utility";
import { Body } from "./";
import { Columns } from "./section-properties/columns/columns";
import { DocumentGrid } from "./section-properties/doc-grid/doc-grid";
import { PageMargin } from "./section-properties/page-margin/page-margin";
import { PageSize } from "./section-properties/page-size/page-size";
import { SectionProperties } from "./section-properties/section-properties";

describe("Body", () => {
    let body: Body;

    beforeEach(() => {
        body = new Body();
        body.push(new SectionProperties(0));
        body.push(new PageSize(0, 0));
        body.push(new PageMargin(0, 0, 0, 0, 0, 0, 0));
        body.push(new Columns(0));
        body.push(new DocumentGrid(0));
    });

    describe("#constructor()", () => {
        it("should create the Section Properties", () => {
            const newJson = Utility.jsonify(body);
            assert.equal(newJson.root[0].rootKey, "w:sectPr");
        });

        it("should create the Page Size", () => {
            const newJson = Utility.jsonify(body);
            assert.equal(newJson.root[1].rootKey, "w:pgSz");
        });

        it("should create the Page Margin", () => {
            const newJson = Utility.jsonify(body);
            assert.equal(newJson.root[2].rootKey, "w:pgMar");
        });

        it("should create the Columns", () => {
            const newJson = Utility.jsonify(body);
            assert.equal(newJson.root[3].rootKey, "w:cols");
        });

        it("should create the Document Grid", () => {
            const newJson = Utility.jsonify(body);
            assert.equal(newJson.root[4].rootKey, "w:docGrid");
        });
    });
});
