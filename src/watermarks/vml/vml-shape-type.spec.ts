import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlFormulas } from "./vml-formulas";
import { createVmlShapeType } from "./vml-shape-type";

describe("createVmlShapeType", () => {
    it("should create a shape type with only an id when nothing else is given", () => {
        const tree = new Formatter().format(createVmlShapeType({ id: "_x0000_t1" }));

        expect(tree).toStrictEqual({
            "v:shapetype": { _attr: { id: "_x0000_t1" } },
        });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlShapeType({
                id: "_x0000_t75",
                coordinateSize: "21600,21600",
                presetShapeType: 75,
                preferRelative: true,
                adjustment: "10800",
                path: "m@4@5l@4@11@9@11@9@5xe",
                filled: false,
                stroked: false,
            }),
        );

        expect(tree).toStrictEqual({
            "v:shapetype": {
                _attr: {
                    id: "_x0000_t75",
                    coordsize: "21600,21600",
                    "o:spt": 75,
                    "o:preferrelative": "t",
                    adj: "10800",
                    path: "m@4@5l@4@11@9@11@9@5xe",
                    filled: "f",
                    stroked: "f",
                },
            },
        });
    });

    it("should nest child elements after the attributes", () => {
        const tree = new Formatter().format(
            createVmlShapeType({
                id: "_x0000_t1",
                children: [createVmlFormulas(["sum #0 0 10800"])],
            }),
        );

        expect(tree).toStrictEqual({
            "v:shapetype": [{ _attr: { id: "_x0000_t1" } }, { "v:formulas": [{ "v:f": { _attr: { eqn: "sum #0 0 10800" } } }] }],
        });
    });
});
