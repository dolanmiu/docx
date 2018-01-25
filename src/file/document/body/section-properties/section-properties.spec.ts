import { expect } from "chai";

import { Formatter } from "../../../../export/formatter";
import { SectionProperties } from "./section-properties";

describe("SectionProperties", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const properties = new SectionProperties({
                width: 11906,
                height: 16838,
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
                header: 708,
                footer: 708,
                gutter: 0,
                space: 708,
                linePitch: 360,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906 } }] });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": [
                    {
                        _attr: {
                            "w:bottom": 1440,
                            "w:footer": 708,
                            "w:top": 1440,
                            "w:right": 1440,
                            "w:left": 1440,
                            "w:header": 708,
                            "w:gutter": 0,
                        },
                    },
                ],
            });
        });

        it("should create section properties with no options", () => {
            const properties = new SectionProperties();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906 } }] });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": [
                    {
                        _attr: {
                            "w:bottom": 1440,
                            "w:footer": 708,
                            "w:top": 1440,
                            "w:right": 1440,
                            "w:left": 1440,
                            "w:header": 708,
                            "w:gutter": 0,
                        },
                    },
                ],
            });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                top: 0,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906 } }] });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": [
                    {
                        _attr: {
                            "w:bottom": 1440,
                            "w:footer": 708,
                            "w:top": 0,
                            "w:right": 1440,
                            "w:left": 1440,
                            "w:header": 708,
                            "w:gutter": 0,
                        },
                    },
                ],
            });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                bottom: 0,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906 } }] });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": [
                    {
                        _attr: {
                            "w:bottom": 0,
                            "w:footer": 708,
                            "w:top": 1440,
                            "w:right": 1440,
                            "w:left": 1440,
                            "w:header": 708,
                            "w:gutter": 0,
                        },
                    },
                ],
            });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                width: 0,
                height: 0,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 0, "w:w": 0 } }] });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": [
                    {
                        _attr: {
                            "w:bottom": 1440,
                            "w:footer": 708,
                            "w:top": 1440,
                            "w:right": 1440,
                            "w:left": 1440,
                            "w:header": 708,
                            "w:gutter": 0,
                        },
                    },
                ],
            });
        });
    });
});
