import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";

import { createWpsShape } from "./wps-shape";

const transformation = { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 } };

describe("createWpsShape", () => {
    it("should write a text box", () => {
        const tree = new Formatter().format(createWpsShape({ children: [new Paragraph("Hello")], transformation }));

        expect(tree["wps:wsp"][0]).to.deep.equal({ "wps:cNvSpPr": { _attr: { txBox: "1" } } });
        expect(tree["wps:wsp"][1]["wps:spPr"][2]).to.deep.equal({ "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }] });
        expect(tree["wps:wsp"][2]).to.have.property("wps:txbx");
        expect(tree["wps:wsp"][3]).to.deep.equal({ "wps:bodyPr": { _attr: {} } });
    });
});
