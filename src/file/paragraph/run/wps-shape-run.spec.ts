import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/index";
import type { IXmlableObject } from "@file/xml-components";
import * as convenienceFunctions from "@util/convenience-functions";

import { WpsShapeRun } from "./wps-shape-run";

const findChild = (children: readonly IXmlableObject[], key: string): readonly IXmlableObject[] => {
    const child = children.find((c) => key in c);
    if (!child) {
        throw new Error(`${key} not found`);
    }
    return child[key];
};

const getShape = (tree: IXmlableObject): readonly IXmlableObject[] => {
    const drawing = tree["w:r"][0]["w:drawing"][0];
    const container = drawing["wp:inline"] ?? drawing["wp:anchor"];
    const graphicData = findChild(findChild(container, "a:graphic"), "a:graphicData");
    return findChild(graphicData, "wps:wsp");
};

describe("WpsShapeRun", () => {
    beforeEach(() => {
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("#constructor()", () => {
        it("should create an inline text box with the fill before the outline", () => {
            const tree = new Formatter().format(
                new WpsShapeRun({
                    type: "wps",
                    children: [new Paragraph("Test Paragraph")],
                    transformation: { width: 200, height: 100 },
                    solidFill: { type: "rgb", value: "FF0000" },
                    outline: { type: "solidFill", solidFillType: "rgb", value: "0000FF", width: 12700 },
                }),
            );

            expect(tree["w:r"][0]["w:drawing"][0]["wp:inline"][1]).to.deep.equal({
                "wp:extent": { _attr: { cx: 1905000, cy: 952500 } },
            });
            expect(getShape(tree)).to.deep.equal([
                { "wps:cNvSpPr": { _attr: { txBox: "1" } } },
                {
                    "wps:spPr": [
                        { _attr: { bwMode: "auto" } },
                        {
                            "a:xfrm": [
                                { _attr: {} },
                                { "a:off": { _attr: { x: 0, y: 0 } } },
                                { "a:ext": { _attr: { cx: 1905000, cy: 952500 } } },
                            ],
                        },
                        { "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }] },
                        { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }] },
                        { "a:ln": [{ _attr: { w: 12700 } }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "0000FF" } } }] }] },
                    ],
                },
                {
                    "wps:txbx": [
                        {
                            "w:txbxContent": [
                                { "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Test Paragraph"] }] }] },
                            ],
                        },
                    ],
                },
                { "wps:bodyPr": { _attr: {} } },
            ]);
        });

        it("should write no fill before the outline when only an outline is given", () => {
            const tree = new Formatter().format(
                new WpsShapeRun({
                    type: "wps",
                    children: [new Paragraph("Test Paragraph")],
                    transformation: { width: 200, height: 100 },
                    outline: { type: "solidFill", solidFillType: "rgb", value: "0000FF" },
                }),
            );

            const shapeProperties = findChild(getShape(tree), "wps:spPr");
            expect(shapeProperties.slice(3)).to.deep.equal([
                { "a:noFill": {} },
                { "a:ln": [{ _attr: {} }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "0000FF" } } }] }] },
            ]);
        });

        it("should create a floating text box with rotation", () => {
            const tree = new Formatter().format(
                new WpsShapeRun({
                    type: "wps",
                    children: [new Paragraph("Test Paragraph")],
                    transformation: { width: 200, height: 200, rotation: 45 },
                    solidFill: { type: "rgb", value: "FF0000" },
                    floating: {
                        zIndex: 10,
                        horizontalPosition: { offset: 1014400 },
                        verticalPosition: { offset: 1014400 },
                    },
                }),
            );

            const anchor = tree["w:r"][0]["w:drawing"][0]["wp:anchor"];
            expect(anchor[0]._attr).to.include({ relativeHeight: 10 });

            const shapeProperties = findChild(getShape(tree), "wps:spPr");
            expect(findChild(shapeProperties, "a:xfrm")[0]).to.deep.equal({ _attr: { rot: 2700000 } });
            expect(shapeProperties.slice(3)).to.deep.equal([{ "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }] }]);
        });
    });
});
