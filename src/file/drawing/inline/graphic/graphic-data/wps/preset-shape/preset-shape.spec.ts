import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { createPresetShape } from "./preset-shape";
import { VerticalAnchor } from "../body-properties";

const transformation = { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 } };

describe("createPresetShape", () => {
    it("should write a shape without a text box", () => {
        const tree = new Formatter().format(
            createPresetShape({ geometry: { type: "ellipse" }, fill: "FF0000", line: "none", transformation }),
        );

        expect(tree).to.deep.equal({
            "wps:wsp": [
                { "wps:cNvSpPr": {} },
                {
                    "wps:spPr": [
                        {
                            "a:xfrm": [
                                { _attr: {} },
                                { "a:off": { _attr: { x: 0, y: 0 } } },
                                { "a:ext": { _attr: { cx: 952500, cy: 476250 } } },
                            ],
                        },
                        { "a:prstGeom": [{ _attr: { prst: "ellipse" } }, { "a:avLst": {} }] },
                        { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }] },
                        { "a:ln": [{ "a:noFill": {} }] },
                    ],
                },
                { "wps:bodyPr": { _attr: {} } },
            ],
        });
    });

    it("should write lines and connectors with connector properties", () => {
        const tree = new Formatter().format(createPresetShape({ geometry: { type: "straightConnector1" }, transformation }));
        expect(tree["wps:wsp"][0]).to.deep.equal({ "wps:cNvCnPr": {} });
    });

    it("should centre text vertically by default", () => {
        const tree = new Formatter().format(
            createPresetShape({ geometry: { type: "rect" }, children: [new Paragraph("Hello")], transformation }),
        );

        expect(tree["wps:wsp"][2]).to.deep.equal({
            "wps:txbx": [
                {
                    "w:txbxContent": [{ "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Hello"] }] }] }],
                },
            ],
        });
        expect(tree["wps:wsp"][3]).to.deep.equal({ "wps:bodyPr": { _attr: { anchor: "ctr" } } });
    });

    it("should let body properties override the vertical anchor", () => {
        const tree = new Formatter().format(
            createPresetShape({
                geometry: { type: "rect" },
                children: [new Paragraph("Hello")],
                bodyProperties: { verticalAnchor: VerticalAnchor.BOTTOM, margins: { left: 0 } },
                transformation,
            }),
        );

        expect(tree["wps:wsp"][3]).to.deep.equal({ "wps:bodyPr": { _attr: { lIns: 0, anchor: "b" } } });
    });

    it("should write non-visual drawing properties first when given", () => {
        const tree = new Formatter().format(
            createPresetShape({
                geometry: { type: "rect" },
                nonVisualDrawingProperties: { id: 7, name: "Box", description: "A box", title: "Box title" },
                transformation,
            }),
        );

        expect(tree["wps:wsp"][0]).to.deep.equal({
            "wps:cNvPr": { _attr: { id: 7, name: "Box", descr: "A box", title: "Box title" } },
        });
        expect(tree["wps:wsp"][1]).to.deep.equal({ "wps:cNvSpPr": {} });
    });
});
