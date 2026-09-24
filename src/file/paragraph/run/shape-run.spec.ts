import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { HorizontalPositionAlign, TextWrappingType, VerticalPositionRelativeFrom } from "@file/index";
import { Paragraph } from "@file/paragraph";
import * as convenienceFunctions from "@util/convenience-functions";

import { ShapeRun } from "./shape-run";

describe("ShapeRun", () => {
    beforeEach(() => {
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should draw an inline black bar", () => {
        const tree = new Formatter().format(
            new ShapeRun({ type: "rect", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
        );

        expect(tree).to.deep.equal({
            "w:r": [
                {
                    "w:drawing": [
                        {
                            "wp:inline": [
                                { _attr: { distT: 0, distB: 0, distL: 0, distR: 0 } },
                                { "wp:extent": { _attr: { cx: 1905000, cy: 38100 } } },
                                { "wp:effectExtent": { _attr: { t: 0, r: 0, b: 0, l: 0 } } },
                                { "wp:docPr": { _attr: { id: 1, name: "", descr: "", title: "" } } },
                                {
                                    "wp:cNvGraphicFramePr": [
                                        {
                                            "a:graphicFrameLocks": {
                                                _attr: {
                                                    "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                                                    noChangeAspect: 1,
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    "a:graphic": [
                                        { _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main" } },
                                        {
                                            "a:graphicData": [
                                                { _attr: { uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape" } },
                                                {
                                                    "wps:wsp": [
                                                        { "wps:cNvSpPr": {} },
                                                        {
                                                            "wps:spPr": [
                                                                {
                                                                    "a:xfrm": [
                                                                        { _attr: {} },
                                                                        { "a:off": { _attr: { x: 0, y: 0 } } },
                                                                        { "a:ext": { _attr: { cx: 1905000, cy: 38100 } } },
                                                                    ],
                                                                },
                                                                { "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }] },
                                                                { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "000000" } } }] },
                                                                { "a:ln": [{ "a:noFill": {} }] },
                                                            ],
                                                        },
                                                        { "wps:bodyPr": { _attr: {} } },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("should size the effect extent to fit the line and its arrowheads", () => {
        const tree = new Formatter().format(
            new ShapeRun({ type: "line", transformation: { width: 300, height: 0 }, line: { width: 2, endArrow: "triangle" } }),
        );

        expect(tree["w:r"][0]["w:drawing"][0]["wp:inline"][2]).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 38100, r: 38100, b: 38100, l: 38100 } },
        });
    });

    it("should ignore an offset, which only applies inside a group", () => {
        const tree = new Formatter().format(
            new ShapeRun({ type: "ellipse", transformation: { width: 100, height: 100, offset: { left: 50, top: 50 } } }),
        );

        const shape = tree["w:r"][0]["w:drawing"][0]["wp:inline"][5]["a:graphic"][1]["a:graphicData"][1]["wps:wsp"];
        expect(shape[1]["wps:spPr"][0]["a:xfrm"][1]).to.deep.equal({ "a:off": { _attr: { x: 0, y: 0 } } });
    });

    it("should float a shape with text, adjustments and alt text", () => {
        const tree = new Formatter().format(
            new ShapeRun({
                type: "wedgeRoundRectCallout",
                adjustments: { pointerX: -20.833, pointerY: 62.5 },
                transformation: { width: 200, height: 100, rotation: 30 },
                fill: {
                    type: "gradient",
                    stops: [
                        { position: 0, color: "FFFFFF" },
                        { position: 100, color: "DDEBF7" },
                    ],
                },
                children: [new Paragraph("Hello")],
                floating: {
                    horizontalPosition: { align: HorizontalPositionAlign.RIGHT },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                    wrap: { type: TextWrappingType.SQUARE },
                },
                altText: { name: "Callout", description: "A speech bubble", title: "Callout" },
            }),
        );

        const anchor = tree["w:r"][0]["w:drawing"][0]["wp:anchor"];
        expect(anchor.find((child: object) => "wp:effectExtent" in child)).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 6350, r: 6350, b: 6350, l: 6350 } },
        });
        expect(anchor.find((child: object) => "wp:docPr" in child)).to.deep.equal({
            "wp:docPr": { _attr: { id: 1, name: "Callout", descr: "A speech bubble", title: "Callout" } },
        });

        const graphic = anchor.find((child: object) => "a:graphic" in child)["a:graphic"];
        const shape = graphic[1]["a:graphicData"][1]["wps:wsp"];
        expect(shape[1]["wps:spPr"][0]["a:xfrm"][0]).to.deep.equal({ _attr: { rot: 1800000 } });
        expect(shape[1]["wps:spPr"][1]).to.deep.equal({
            "a:prstGeom": [
                { _attr: { prst: "wedgeRoundRectCallout" } },
                {
                    "a:avLst": [
                        { "a:gd": { _attr: { name: "adj1", fmla: "val -20833" } } },
                        { "a:gd": { _attr: { name: "adj2", fmla: "val 62500" } } },
                    ],
                },
            ],
        });
        expect(shape[1]["wps:spPr"][2]).to.have.property("a:gradFill");
        expect(shape[2]).to.have.property("wps:txbx");
        expect(shape[3]).to.deep.equal({ "wps:bodyPr": { _attr: { anchor: "ctr" } } });
    });

    it("should be accepted as a paragraph child", () => {
        const paragraph = new Paragraph({
            children: [new ShapeRun({ type: "rect", transformation: { width: 10, height: 10 } })],
        });
        const tree = new Formatter().format(paragraph);
        expect(tree["w:p"][0]).to.have.property("w:r");
    });
});
