import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import * as convenienceFunctions from "@util/convenience-functions";
import {
    HorizontalPositionAlign,
    type IContext,
    type IXmlableObject,
    Paragraph,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";

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
            new ShapeRun({ type: "rectangle", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
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
                                { "wp:docPr": { _attr: { id: "1", name: "", descr: "", title: "" } } },
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

    it("should fit its size to its text", () => {
        const tree = new Formatter().format(
            new ShapeRun({ type: "rectangle", text: "Hello", transformation: { width: "fitText", height: "fitText" } }),
        );
        const inline = tree["w:r"][0]["w:drawing"][0]["wp:inline"];
        // "Hello" in 10pt Times New Roman, with Word's default text margins
        expect(inline[1]).to.deep.equal({ "wp:extent": { _attr: { cx: 51 * 9525, cy: 25 * 9525 } } });
        const shape = inline[5]["a:graphic"][1]["a:graphicData"][1]["wps:wsp"];
        expect(JSON.stringify(shape)).to.include('"Hello"');
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
                type: "roundedRectangularCallout",
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
        // Turned 30 degrees, the 200 by 100 pixel box reaches 11.6 pixels further left and right and 43.3 further up and down
        expect(anchor.find((child: object) => "wp:effectExtent" in child)).to.deep.equal({
            "wp:effectExtent": { _attr: { t: 418795, r: 116865, b: 418795, l: 116865 } },
        });
        expect(anchor.find((child: object) => "wp:docPr" in child)).to.deep.equal({
            "wp:docPr": { _attr: { id: "1", name: "Callout", descr: "A speech bubble", title: "Callout" } },
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
            children: [new ShapeRun({ type: "rectangle", transformation: { width: 10, height: 10 } })],
        });
        const tree = new Formatter().format(paragraph);
        expect(tree["w:p"][0]).to.have.property("w:r");
    });
    it("should reach past its box by its effects and line", () => {
        const tree = new Formatter().format(
            new ShapeRun({
                type: "rectangle",
                transformation: { width: 100, height: 100 },
                line: "none",
                effects: { glow: { color: "FFC000", size: 10 }, shadow: { blur: 0, distance: 5, angle: 90 } },
            }),
        );

        const inline = tree["w:r"][0]["w:drawing"][0]["wp:inline"];
        expect(inline[2]).to.deep.equal({ "wp:effectExtent": { _attr: { t: 127000, r: 127000, b: 127000, l: 127000 } } });
        const properties = inline[5]["a:graphic"][1]["a:graphicData"][1]["wps:wsp"][1]["wps:spPr"];
        expect(Object.keys(properties[4])).to.deep.equal(["a:effectLst"]);
    });

    it("should draw a custom shape from a path", () => {
        const tree = new Formatter().format(
            new ShapeRun({ type: "custom", path: "M 0 0 L 10 0 L 5 10 Z", transformation: { width: 100, height: 100 }, fill: "FF0000" }),
        );

        const shape = tree["w:r"][0]["w:drawing"][0]["wp:inline"][5]["a:graphic"][1]["a:graphicData"][1]["wps:wsp"];
        expect(shape[0]).to.deep.equal({ "wps:cNvSpPr": {} });
        expect(Object.keys(shape[1]["wps:spPr"][1])).to.deep.equal(["a:custGeom"]);
    });

    it("should draw a custom shape from several paths, with its text area and connection points", () => {
        const tree = new Formatter().format(
            new ShapeRun({
                type: "custom",
                paths: [{ path: "M 0 0 H 100 V 100 H 0 Z" }, { path: "M 0 0 L 100 100", fill: false, line: true }],
                textArea: { left: 0, top: 0, right: 100, bottom: 50 },
                connectionPoints: [{ x: 50, y: 0, side: "top" }],
                transformation: { width: 100, height: 100 },
            }),
        );

        const shape = tree["w:r"][0]["w:drawing"][0]["wp:inline"][5]["a:graphic"][1]["a:graphicData"][1]["wps:wsp"];
        const geometry = shape[1]["wps:spPr"][1]["a:custGeom"];
        expect(geometry[1]["a:gdLst"]).to.have.length(6);
        expect(geometry[3]).to.deep.equal({
            "a:cxnLst": [{ "a:cxn": [{ _attr: { ang: 16200000 } }, { "a:pos": { _attr: { x: "connsiteX0", y: "connsiteY0" } } }] }],
        });
        expect(geometry[4]["a:rect"]._attr.b).to.equal("textAreaBottom");
        expect(geometry[5]["a:pathLst"]).to.have.length(2);
    });

    describe("in the document's styles", () => {
        const contextOf = (document: object): IContext =>
            ({ file: new File({ styles: { default: { document } }, sections: [] }), stack: [] }) as unknown as IContext;
        const inlineOf = (tree: IXmlableObject): readonly IXmlableObject[] => tree["w:r"][0]["w:drawing"][0]["wp:inline"];
        const extentOf = (tree: IXmlableObject): IXmlableObject => inlineOf(tree).find((child) => "wp:extent" in child)!["wp:extent"]._attr;

        it("should size a shape to fit its text when it is written, keeping its drawing id", () => {
            const shape = new ShapeRun({ type: "rectangle", text: "Hello world", transformation: { width: "fitText", height: "fitText" } });
            const plain = new Formatter().format(shape);
            const context = contextOf({ run: { font: "Calibri", size: 32 } });
            const styled = new Formatter().format(shape, context);

            expect(extentOf(styled).cx).to.be.greaterThan(extentOf(plain).cx);
            expect(extentOf(styled).cy).to.be.greaterThan(extentOf(plain).cy);
            const docPr = (tree: IXmlableObject): IXmlableObject => inlineOf(tree).find((child) => "wp:docPr" in child)!;
            expect(docPr(styled)).to.deep.equal(docPr(plain));
            // Writing the document again writes the same drawing
            expect(new Formatter().format(shape, context)).to.deep.equal(styled);
        });

        it("should size a shape to fit its text in the font of the document's theme", () => {
            const shape = new ShapeRun({ type: "rectangle", text: "Hello world", transformation: { width: "fitText", height: 40 } });
            const widthIn = (body: string): number =>
                extentOf(
                    new Formatter().format(shape, {
                        file: new File({
                            theme: { fonts: { body } },
                            styles: { default: { document: { run: { font: { theme: "body" }, size: 24 } } } },
                            sections: [],
                        }),
                        stack: [],
                    } as unknown as IContext),
                ).cx;
            expect(widthIn("Courier New")).to.be.greaterThan(widthIn("Arial"));
        });

        it("should write text without the space the document puts after paragraphs", () => {
            const tree = new Formatter().format(
                new ShapeRun({ type: "rectangle", text: "Hi", transformation: { width: 50, height: 50 } }),
                contextOf({ paragraph: { spacing: { after: 160 } } }),
            );
            const shape = inlineOf(tree).find((child) => "a:graphic" in child)!["a:graphic"][1]["a:graphicData"][1]["wps:wsp"];
            const paragraph = shape[2]["wps:txbx"][0]["w:txbxContent"][0]["w:p"];
            expect(paragraph[0]["w:pPr"][0]).to.deep.equal({ "w:spacing": { _attr: { "w:before": 0, "w:after": 0 } } });
        });

        it("should write the shape laid out when it was created when the document's styles format its text the same way", () => {
            const shape = new ShapeRun({ type: "rectangle", text: "Hello", transformation: { width: "fitText", height: 20 } });
            // The library's default styles only format headings and other paragraphs with styles of their own
            expect(new Formatter().format(shape, contextOf({}))).to.deep.equal(new Formatter().format(shape));
        });

        it("should write shapes whose size doesn't depend on text as they are", () => {
            const shape = new ShapeRun({ type: "rectangle", transformation: { width: 50, height: 50 } });
            expect(new Formatter().format(shape, contextOf({ run: { size: 40 } }))).to.deep.equal(new Formatter().format(shape));
        });
    });

    it("should link the shape, and mark it as decorative", () => {
        const addRelationship = vi.fn();
        const tree = new Formatter().format(
            new ShapeRun({
                type: "rectangle",
                transformation: { width: 200, height: 4 },
                link: "https://example.com",
                decorative: true,
                floating: {
                    horizontalPosition: { align: HorizontalPositionAlign.CENTER },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                },
            }),
            { stack: [], viewWrapper: { Relationships: { addRelationship } } } as unknown as IContext,
        );

        const anchor = tree["w:r"][0]["w:drawing"][0]["wp:anchor"];
        const docProperties = anchor.find((child: object) => "wp:docPr" in child)["wp:docPr"];
        expect(docProperties.map((child: object) => Object.keys(child)[0])).to.deep.equal(["_attr", "a:hlinkClick", "a:extLst"]);
        expect(addRelationship).toHaveBeenCalledWith(
            expect.any(String),
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            "https://example.com",
            "External",
        );
    });
});
