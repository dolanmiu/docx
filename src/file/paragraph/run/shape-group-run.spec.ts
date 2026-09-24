import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom } from "@file/index";
import type { IContext, IXmlableObject } from "@file/xml-components";
import * as convenienceFunctions from "@util/convenience-functions";

import { ShapeGroupRun } from "./shape-group-run";

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

const getGroup = (tree: IXmlableObject): readonly IXmlableObject[] =>
    getChild(getChild(getContainer(tree), "a:graphic")["a:graphic"], "a:graphicData")["a:graphicData"][1]["wpg:wgp"];

describe("ShapeGroupRun", () => {
    beforeEach(() => {
        let id = 0;
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockImplementation(() => ++id);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should size the group to the box around its children", () => {
        const tree = new Formatter().format(
            new ShapeGroupRun({
                children: [
                    {
                        type: "rectangle",
                        transformation: { width: 120, height: 48 },
                        fill: "4472C4",
                        line: "none",
                        altText: { name: "Start" },
                    },
                    {
                        type: "straightConnector",
                        transformation: { offset: { left: 120, top: 24 }, width: 40, height: 0 },
                        line: { width: 2, endArrow: "triangle" },
                    },
                    {
                        type: "ellipse",
                        transformation: { offset: { left: 160 }, width: 120, height: 48 },
                        altText: { name: "End", description: "d", title: "t" },
                    },
                ],
            }),
        );

        const container = getContainer(tree);
        expect(getChild(container, "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 2667000, cy: 457200 } } });
        // The arrowhead stays inside the group, and only the ellipse's 1pt line reaches past it
        expect(getChild(container, "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 6350, r: 6350, b: 6350, l: 0 } },
        });
        // Children take ids 1-3 when they are created, before the group's docPr
        expect(getChild(container, "wp:docPr")).to.deep.equal({ "wp:docPr": { _attr: { id: 4, name: "", descr: "", title: "" } } });

        const group = getGroup(tree);
        expect(group[1]).to.deep.equal({
            "wpg:grpSpPr": [
                {
                    "a:xfrm": [
                        { _attr: {} },
                        { "a:off": { _attr: { x: 0, y: 0 } } },
                        { "a:ext": { _attr: { cx: 2667000, cy: 457200 } } },
                        { "a:chOff": { _attr: { x: 0, y: 0 } } },
                        { "a:chExt": { _attr: { cx: 2667000, cy: 457200 } } },
                    ],
                },
            ],
        });

        expect(group.slice(2).map((shape) => shape["wps:wsp"][0])).to.deep.equal([
            { "wps:cNvPr": { _attr: { id: 1, name: "Start" } } },
            { "wps:cNvPr": { _attr: { id: 2, name: "Straight Connector 2" } } },
            { "wps:cNvPr": { _attr: { id: 3, name: "End", descr: "d", title: "t" } } },
        ]);
        expect(group[3]["wps:wsp"][1]).to.deep.equal({ "wps:cNvCnPr": {} });
        expect(group[3]["wps:wsp"][2]["wps:spPr"][0]["a:xfrm"]).to.deep.equal([
            { _attr: {} },
            { "a:off": { _attr: { x: 1143000, y: 228600 } } },
            { "a:ext": { _attr: { cx: 381000, cy: 0 } } },
        ]);
    });

    it("should draw connectors between its shapes", () => {
        const tree = new Formatter().format(
            new ShapeGroupRun({
                children: [
                    { id: "a", type: "rectangle", transformation: { width: 100, height: 50 } },
                    { id: "b", type: "ellipse", transformation: { offset: { left: 200, top: 100 }, width: 100, height: 50 } },
                    { type: "connector", from: "a", to: "b", route: "curved", line: { endArrow: "triangle" } },
                ],
            }),
        );

        const connector = getGroup(tree)[4]["wps:wsp"];
        expect(connector[1]).to.deep.equal({
            "wps:cNvCnPr": [{ "a:stCxn": { _attr: { id: 1, idx: 3 } } }, { "a:endCxn": { _attr: { id: 2, idx: 2 } } }],
        });
        expect(connector[2]["wps:spPr"][1]).to.deep.equal({
            "a:prstGeom": [
                { _attr: { prst: "curvedConnector3" } },
                { "a:avLst": [{ "a:gd": { _attr: { name: "adj1", fmla: "val 50000" } } }] },
            ],
        });
    });

    it("should start the children's coordinate space at the top-left-most child", () => {
        const tree = new Formatter().format(
            new ShapeGroupRun({
                children: [
                    { type: "rectangle", transformation: { offset: { left: -10, top: 20 }, width: 100, height: 50 } },
                    { type: "rectangle", transformation: { offset: { left: 40, top: 40 }, width: 100, height: 50 } },
                ],
            }),
        );

        expect(getChild(getContainer(tree), "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 1428750, cy: 666750 } } });
        const transform = getGroup(tree)[1]["wpg:grpSpPr"][0]["a:xfrm"];
        expect(transform.slice(3)).to.deep.equal([
            { "a:chOff": { _attr: { x: -95250, y: 190500 } } },
            { "a:chExt": { _attr: { cx: 1428750, cy: 666750 } } },
        ]);
    });

    it("should scale, rotate and float the group with its own transformation", () => {
        const tree = new Formatter().format(
            new ShapeGroupRun({
                children: [{ type: "rectangle", transformation: { width: 100, height: 50 }, line: "none" }],
                transformation: { width: 200, height: 100, rotation: 90, offset: { left: 5, top: 5 } },
                floating: {
                    horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 914400 },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 914400 },
                },
                altText: { name: "Group" },
            }),
        );

        const container = getContainer(tree);
        expect(tree["w:r"][0]["w:drawing"][0]).to.have.property("wp:anchor");
        expect(getChild(container, "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 1905000, cy: 952500 } } });
        // Turned a quarter turn, the 200 by 100 pixel group reaches 50 pixels above and below its box
        expect(getChild(container, "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 476250, r: 0, b: 476250, l: 0 } },
        });
        expect(getChild(container, "wp:docPr")).to.deep.equal({ "wp:docPr": { _attr: { id: 2, name: "Group" } } });

        expect(getGroup(tree)[1]["wpg:grpSpPr"][0]["a:xfrm"]).to.deep.equal([
            { _attr: { rot: 5400000 } },
            { "a:off": { _attr: { x: 0, y: 0 } } },
            { "a:ext": { _attr: { cx: 1905000, cy: 952500 } } },
            { "a:chOff": { _attr: { x: 0, y: 0 } } },
            { "a:chExt": { _attr: { cx: 952500, cy: 476250 } } },
        ]);
    });

    it("should write pictures and groups inside the group, and add the pictures to the document", () => {
        const addImage = vi.fn();
        const tree = new Formatter().format(
            new ShapeGroupRun({
                children: [
                    { type: "picture", image: { type: "png", data: Buffer.from("logo") }, transformation: { width: 50, height: 50 } },
                    {
                        type: "group",
                        transformation: { offset: { left: 60 } },
                        children: [{ type: "ellipse", transformation: { width: 50, height: 50 } }],
                    },
                ],
                link: "https://example.com",
                decorative: true,
            }),
            {
                file: { Media: { addImage } },
                stack: [],
                viewWrapper: { Relationships: { addRelationship: vi.fn() } },
            } as unknown as IContext,
        );

        const group = getGroup(tree);
        expect(Object.keys(group[2])).to.deep.equal(["pic:pic"]);
        expect(Object.keys(group[3])).to.deep.equal(["wpg:grpSp"]);
        expect(group[3]["wpg:grpSp"][0]).to.deep.equal({ "wpg:cNvPr": { _attr: { id: 2, name: "Group 2" } } });
        expect(addImage).toHaveBeenCalledTimes(1);

        const docProperties = getChild(getContainer(tree), "wp:docPr")["wp:docPr"];
        expect(docProperties.map((child: object) => Object.keys(child)[0])).to.deep.equal(["_attr", "a:hlinkClick", "a:extLst"]);
    });

    it("should size a group of lines with no width or height", () => {
        const vertical = new Formatter().format(
            new ShapeGroupRun({ children: [{ type: "line", transformation: { width: 0, height: 100 } }] }),
        );
        expect(getChild(getContainer(vertical), "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 0, cy: 952500 } } });
        expect(getChild(getContainer(vertical), "wp:effectExtent")).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 6350, r: 6350, b: 6350, l: 6350 } },
        });

        const horizontal = new Formatter().format(
            new ShapeGroupRun({ children: [{ type: "line", transformation: { width: 100, height: 0 } }] }),
        );
        expect(getChild(getContainer(horizontal), "wp:extent")).to.deep.equal({ "wp:extent": { _attr: { cx: 952500, cy: 0 } } });
    });

    it("should reject a group without children", () => {
        expect(() => new ShapeGroupRun({ children: [] })).to.throw("Expected at least 1 child shape");
    });
});
