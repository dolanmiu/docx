import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlStroke } from "./vml-stroke";

describe("createVmlStroke", () => {
    it("should create an empty stroke when no options are given", () => {
        const tree = new Formatter().format(createVmlStroke());

        expect(tree).toStrictEqual({ "v:stroke": { _attr: {} } });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(createVmlStroke({ on: false, weight: "1pt", color: "red", opacity: 0.5, joinStyle: "miter" }));

        expect(tree).toStrictEqual({
            "v:stroke": { _attr: { on: "f", weight: "1pt", color: "red", opacity: 0.5, joinstyle: "miter" } },
        });
    });
});
