import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createPict } from "./pict";
import { createVmlShape } from "../shape/vml-shape";

describe("createPict", () => {
    it("should wrap VML children in a w:pict element in order", () => {
        const tree = new Formatter().format(
            createPict({
                children: [createVmlShape({ id: "shape-1" }), createVmlShape({ id: "shape-2" })],
            }),
        );

        expect(tree).toStrictEqual({
            "w:pict": [{ "v:shape": { _attr: { id: "shape-1" } } }, { "v:shape": { _attr: { id: "shape-2" } } }],
        });
    });

    it("should create an empty element when there are no children", () => {
        const tree = new Formatter().format(createPict({ children: [] }));

        expect(tree).toStrictEqual({ "w:pict": {} });
    });
});
