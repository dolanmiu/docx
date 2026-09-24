import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import * as convenienceFunctions from "@util/convenience-functions";
import { HorizontalPositionRelativeFrom, type IContext, type IXmlableObject, VerticalPositionRelativeFrom } from "docx";

import { ShapeCanvasRun } from "./shape-canvas-run";

// The canvas's drawing, or the group drawn by applications that can't draw canvases
const getDrawing = (tree: IXmlableObject, part: "mc:Choice" | "mc:Fallback" = "mc:Choice"): IXmlableObject => {
    const alternates: readonly IXmlableObject[] = tree["w:r"][0]["mc:AlternateContent"];
    const content: readonly IXmlableObject[] = alternates.find((alternate) => part in alternate)![part];
    return content.find((child) => "w:drawing" in child)!["w:drawing"][0];
};

const getContainer = (tree: IXmlableObject, part?: "mc:Choice" | "mc:Fallback"): readonly IXmlableObject[] => {
    const drawing = getDrawing(tree, part);
    return drawing["wp:inline"] ?? drawing["wp:anchor"];
};

const getChild = (children: readonly IXmlableObject[], key: string): IXmlableObject => {
    const child = children.find((c) => key in c);
    if (!child) {
        throw new Error(`${key} not found`);
    }
    return child;
};

const getGraphicData = (tree: IXmlableObject, part?: "mc:Choice" | "mc:Fallback"): readonly IXmlableObject[] =>
    getChild(getChild(getContainer(tree, part), "a:graphic")["a:graphic"], "a:graphicData")["a:graphicData"];

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
        // Shapes are named as Word names them, after what they are and their id
        expect(canvas[2]["wps:wsp"][0]).to.deep.equal({ "wps:cNvPr": { _attr: { id: 1, name: "Flow Chart Terminator 1" } } });
        expect(connector[0]).to.deep.equal({ "wps:cNvPr": { _attr: { id: 3, name: "Straight Connector 3" } } });
        expect(connector[1]).to.deep.equal({
            "wps:cNvCnPr": [{ "a:stCxn": { _attr: { id: 1, idx: 2 } } }, { "a:endCxn": { _attr: { id: 2, idx: 0 } } }],
        });
        expect(connector[2]["wps:spPr"][0]["a:xfrm"]).to.deep.equal([
            { _attr: {} },
            { "a:off": { _attr: { x: 70 * 9525, y: 50 * 9525 } } },
            { "a:ext": { _attr: { cx: 0, cy: 60 * 9525 } } },
        ]);

        // The canvas reaches from its corner to the bottom-right of the shapes and their 1pt lines
        const container = getContainer(tree);
        expect(getChild(container, "wp:extent")).to.deep.equal({
            "wp:extent": { _attr: { cx: 130 * 9525 + 6350, cy: 150 * 9525 + 6350 } },
        });
        expect(getChild(container, "wp:effectExtent")).to.deep.equal({ "wp:effectExtent": { _attr: { t: 0, r: 0, b: 0, l: 0 } } });
        expect(getChild(container, "wp:docPr")).to.deep.equal({ "wp:docPr": { _attr: { id: "4", name: "Flowchart" } } });
    });

    it("should draw the same shapes as a group for applications that can't draw canvases", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [
                    { id: "a", type: "rectangle", transformation: { width: 50, height: 50 } },
                    { id: "b", type: "rectangle", transformation: { offset: { left: 100 }, width: 50, height: 50 } },
                    { type: "connector", from: "a", to: "b" },
                ],
                transformation: { width: 300, height: 200 },
                fill: "F2F2F2",
                line: "BFBFBF",
            }),
        );

        expect(tree["w:r"][0]["mc:AlternateContent"][0]["mc:Choice"][0]).to.deep.equal({ _attr: { Requires: "wpc" } });
        const graphicData = getGraphicData(tree, "mc:Fallback");
        expect(graphicData[0]).to.deep.equal({ _attr: { uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" } });
        const group = graphicData[1]["wpg:wgp"];
        // The group is the canvas's size, with a rectangle behind the shapes for its background and outline
        expect(group[1]["wpg:grpSpPr"][0]["a:xfrm"].slice(1)).to.deep.equal([
            { "a:off": { _attr: { x: 0, y: 0 } } },
            { "a:ext": { _attr: { cx: 300 * 9525, cy: 200 * 9525 } } },
            { "a:chOff": { _attr: { x: 0, y: 0 } } },
            { "a:chExt": { _attr: { cx: 300 * 9525, cy: 200 * 9525 } } },
        ]);
        // The background is decorative, so screen readers skip it
        const background = group[2]["wps:wsp"][0]["wps:cNvPr"];
        expect(background[0]).to.deep.equal({ _attr: { id: 8, name: "Canvas 8" } });
        expect(background[1]).to.have.property("a:extLst");
        expect(JSON.stringify(group[2])).to.include("F2F2F2");
        // The shapes and connector are laid out again, with ids of their own
        expect(group.slice(3).map((child: IXmlableObject) => child["wps:wsp"][0]["wps:cNvPr"]._attr.id)).to.deep.equal([5, 6, 7]);
        expect(group[5]["wps:wsp"][1]).to.deep.equal({
            "wps:cNvCnPr": [{ "a:stCxn": { _attr: { id: 5, idx: 3 } } }, { "a:endCxn": { _attr: { id: 6, idx: 1 } } }],
        });
        expect(getChild(getContainer(tree, "mc:Fallback"), "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 6350, r: 6350, b: 6350, l: 6350 } },
        });
    });

    it("should reach as far in its fallback as its shapes do", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [{ type: "rectangle", transformation: { offset: { left: 90 }, width: 50, height: 50 } }],
                transformation: { width: 100, height: 100 },
            }),
        );
        // The shape reaches 40 pixels and half its line past the canvas's right edge, which a group doesn't cut off
        expect(getChild(getContainer(tree, "mc:Fallback"), "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 0, r: 40 * 9525 + 6350, b: 0, l: 0 } },
        });
    });

    it("should lay out shapes without an offset", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                layout: { type: "flow", levelSpacing: 20 },
                children: [
                    { id: "a", type: "rectangle", transformation: { width: 100, height: 40 } },
                    { id: "b", type: "rectangle", transformation: { width: 100, height: 40 } },
                    { type: "connector", from: "a", to: "b" },
                ],
            }),
        );
        // Two levels of 40 pixels, 20 apart, and the shapes' lines, half a point either side
        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({
            "wp:extent": { _attr: { cx: 100 * 9525 + 12700, cy: 100 * 9525 + 12700 } },
        });
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

        expect(getDrawing(tree)).to.have.property("wp:anchor");
        expect(getDrawing(tree, "mc:Fallback")).to.have.property("wp:anchor");
        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 300 * 9525, cy: 200 * 9525 } } });
        const canvas = getGraphicData(tree)[1]["wpc:wpc"];
        expect(canvas[0]).to.deep.equal({ "wpc:bg": [{ "a:solidFill": [{ "a:srgbClr": { _attr: { val: "F2F2F2" } } }] }] });
        expect(canvas[1]["wpc:whole"][0]["a:ln"][0]).to.deep.equal({ _attr: { w: 12700 } });
        // Only the canvas's own outline reaches past its edges
        expect(getChild(getContainer(tree), "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 6350, r: 6350, b: 6350, l: 6350 } },
        });
    });

    it("should write pictures and groups on the canvas, with groups as wpg:wgp", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({
                children: [
                    {
                        id: "logo",
                        type: "picture",
                        image: { type: "png", data: Buffer.from("logo") },
                        transformation: { width: 50, height: 50 },
                    },
                    {
                        type: "group",
                        transformation: { offset: { left: 150 } },
                        children: [{ id: "circle", type: "ellipse", transformation: { width: 50, height: 50 } }],
                    },
                    { type: "connector", from: "logo", to: "circle", line: "none" },
                ],
                decorative: true,
            }),
            { file: { Media: { addImage: vi.fn() } }, stack: [] } as unknown as IContext,
        );

        const canvas = getGraphicData(tree)[1]["wpc:wpc"];
        expect(canvas.slice(2).map((child: object) => Object.keys(child)[0])).to.deep.equal(["pic:pic", "wpg:wgp", "wps:wsp"]);
        // From the right of the picture to the left of the ellipse in the group, which is the ellipse's site 2
        expect(canvas[4]["wps:wsp"][1]).to.deep.equal({
            "wps:cNvCnPr": [{ "a:stCxn": { _attr: { id: 1, idx: 3 } } }, { "a:endCxn": { _attr: { id: 3, idx: 2 } } }],
        });
        expect(getChild(getContainer(tree), "wp:docPr")["wp:docPr"][1]).to.have.property("a:extLst");
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

        // The loop goes a quarter of an inch above the shapes, plus a pixel because its box can't have no width,
        // and everything moves half a line's width more so the 1pt lines are on the canvas
        const loop = 228600 + 9525;
        const halfLine = 6350;
        const canvas = getGraphicData(tree)[1]["wpc:wpc"];
        expect(canvas[2]["wps:wsp"][2]["wps:spPr"][0]["a:xfrm"][1]).to.deep.equal({
            "a:off": { _attr: { x: halfLine, y: loop + halfLine } },
        });
        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({
            "wp:extent": { _attr: { cx: 300 * 9525 + 2 * halfLine, cy: 50 * 9525 + loop + 2 * halfLine } },
        });
    });

    it("should lay out a canvas and its fallback in the document's styles when it is written", () => {
        const canvas = new ShapeCanvasRun({
            children: [{ type: "rectangle", text: "Start", transformation: { width: "fitText", height: "fitText" } }],
        });
        const context = {
            file: new File({ styles: { default: { document: { run: { size: 40 } } } }, sections: [] }),
            stack: [],
        } as unknown as IContext;
        const plain = new Formatter().format(canvas);
        const styled = new Formatter().format(canvas, context);

        const extent = (tree: IXmlableObject, part: "mc:Choice" | "mc:Fallback"): IXmlableObject =>
            getChild(getContainer(tree, part), "wp:extent")["wp:extent"]._attr;
        for (const part of ["mc:Choice", "mc:Fallback"] as const) {
            expect(extent(styled, part).cx).to.be.greaterThan(extent(plain, part).cx);
            expect(extent(styled, part).cy).to.be.greaterThan(extent(plain, part).cy);
            expect(getChild(getContainer(styled, part), "wp:docPr")).to.deep.equal(getChild(getContainer(plain, part), "wp:docPr"));
        }
    });

    it("should leave out the group for applications that can't draw canvases", () => {
        const tree = new Formatter().format(
            new ShapeCanvasRun({ fallback: false, children: [{ type: "rectangle", transformation: { width: 10, height: 10 } }] }),
        );
        const drawing = tree["w:r"][0]["w:drawing"];
        expect(drawing[0]["wp:inline"].find((child: IXmlableObject) => "wp:docPr" in child)).to.deep.equal({
            "wp:docPr": { _attr: { id: "2", name: "", descr: "", title: "" } },
        });
        expect(tree["w:r"]).to.have.length(1);
    });
});
