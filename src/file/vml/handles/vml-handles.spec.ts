import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlHandle, createVmlHandles } from "./vml-handles";

describe("createVmlHandle", () => {
    it("should emit only the position when no ranges are given", () => {
        const tree = new Formatter().format(createVmlHandle({ position: "#0,bottomRight" }));

        expect(tree).toStrictEqual({ "v:h": { _attr: { position: "#0,bottomRight" } } });
    });

    it("should emit the ranges using the VML attribute names", () => {
        const tree = new Formatter().format(createVmlHandle({ position: "#0,bottomRight", xRange: "6629,14971", yRange: "0,21600" }));

        expect(tree).toStrictEqual({ "v:h": { _attr: { position: "#0,bottomRight", xrange: "6629,14971", yrange: "0,21600" } } });
    });
});

describe("createVmlHandles", () => {
    it("should create one handle per option in order", () => {
        const tree = new Formatter().format(createVmlHandles([{ position: "#0,bottomRight" }, { position: "#1,topLeft" }]));

        expect(tree).toStrictEqual({
            "v:handles": [{ "v:h": { _attr: { position: "#0,bottomRight" } } }, { "v:h": { _attr: { position: "#1,topLeft" } } }],
        });
    });

    it("should create an empty element when there are no handles", () => {
        const tree = new Formatter().format(createVmlHandles([]));

        expect(tree).toStrictEqual({ "v:handles": {} });
    });
});
