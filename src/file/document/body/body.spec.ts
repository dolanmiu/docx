import { beforeEach, describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { Body } from "./body";
import { sectionMarginDefaults } from "./section-properties";

describe("Body", () => {
    let body: Body;

    beforeEach(() => {
        body = new Body();
    });

    describe("#addSection", () => {
        it("should add section with default parameters", () => {
            body.addSection({
                page: {
                    size: {
                        width: 10000,
                        height: 10000,
                    },
                },
            });

            const tree = new Formatter().format(body);

            expect(tree).to.deep.equal({
                "w:body": [
                    {
                        "w:sectPr": [
                            { "w:pgSz": { _attr: { "w:w": 10000, "w:h": 10000, "w:orient": "portrait" } } },
                            {
                                "w:pgMar": {
                                    _attr: {
                                        "w:top": sectionMarginDefaults.TOP,
                                        "w:right": sectionMarginDefaults.RIGHT,
                                        "w:bottom": sectionMarginDefaults.BOTTOM,
                                        "w:left": sectionMarginDefaults.LEFT,
                                        "w:header": sectionMarginDefaults.HEADER,
                                        "w:footer": sectionMarginDefaults.FOOTER,
                                        "w:gutter": sectionMarginDefaults.GUTTER,
                                    },
                                },
                            },
                            {
                                "w:pgNumType": {
                                    _attr: {},
                                },
                            },
                            // { "w:cols": { _attr: { "w:space": 708, "w:sep": false, "w:num": 1 } } },
                            { "w:docGrid": { _attr: { "w:linePitch": 360 } } },
                        ],
                    },
                ],
            });
        });
    });

    describe("#getSectionPropertiesFor", () => {
        // Sections are told apart by their page width (text width = page width - 2880 twips of margins)
        const FIRST_PAGE_WIDTH = 10000;
        const SECOND_PAGE_WIDTH = 20000;

        it("returns undefined when the body has no sections", () => {
            expect(body.getSectionPropertiesFor()).to.be.undefined;
            expect(body.getSectionPropertiesFor(new Paragraph("orphan"))).to.be.undefined;
        });

        it("returns the only section for its children, before and after formatting", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            const paragraph = new Paragraph("hello");
            body.push(paragraph);

            expect(body.getSectionPropertiesFor(paragraph)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);

            new Formatter().format(body);

            expect(body.getSectionPropertiesFor(paragraph)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
        });

        it("returns the section that each child belongs to when there are several sections", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            const first = new Paragraph("first section");
            body.push(first);
            body.addSection({ page: { size: { width: SECOND_PAGE_WIDTH, height: 10000 } } });
            const second = new Paragraph("second section");
            body.push(second);

            expect(body.getSectionPropertiesFor(first)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(second)?.AvailableTextWidth).to.equal(SECOND_PAGE_WIDTH - 2880);

            new Formatter().format(body);

            expect(body.getSectionPropertiesFor(first)?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(second)?.AvailableTextWidth).to.equal(SECOND_PAGE_WIDTH - 2880);
        });

        it("returns the first section when no child is given or the child is not in the body", () => {
            body.addSection({ page: { size: { width: FIRST_PAGE_WIDTH, height: 10000 } } });
            body.push(new Paragraph("first section"));
            body.addSection({ page: { size: { width: SECOND_PAGE_WIDTH, height: 10000 } } });
            body.push(new Paragraph("second section"));

            expect(body.getSectionPropertiesFor()?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
            expect(body.getSectionPropertiesFor(new Paragraph("orphan"))?.AvailableTextWidth).to.equal(FIRST_PAGE_WIDTH - 2880);
        });
    });
});
