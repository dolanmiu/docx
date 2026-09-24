import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";
import {
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    type IXmlableObject,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
} from "docx";

import { layoutShapeDrawing } from "./shape-drawing";
import { ShapeRun } from "./shape-run";

const anchorOf = (shape: ShapeRun): readonly IXmlableObject[] => new Formatter().format(shape)["w:r"][0]["w:drawing"][0]["wp:anchor"];

const find = (children: readonly IXmlableObject[], key: string): IXmlableObject => children.find((child) => key in child)!;

describe("shapes that float with percentages", () => {
    beforeEach(() => {
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should draw a rule as wide as the space between the margins, however wide the page is", () => {
        const anchor = anchorOf(
            new ShapeRun({
                type: "line",
                transformation: { width: "100%", height: 0 },
                floating: {
                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: 0 },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                },
            }),
        );
        // As wide as on an A4 page with 1-inch margins, for applications that don't read the percentage
        expect(find(anchor, "wp:extent")["wp:extent"]._attr.cx).to.equal(Math.round((11906 / 15 - 192) * 9525));
        // After the graphic, where Word writes it
        expect(anchor.map((child) => Object.keys(child)[0]).slice(-2)).to.deep.equal(["a:graphic", "wp14:sizeRelH"]);
        expect(find(anchor, "wp14:sizeRelH")).to.deep.equal({
            "wp14:sizeRelH": [{ _attr: { relativeFrom: "margin" } }, { "wp14:pctWidth": ["100000"] }],
        });
        expect(find(anchor, "wp:positionH")["wp:positionH"][1]).to.deep.equal({ "wp:posOffset": ["0"] });
    });

    it("should write percentage offsets in place of the offsets, and sizes relative to other parts of the page", () => {
        const anchor = anchorOf(
            new ShapeRun({
                type: "rectangle",
                transformation: { width: "25%", height: "50%" },
                floating: {
                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: "70%" },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.TOP_MARGIN, offset: "12.5%" },
                    sizeRelativeTo: { width: "page", height: "bottomMargin" },
                },
            }),
        );
        // The percentage for applications that read it, and the offset on the default page for those that don't
        expect(find(anchor, "wp:positionH")).to.deep.equal({
            "wp:positionH": [
                { _attr: { relativeFrom: "page" } },
                {
                    "mc:AlternateContent": [
                        { "mc:Choice": [{ _attr: { Requires: "wp14" } }, { "wp14:pctPosHOffset": ["70000"] }] },
                        { "mc:Fallback": [{ "wp:posOffset": [`${Math.round((11906 / 15) * 0.7 * 9525)}`] }] },
                    ],
                },
            ],
        });
        expect(find(anchor, "wp:positionV")["wp:positionV"][1]["mc:AlternateContent"][0]).to.deep.equal({
            "mc:Choice": [{ _attr: { Requires: "wp14" } }, { "wp14:pctPosVOffset": ["12500"] }],
        });
        expect(anchor.slice(-2)).to.deep.equal([
            { "wp14:sizeRelH": [{ _attr: { relativeFrom: "page" } }, { "wp14:pctWidth": ["25000"] }] },
            { "wp14:sizeRelV": [{ _attr: { relativeFrom: "bottomMargin" } }, { "wp14:pctHeight": ["50000"] }] },
        ]);
        // A quarter of the page's width, and half the bottom margin, on the default page
        const extent = find(anchor, "wp:extent")["wp:extent"]._attr;
        expect(extent.cx).to.be.closeTo((11906 / 15) * 0.25 * 9525, 1);
        expect(extent.cy).to.equal(48 * 9525);
    });

    it("should size a shape that fits its text in a percentage width", () => {
        const anchor = anchorOf(
            new ShapeRun({
                type: "rectangle",
                text: "A banner",
                transformation: { width: "50%", height: "fitText" },
                floating: {
                    horizontalPosition: { offset: 0 },
                    verticalPosition: { offset: 0 },
                    sizeRelativeTo: { width: "leftMargin" },
                },
            }),
        );
        expect(find(anchor, "wp14:sizeRelH")["wp14:sizeRelH"][0]._attr.relativeFrom).to.equal("leftMargin");
        expect(anchor.some((child) => "wp14:sizeRelV" in child)).to.equal(false);
    });

    it("should write percentage offsets without percentage sizes, and percentage sizes with aligned positions", () => {
        const offsets = anchorOf(
            new ShapeRun({
                type: "rectangle",
                transformation: { width: 10, height: 10 },
                floating: { horizontalPosition: { offset: "50%" }, verticalPosition: { offset: "50%" } },
            }),
        );
        expect(offsets.some((child) => "wp14:sizeRelH" in child || "wp14:sizeRelV" in child)).to.equal(false);
        expect(find(offsets, "wp:positionH")["wp:positionH"][1]["mc:AlternateContent"][0]["mc:Choice"][1]).to.deep.equal({
            "wp14:pctPosHOffset": ["50000"],
        });

        const aligned = anchorOf(
            new ShapeRun({
                type: "rectangle",
                transformation: { width: 10, height: "10%" },
                floating: {
                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.CENTER },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.TOP },
                },
            }),
        );
        expect(find(aligned, "wp:positionH")["wp:positionH"][1]).to.deep.equal({ "wp:align": ["center"] });
        expect(find(aligned, "wp14:sizeRelV")["wp14:sizeRelV"][1]).to.deep.equal({ "wp14:pctHeight": ["10000"] });
    });

    it("should write a floating shape without percentages as an image would be", () => {
        const floating = {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 914400 },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 914400 },
        };
        const anchor = anchorOf(new ShapeRun({ type: "rectangle", transformation: { width: 10, height: 10 }, floating }));
        expect(anchor.some((child) => Object.keys(child)[0].startsWith("wp14:"))).to.equal(false);
        expect(find(anchor, "wp:positionH")["wp:positionH"][1]).to.deep.equal({ "wp:posOffset": ["914400"] });
    });

    it("should throw for a percentage that isn't one, of something it can't be of, or on a shape that doesn't float", () => {
        const floating = { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 } };
        expect(() => new ShapeRun({ type: "rectangle", transformation: { width: "-5%", height: 10 }, floating })).to.throw(
            'Invalid width "-5%". Expected a percentage of 0 or more',
        );
        expect(() => new ShapeRun({ type: "rectangle", transformation: { width: "%" as "0%", height: 10 }, floating })).to.throw(
            'Invalid width "%"',
        );
        expect(
            () =>
                new ShapeRun({
                    type: "rectangle",
                    transformation: { width: 10, height: 10 },
                    floating: {
                        horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: "10%" },
                        verticalPosition: { offset: 0 },
                    },
                }),
        ).to.throw('Invalid offset "10%". A percentage offset needs a position relative to the page');
        expect(
            () =>
                new ShapeRun({
                    type: "rectangle",
                    transformation: { width: 10, height: 10 },
                    floating: {
                        horizontalPosition: { offset: 0 },
                        verticalPosition: { relative: VerticalPositionRelativeFrom.LINE, offset: "10%" },
                    },
                }),
        ).to.throw('Invalid offset "10%"');
        expect(() => new ShapeRun({ type: "rectangle", transformation: { width: "50%", height: 10 } })).to.throw(
            'Invalid width "50%". Only a floating shape can be a percentage of the page',
        );
        expect(() => layoutShapeDrawing([{ type: "rectangle", transformation: { width: 10, height: "50%" } }])).to.throw(
            'Invalid height "50%"',
        );
    });
});
