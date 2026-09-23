import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createPict } from "./pict";
import { createVmlShape } from "../shape/vml-shape";
import { createVmlShapeType } from "../shape-type/vml-shape-type";

describe("createPict", () => {
    it("should wrap VML children in a w:pict element in order", () => {
        const tree = new Formatter().format(
            createPict({
                children: [createVmlShapeType({ id: "_x0000_t1" }), createVmlShape({ id: "shape-1", type: "#_x0000_t1" })],
            }),
        );

        expect(tree).toStrictEqual({
            "w:pict": [{ "v:shapetype": { _attr: { id: "_x0000_t1" } } }, { "v:shape": { _attr: { id: "shape-1", type: "#_x0000_t1" } } }],
        });
    });

    it("should create an empty element when there are no children", () => {
        const tree = new Formatter().format(createPict({ children: [] }));

        expect(tree).toStrictEqual({ "w:pict": {} });
    });
});
