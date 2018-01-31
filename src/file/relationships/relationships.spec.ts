// tslint:disable:no-string-literal
import { expect } from "chai";

import { Formatter } from "../../export/formatter";
import { Relationships } from "./relationships";

describe("Relationships", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const properties = new Relationships();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["Relationships"]);
            expect(tree["Relationships"]).to.be.an.instanceof(Array);
            expect(tree["Relationships"][0]).to.deep.equal({
                _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" },
            });
            expect(tree["Relationships"][1]).to.deep.equal({
                Relationship: [
                    {
                        _attr: {
                            Id: "rId1",
                            Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
                            Target: "styles.xml",
                        },
                    },
                ],
            });
        });
    });
});
