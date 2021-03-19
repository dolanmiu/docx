import { expect } from "chai";

import { convertInchesToTwip } from "convenience-functions";
import { Formatter } from "export/formatter";
import { FooterWrapper } from "file/footer-wrapper";
import { HeaderWrapper } from "file/header-wrapper";
import { Media } from "file/media";
import { LineNumberRestartFormat } from "./line-number";

import { PageBorderOffsetFrom } from "./page-border";
import { PageNumberFormat } from "./page-number";
import { SectionProperties } from "./section-properties";
import { SectionType } from "./type/section-type-attributes";
import { SectionVerticalAlignValue } from "./vertical-align";

describe("SectionProperties", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const media = new Media();

            const properties = new SectionProperties({
                page: {
                    size: {
                        width: 11906,
                        height: 16838,
                    },
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1),
                        header: 708,
                        footer: 708,
                        gutter: 0,
                        mirror: false,
                    },
                    pageNumbers: {
                        start: 10,
                        formatType: PageNumberFormat.CARDINAL_TEXT,
                    },
                },
                column: {
                    space: 708,
                    count: 1,
                    separate: true,
                },
                grid: {
                    linePitch: convertInchesToTwip(0.25),
                },
                headerWrapperGroup: {
                    default: new HeaderWrapper(media, 100),
                },
                footerWrapperGroup: {
                    even: new FooterWrapper(media, 200),
                },
                titlePage: true,
                verticalAlign: SectionVerticalAlignValue.TOP,
            });

            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
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
            });

            expect(tree["w:sectPr"][2]).to.deep.equal({ "w:cols": { _attr: { "w:space": 708, "w:sep": true, "w:num": 1 } } });
            expect(tree["w:sectPr"][3]).to.deep.equal({ "w:docGrid": { _attr: { "w:linePitch": 360 } } });
            expect(tree["w:sectPr"][4]).to.deep.equal({ "w:headerReference": { _attr: { "r:id": "rId100", "w:type": "default" } } });
            expect(tree["w:sectPr"][5]).to.deep.equal({ "w:footerReference": { _attr: { "r:id": "rId200", "w:type": "even" } } });
            expect(tree["w:sectPr"][6]).to.deep.equal({ "w:pgNumType": { _attr: { "w:fmt": "cardinalText", "w:start": 10 } } });
        });

        it("should create section properties with no options", () => {
            const properties = new SectionProperties();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
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
            });
            expect(tree["w:sectPr"][2]).to.deep.equal({ "w:cols": { _attr: { "w:space": 708, "w:sep": false, "w:num": 1 } } });
            expect(tree["w:sectPr"][3]).to.deep.equal({ "w:docGrid": { _attr: { "w:linePitch": 360 } } });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                page: {
                    margin: {
                        top: 0,
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
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
            });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                page: {
                    margin: {
                        bottom: 0,
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 16838, "w:w": 11906, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
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
            });
        });

        it("should create section properties with changed options", () => {
            const properties = new SectionProperties({
                page: {
                    size: {
                        width: 0,
                        height: 0,
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 0, "w:w": 0, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
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
            });
        });

        it("should create section properties with page borders", () => {
            const properties = new SectionProperties({
                page: {
                    borders: {
                        pageBorders: {
                            offsetFrom: PageBorderOffsetFrom.PAGE,
                        },
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const pgBorders = tree["w:sectPr"].find((item) => item["w:pgBorders"] !== undefined);
            expect(pgBorders).to.deep.equal({
                "w:pgBorders": { _attr: { "w:offsetFrom": "page" } },
            });
        });

        it("should create section properties with page number type, but without start attribute", () => {
            const properties = new SectionProperties({
                page: {
                    pageNumbers: {
                        formatType: PageNumberFormat.UPPER_ROMAN,
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const pgNumType = tree["w:sectPr"].find((item) => item["w:pgNumType"] !== undefined);
            expect(pgNumType).to.deep.equal({
                "w:pgNumType": { _attr: { "w:fmt": "upperRoman" } },
            });
        });

        it("should create section properties with a page number type by default", () => {
            const properties = new SectionProperties({});
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const pgNumType = tree["w:sectPr"].find((item) => item["w:pgNumType"] !== undefined);
            expect(pgNumType).to.deep.equal({ "w:pgNumType": { _attr: {} } });
        });

        it("should create section properties with section type", () => {
            const properties = new SectionProperties({
                type: SectionType.CONTINUOUS,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const type = tree["w:sectPr"].find((item) => item["w:type"] !== undefined);
            expect(type).to.deep.equal({
                "w:type": { _attr: { "w:val": "continuous" } },
            });
        });

        it("should create section properties line number type", () => {
            const properties = new SectionProperties({
                lineNumbers: {
                    countBy: 2,
                    start: 2,
                    restart: LineNumberRestartFormat.CONTINUOUS,
                    distance: 4,
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const type = tree["w:sectPr"].find((item) => item["w:lnNumType"] !== undefined);
            expect(type).to.deep.equal({
                "w:lnNumType": { _attr: { "w:countBy": 2, "w:distance": 4, "w:restart": "continuous", "w:start": 2 } },
            });
        });
    });
});
