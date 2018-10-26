import { expect } from "chai";

import { Formatter } from "export/formatter";
import { FooterWrapper } from "file/footer-wrapper";
import { HeaderWrapper } from "file/header-wrapper";
import { Media } from "file/media";

import { PageBorderOffsetFrom } from "./page-border";
import { PageNumberFormat } from "./page-number";
import { SectionProperties } from "./section-properties";

describe("SectionProperties", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const media = new Media();

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
                mirror: false,
                space: 708,
                linePitch: 360,
                headers: {
                    default: new HeaderWrapper(media, 100),
                },
                footers: {
                    even: new FooterWrapper(media, 200),
                },
                pageNumberStart: 10,
                pageNumberFormatType: PageNumberFormat.CARDINAL_TEXT,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } }] });
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
                            "w:mirrorMargins": false,
                        },
                    },
                ],
            });

            expect(tree["w:sectPr"][2]).to.deep.equal({ "w:cols": [{ _attr: { "w:space": 708 } }] });
            expect(tree["w:sectPr"][3]).to.deep.equal({ "w:docGrid": [{ _attr: { "w:linePitch": 360 } }] });
            expect(tree["w:sectPr"][4]).to.deep.equal({ "w:headerReference": [{ _attr: { "r:id": "rId100", "w:type": "default" } }] });
            expect(tree["w:sectPr"][5]).to.deep.equal({ "w:footerReference": [{ _attr: { "r:id": "rId200", "w:type": "even" } }] });
            expect(tree["w:sectPr"][6]).to.deep.equal({ "w:pgNumType": [{ _attr: { "w:fmt": "cardinalText", "w:start": 10 } }] });
        });

        it("should create section properties with no options", () => {
            const properties = new SectionProperties();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } }] });
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
                            "w:mirrorMargins": false,
                        },
                    },
                ],
            });
            expect(tree["w:sectPr"][2]).to.deep.equal({ "w:cols": [{ _attr: { "w:space": 708 } }] });
            expect(tree["w:sectPr"][3]).to.deep.equal({ "w:docGrid": [{ _attr: { "w:linePitch": 360 } }] });
            expect(tree["w:sectPr"][4]).to.deep.equal({ "w:pgNumType": [{ _attr: { "w:fmt": "decimal" } }] });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                top: 0,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } }] });
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
                            "w:mirrorMargins": false,
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
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } }] });
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
                            "w:mirrorMargins": false,
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
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": [{ _attr: { "w:h": 0, "w:w": 0, "w:orient": "portrait" } }] });
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
                            "w:mirrorMargins": false,
                        },
                    },
                ],
            });
        });

        it("should create section properties with page borders", () => {
            const properties = new SectionProperties({
                pageBorders: {
                    offsetFrom: PageBorderOffsetFrom.PAGE,
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const pgBorders = tree["w:sectPr"].find((item) => item["w:pgBorders"] !== undefined);
            expect(pgBorders).to.deep.equal({
                "w:pgBorders": [{ _attr: { "w:offsetFrom": "page" } }],
            });
        });
    });
});
