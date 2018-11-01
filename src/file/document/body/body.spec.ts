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

    describe("#addSection", () => {
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

        it("should add section with default parameters", () => {
            body.addSection({
                width: 10000,
                height: 10000,
            });

            const tree = new Formatter().format(body);

            expect(tree).to.deep.equal({
                "w:body": [
                    {
                        "w:p": [
                            { "w:pPr": [] },
                            {
                                "w:pPr": [
                                    {
                                        "w:sectPr": [
                                            { "w:pgSz": [{ _attr: { "w:w": 11906, "w:h": 16838, "w:orient": "portrait" } }] },
                                            {
                                                "w:pgMar": [
                                                    {
                                                        _attr: {
                                                            "w:top": 1440,
                                                            "w:right": 1440,
                                                            "w:bottom": 1440,
                                                            "w:left": 1440,
                                                            "w:header": 708,
                                                            "w:footer": 708,
                                                            "w:gutter": 0,
                                                            "w:mirrorMargins": false,
                                                        },
                                                    },
                                                ],
                                            },
                                            { "w:cols": [{ _attr: { "w:space": 708 } }] },
                                            { "w:docGrid": [{ _attr: { "w:linePitch": 360 } }] },
                                            { "w:pgNumType": [{ _attr: { "w:fmt": "decimal" } }] },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:sectPr": [
                            { "w:pgSz": [{ _attr: { "w:w": 10000, "w:h": 10000, "w:orient": "portrait" } }] },
                            {
                                "w:pgMar": [
                                    {
                                        _attr: {
                                            "w:top": 1440,
                                            "w:right": 1440,
                                            "w:bottom": 1440,
                                            "w:left": 1440,
                                            "w:header": 708,
                                            "w:footer": 708,
                                            "w:gutter": 0,
                                            "w:mirrorMargins": false,
                                        },
                                    },
                                ],
                            },
                            { "w:cols": [{ _attr: { "w:space": 708 } }] },
                            { "w:docGrid": [{ _attr: { "w:linePitch": 360 } }] },
                            { "w:pgNumType": [{ _attr: { "w:fmt": "decimal" } }] },
                        ],
                    },
                ],
            });
        });
    });

    describe("#getParagraphs", () => {
        it("should get no paragraphs", () => {
            const paragraphs = body.getParagraphs();

            expect(paragraphs).to.be.an.instanceof(Array);
        });
    });

    describe("#DefaultSection", () => {
        it("should get section", () => {
            const section = body.DefaultSection;

            const tree = new Formatter().format(section);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
        });
    });
});
