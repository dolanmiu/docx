import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlPath } from "./vml-path";

describe("createVmlPath", () => {
    it("should create an empty path when no options are given", () => {
        const tree = new Formatter().format(createVmlPath());

        expect(tree).toStrictEqual({ "v:path": { _attr: {} } });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlPath({
                value: "m0,0l21600,21600e",
                fillOk: true,
                strokeOk: true,
                shadowOk: false,
                arrowOk: false,
                gradientShapeOk: true,
                textPathOk: true,
                extrusionOk: false,
                connectType: "custom",
                connectLocations: "@9,0;@10,10800;@11,21600;@12,10800",
                connectAngles: "270,180,90,0",
            }),
        );

        expect(tree).toStrictEqual({
            "v:path": {
                _attr: {
                    v: "m0,0l21600,21600e",
                    fillok: "t",
                    strokeok: "t",
                    shadowok: "f",
                    arrowok: "f",
                    gradientshapeok: "t",
                    textpathok: "t",
                    "o:extrusionok": "f",
                    "o:connecttype": "custom",
                    "o:connectlocs": "@9,0;@10,10800;@11,21600;@12,10800",
                    "o:connectangles": "270,180,90,0",
                },
            },
        });
    });
});
