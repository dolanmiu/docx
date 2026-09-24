import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom } from "@file/index";
import type { IXmlableObject } from "@file/xml-components";
import * as convenienceFunctions from "@util/convenience-functions";

import { ShapeCanvasRun } from "./shape-canvas-run";

const getContainer = (tree: IXmlableObject): readonly IXmlableObject[] => {
    const drawing = tree["w:r"][0]["w:drawing"][0];
    return drawing["wp:inline"] ?? drawing["wp:anchor"];
};

const getChild = (children: readonly IXmlableObject[], key: string): IXmlableObject => {
    const child = children.find((c) => key in c);
    if (!child) {
        throw new Error(`${key} not found`);
    }
    return child;
};

const getGraphicData = (tree: IXmlableObject): readonly IXmlableObject[] =>
    getChild(getChild(getContainer(tree), "a:graphic")["a:graphic"], "a:graphicData")["a:graphicData"];

describe("ShapeCanvasRun", () => {
    beforeEach(() => {
        let id = 0;
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockImplementation(() => ++id);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should write a canvas with shapes and an attached connector", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [
                    { id: "start", type: "flowChartTerminator", transformation: { offset: { left: 10, top: 10 }, width: 120, height: 40 } },
                    { id: "step", type: "flowChartProcess", transformation: { offset: { left: 10, top: 110 }, width: 120, height: 40 } },
                    { type: "connector", from: "start", to: "step", line: { endArrow: "triangle" } },
                ],
                altText: { name: "Flowchart" },
            }),
        );

        const graphicData = getGraphicData(tree);
        expect(graphicData[0]).to.deep.equal({ _attr: { uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" } });
        const canvas = graphicData[1]["wpc:wpc"];
        expect(canvas.slice(0, 2)).to.deep.equal([{ "wpc:bg": {} }, { "wpc:whole": {} }]);
        expect(canvas).to.have.length(5);

        const connector = canvas[4]["wps:wsp"];
        expect(connector[0]).to.deep.equal({ "wps:cNvPr": { _attr: { id: 3, name: "" } } });
        expect(connector[1]).to.deep.equal({
            "wps:cNvCnPr": [{ "a:stCxn": { _attr: { id: 1, idx: 2 } } }, { "a:endCxn": { _attr: { id: 2, idx: 0 } } }],
        });
        expect(connector[2]["wps:spPr"][0]["a:xfrm"]).to.deep.equal([
            { _attr: {} },
            { "a:off": { _attr: { x: 70 * 9525, y: 50 * 9525 } } },
            { "a:ext": { _attr: { cx: 0, cy: 60 * 9525 } } },
        ]);

        // The canvas reaches from its corner to the bottom-right of the shapes
        const container = getContainer(tree);
        expect(getChild(container, "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 130 * 9525, cy: 150 * 9525 } } });
        expect(getChild(container, "wp:docPr")).to.deep.equal({ "wp:docPr": { _attr: { id: 4, name: "Flowchart" } } });
    });

    it("should take its size, background, outline and position from its options", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [{ type: "rectangle", transformation: { width: 50, height: 50 } }],
                transformation: { width: 300, height: 200 },
                fill: "F2F2F2",
                line: "BFBFBF",
                floating: {
                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 914400 },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 914400 },
                },
            }),
        );

        expect(tree["w:r"][0]["w:drawing"][0]).to.have.property("wp:anchor");
        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 300 * 9525, cy: 200 * 9525 } } });
        const canvas = getGraphicData(tree)[1]["wpc:wpc"];
        expect(canvas[0]).to.deep.equal({ "wpc:bg": [{ "a:solidFill": [{ "a:srgbClr": { _attr: { val: "F2F2F2" } } }] }] });
        expect(canvas[1]["wpc:whole"][0]["a:ln"][0]).to.deep.equal({ _attr: { w: 12700 } });
    });

    it("should move the shapes down when a connector loops above them", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [
                    { id: "a", type: "rectangle", transformation: { width: 100, height: 50 } },
                    { id: "b", type: "rectangle", transformation: { offset: { left: 200 }, width: 100, height: 50 } },
                    { type: "connector", from: { id: "a", side: "top" }, to: { id: "b", side: "top" }, route: "elbow" },
                ],
            }),
        );

        // The loop goes a quarter of an inch above the shapes, plus a pixel because its box can't have no width
        const loop = 228600 + 9525;
        const canvas = getGraphicData(tree)[1]["wpc:wpc"];
        expect(canvas[2]["wps:wsp"][2]["wps:spPr"][0]["a:xfrm"][1]).to.deep.equal({ "a:off": { _attr: { x: 0, y: loop } } });
        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({
            "wp:extent": { _attr: { cx: 300 * 9525, cy: 50 * 9525 + loop } },
        });
    });
});
