import { expect } from "chai";

import { Formatter } from "export/formatter";

import { UpdateFields } from "./update-fields";

const UF_TRUE = {
    "w:updateFields": [
        {
            _attr: {
                "w:val": true,
            },
        },
    ],
};
const UF_FALSE = {
    "w:updateFields": [
        {
            _attr: {
                "w:val": false,
            },
        },
    ],
};
describe("Update Fields", () => {
    describe("#constructor", () => {
        it("should construct a Update Fields with TRUE value by default", () => {
            const uf = new UpdateFields();
            const tree = new Formatter().format(uf);
            expect(tree).to.be.deep.equal(UF_TRUE);
        });
        it("should construct a Update Fields with TRUE value", () => {
            const uf = new UpdateFields(true);
            const tree = new Formatter().format(uf);
            expect(tree).to.be.deep.equal(UF_TRUE);
        });
        it("should construct a Update Fields with FALSE value", () => {
            const uf = new UpdateFields(false);
            const tree = new Formatter().format(uf);
            expect(tree).to.be.deep.equal(UF_FALSE);
        });
    });
});
