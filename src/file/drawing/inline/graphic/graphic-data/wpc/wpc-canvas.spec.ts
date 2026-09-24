import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BuilderElement } from "@file/xml-components";

import { createWpcCanvas } from "./wpc-canvas";

describe("createWpcCanvas", () => {
    it("should write an empty background and outline before the shapes", () => {
        const tree = new Formatter().format(createWpcCanvas({ children: [new BuilderElement({ name: "wps:wsp" })] }));

        expect(tree).to.deep.equal({ "wpc:wpc": [{ "wpc:bg": {} }, { "wpc:whole": {} }, { "wps:wsp": {} }] });
    });

    it("should write the background fill and the outline", () => {
        const tree = new Formatter().format(createWpcCanvas({ children: [], fill: "F2F2F2", line: { color: "BFBFBF", width: 0.5 } }));

        expect(tree).to.deep.equal({
            "wpc:wpc": [
                { "wpc:bg": [{ "a:solidFill": [{ "a:srgbClr": { _attr: { val: "F2F2F2" } } }] }] },
                {
                    "wpc:whole": [{ "a:ln": [{ _attr: { w: 6350 } }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "BFBFBF" } } }] }] }],
                },
            ],
        });
    });
});
