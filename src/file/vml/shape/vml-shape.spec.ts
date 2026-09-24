import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BuilderElement } from "@file/xml-components";

import { createVmlShape } from "./vml-shape";

describe("createVmlShape", () => {
    it("should create a self-closing shape with only an id when nothing else is given", () => {
        const tree = new Formatter().format(createVmlShape({ id: "shape-1" }));

        expect(tree).toStrictEqual({
            "v:shape": { _attr: { id: "shape-1" } },
        });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlShape({
                id: "shape-1",
                type: "#_x0000_t136",
                style: { position: "absolute", width: "10pt", height: "5pt" },
                coordinateSize: "21600,21600",
                adjustment: "10800",
                path: "m@7,l@8,m@5,21600l@6,21600e",
                presetShapeType: 136,
                allowInCell: false,
                alt: "alt text",
                title: "title text",
                fillColor: "silver",
                filled: true,
                stroked: false,
                strokeColor: "#ff0000",
                strokeWeight: "1pt",
            }),
        );

        expect(tree).toStrictEqual({
            "v:shape": {
                _attr: {
                    id: "shape-1",
                    type: "#_x0000_t136",
                    style: "position:absolute;width:10pt;height:5pt",
                    coordsize: "21600,21600",
                    adj: "10800",
                    path: "m@7,l@8,m@5,21600l@6,21600e",
                    "o:spt": 136,
                    "o:allowincell": "f",
                    alt: "alt text",
                    title: "title text",
                    fillcolor: "silver",
                    filled: "t",
                    stroked: "f",
                    strokecolor: "#ff0000",
                    strokeweight: "1pt",
                },
            },
        });
    });

    it("should nest child elements after the attributes", () => {
        const tree = new Formatter().format(
            createVmlShape({
                id: "shape-1",
                children: [
                    new BuilderElement<{ readonly opacity: number }>({
                        name: "v:fill",
                        attributes: { opacity: { key: "opacity", value: 0.5 } },
                    }),
                ],
            }),
        );

        expect(tree).toStrictEqual({
            "v:shape": [{ _attr: { id: "shape-1" } }, { "v:fill": { _attr: { opacity: 0.5 } } }],
        });
    });
});
