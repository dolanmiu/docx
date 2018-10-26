import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Body } from "./body";

describe("Body", () => {
    let body: Body;

    beforeEach(() => {
        body = new Body();
    });

    describe("#constructor()", () => {
        it("should create default section", () => {
            const formatted = new Formatter().format(body)["w:body"][0];
            expect(formatted)
                .to.have.property("w:sectPr")
                .and.to.be.an.instanceof(Array);
            expect(formatted["w:sectPr"]).to.have.length(5);
        });
    });

    describe("addSection", () => {
        it("should add section with options", () => {
            body.addSection({
                width: 10000,
                height: 10000,
            });

            const formatted = new Formatter().format(body)["w:body"];
            expect(formatted).to.be.an.instanceof(Array);
            const defaultSectionPr = formatted[0]["w:p"][1]["w:pPr"][0]["w:sectPr"];

            // check that this is the default section and added first in paragraph
            expect(defaultSectionPr[0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } }] });

            // check for new section (since it's the last one, it's direct child of body)
            const newSection = formatted[1]["w:sectPr"];
            expect(newSection[0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 10000, "w:w": 10000, "w:orient": "portrait" } }] });
        });
    });
});
