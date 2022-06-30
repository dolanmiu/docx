import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { FooterWrapper } from "@file/footer-wrapper";
import { HeaderWrapper } from "@file/header-wrapper";
import { Media } from "@file/media";
import { NumberFormat } from "@file/shared/number-format";
import { VerticalAlign } from "@file/vertical-align";
import { convertInchesToTwip } from "@util/convenience-functions";

import { PageOrientation } from "./properties";
import { DocumentGridType } from "./properties/doc-grid";
import { LineNumberRestartFormat } from "./properties/line-number";
import { PageBorderOffsetFrom } from "./properties/page-borders";
import { PageTextDirectionType } from "./properties/page-text-direction";
import { SectionType } from "./properties/section-type";
import { sectionMarginDefaults, sectionPageSizeDefaults, SectionProperties } from "./section-properties";

const DEFAULT_MARGINS = {
    "w:bottom": sectionMarginDefaults.BOTTOM,
    "w:footer": sectionMarginDefaults.FOOTER,
    "w:top": sectionMarginDefaults.TOP,
    "w:right": sectionMarginDefaults.RIGHT,
    "w:left": sectionMarginDefaults.LEFT,
    "w:header": sectionMarginDefaults.HEADER,
    "w:gutter": sectionMarginDefaults.GUTTER,
};

const PAGE_SIZE_DEFAULTS = {
    "w:h": sectionPageSizeDefaults.HEIGHT,
    "w:orient": sectionPageSizeDefaults.ORIENTATION,
    "w:w": sectionPageSizeDefaults.WIDTH,
};

describe("SectionProperties", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const media = new Media();

            const properties = new SectionProperties({
                page: {
                    size: {
                        width: 1190,
                        height: 1680,
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: "2in",
                        right: "2in",
                        bottom: "2in",
                        left: "2in",
                        header: 808,
                        footer: 808,
                        gutter: 10,
                    },
                    pageNumbers: {
                        start: 10,
                        formatType: NumberFormat.CARDINAL_TEXT,
                    },
                },
                column: {
                    space: 208,
                    count: 2,
                    separate: true,
                },
                grid: {
                    linePitch: convertInchesToTwip(0.25),
                    type: DocumentGridType.LINES,
                },
                headerWrapperGroup: {
                    default: new HeaderWrapper(media, 100),
                },
                footerWrapperGroup: {
                    even: new FooterWrapper(media, 200),
                },
                titlePage: true,
                verticalAlign: VerticalAlign.TOP,
            });

            const tree = new Formatter().format(properties);

            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:headerReference": { _attr: { "r:id": "rId100", "w:type": "default" } } });
            expect(tree["w:sectPr"][1]).to.deep.equal({ "w:footerReference": { _attr: { "r:id": "rId200", "w:type": "even" } } });
            expect(tree["w:sectPr"][2]).to.deep.equal({ "w:pgSz": { _attr: { "w:h": 1680, "w:w": 1190, "w:orient": "portrait" } } });
            expect(tree["w:sectPr"][3]).to.deep.equal({
                "w:pgMar": {
                    _attr: {
                        "w:bottom": "2in",
                        "w:footer": 808,
                        "w:top": "2in",
                        "w:right": "2in",
                        "w:left": "2in",
                        "w:header": 808,
                        "w:gutter": 10,
                    },
                },
            });

            expect(tree["w:sectPr"][4]).to.deep.equal({ "w:pgNumType": { _attr: { "w:fmt": "cardinalText", "w:start": 10 } } });
            expect(tree["w:sectPr"][5]).to.deep.equal({ "w:cols": { _attr: { "w:space": 208, "w:sep": true, "w:num": 2 } } });
            expect(tree["w:sectPr"][6]).to.deep.equal({ "w:vAlign": { _attr: { "w:val": "top" } } });
            expect(tree["w:sectPr"][7]).to.deep.equal({ "w:titlePg": {} });
            expect(tree["w:sectPr"][8]).to.deep.equal({ "w:docGrid": { _attr: { "w:linePitch": 360, "w:type": "lines" } } });
        });

        it("should create section properties with no options", () => {
            const properties = new SectionProperties();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: PAGE_SIZE_DEFAULTS } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": { _attr: DEFAULT_MARGINS },
            });
            // expect(tree["w:sectPr"][3]).to.deep.equal({ "w:cols": { _attr: { "w:space": 708, "w:sep": false, "w:num": 1 } } });
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
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: PAGE_SIZE_DEFAULTS } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
                    _attr: {
                        ...DEFAULT_MARGINS,
                        "w:top": 0,
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
            expect(tree["w:sectPr"][0]).to.deep.equal({ "w:pgSz": { _attr: PAGE_SIZE_DEFAULTS } });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
                    _attr: {
                        ...DEFAULT_MARGINS,
                        "w:bottom": 0,
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
                        orientation: PageOrientation.LANDSCAPE,
                    },
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            expect(tree["w:sectPr"]).to.be.an.instanceof(Array);
            expect(tree["w:sectPr"][0]).to.deep.equal({
                "w:pgSz": {
                    _attr: {
                        "w:h": 0,
                        "w:orient": PageOrientation.LANDSCAPE,
                        "w:w": 0,
                    },
                },
            });
            expect(tree["w:sectPr"][1]).to.deep.equal({
                "w:pgMar": {
                    _attr: DEFAULT_MARGINS,
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
                        formatType: NumberFormat.UPPER_ROMAN,
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

        it("should create section properties with text flow direction", () => {
            const properties = new SectionProperties({
                page: {
                    textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                },
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["w:sectPr"]);
            const type = tree["w:sectPr"].find((item) => item["w:textDirection"] !== undefined);
            expect(type).to.deep.equal({
                "w:textDirection": { _attr: { "w:val": "tbRl" } },
            });
        });
    });
});
