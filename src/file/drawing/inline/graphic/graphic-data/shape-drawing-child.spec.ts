import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { File } from "@file/file";
import type { IMediaDataTransformation } from "@file/media";
import type { IContext } from "@file/xml-components";

import { createShapeDrawingChild } from "./shape-drawing-child";

const transformation: IMediaDataTransformation = {
    offset: { pixels: { x: 10, y: 20 }, emus: { x: 95250, y: 190500 } },
    pixels: { x: 100, y: 50 },
    emus: { x: 952500, y: 476250 },
};

const createContext = (addImage = vi.fn()): IContext =>
    ({ file: { Media: { addImage } } as unknown as File, stack: [] }) as unknown as IContext;

describe("createShapeDrawingChild", () => {
    it("should write a shape", () => {
        const tree = new Formatter().format(
            createShapeDrawingChild({ type: "wps", transformation, data: { geometry: { type: "ellipse" } } }, "wpg:wgp"),
        );
        expect(tree["wps:wsp"][1]["wps:spPr"][1]).to.deep.equal({ "a:prstGeom": [{ _attr: { prst: "ellipse" } }, { "a:avLst": {} }] });
    });

    it("should write a picture, adding it to the document", () => {
        const addImage = vi.fn();
        const tree = new Formatter().format(
            createShapeDrawingChild(
                {
                    type: "picture",
                    transformation: { ...transformation, rotation: 5400000 },
                    data: {
                        image: { type: "png", data: Buffer.from("logo") },
                        crop: { top: 10 },
                        line: { color: "FF0000", width: 2 },
                        effects: { softEdges: 1 },
                        nonVisualDrawingProperties: { id: 7, name: "Logo", description: "Our logo" },
                    },
                },
                "wpg:grpSp",
            ),
            createContext(addImage),
        );

        expect(addImage).toHaveBeenCalledTimes(1);
        const picture = tree["pic:pic"];
        expect(picture[0]).to.deep.equal({ _attr: { "xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture" } });
        expect(picture[1]["pic:nvPicPr"][0]).to.deep.equal({ "pic:cNvPr": { _attr: { id: 7, name: "Logo", descr: "Our logo" } } });
        expect(picture[1]["pic:nvPicPr"][1]).to.deep.equal({
            "pic:cNvPicPr": [{ "a:picLocks": { _attr: { noChangeAspect: 1, noChangeArrowheads: 1 } } }],
        });
        expect(Object.keys(picture[2])).to.deep.equal(["pic:blipFill"]);
        expect(picture[2]["pic:blipFill"][2]).to.deep.equal({ "a:srcRect": { _attr: { t: 10000 } } });
        expect(picture[3]["pic:spPr"].map((child: object) => Object.keys(child)[0])).to.deep.equal([
            "a:xfrm",
            "a:prstGeom",
            "a:ln",
            "a:effectLst",
        ]);
        expect(picture[3]["pic:spPr"][0]["a:xfrm"][0]).to.deep.equal({ _attr: { rot: 5400000 } });
    });

    it("should write a picture without a line or effects", () => {
        const tree = new Formatter().format(
            createShapeDrawingChild(
                {
                    type: "picture",
                    transformation,
                    data: { image: { type: "png", data: Buffer.from("logo") }, nonVisualDrawingProperties: { id: 7, name: "Picture 7" } },
                },
                "wpg:grpSp",
            ),
            createContext(),
        );
        expect(tree["pic:pic"][3]["pic:spPr"].map((child: object) => Object.keys(child)[0])).to.deep.equal(["a:xfrm", "a:prstGeom"]);
    });

    it("should write a group with the element it is given, and the groups inside it as wpg:grpSp", () => {
        const inner = {
            type: "group",
            transformation,
            childOffset: { x: 0, y: 0 },
            childExtent: { x: 952500, y: 476250 },
            children: [{ type: "wps", transformation, data: { geometry: { type: "rectangle" } } }],
            nonVisualDrawingProperties: { id: 2, name: "Group 2" },
        } as const;
        const tree = new Formatter().format(
            createShapeDrawingChild({ ...inner, children: [inner], nonVisualDrawingProperties: { id: 1, name: "Group 1" } }, "wpg:wgp"),
        );

        const group = tree["wpg:wgp"];
        expect(group[0]).to.deep.equal({ "wpg:cNvPr": { _attr: { id: 1, name: "Group 1" } } });
        expect(group[2]["wpg:grpSpPr"][0]["a:xfrm"][1]).to.deep.equal({ "a:off": { _attr: { x: 95250, y: 190500 } } });
        expect(Object.keys(group[3])).to.deep.equal(["wpg:grpSp"]);
        expect(Object.keys(group[3]["wpg:grpSp"][3])).to.deep.equal(["wps:wsp"]);
    });
});
