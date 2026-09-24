import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlFill } from "./vml-fill";

describe("createVmlFill", () => {
    it("should create an empty fill when no options are given", () => {
        const tree = new Formatter().format(createVmlFill());

        expect(tree).toStrictEqual({ "v:fill": { _attr: {} } });
    });

    it("should emit only the opacity for a semi-transparent fill", () => {
        const tree = new Formatter().format(createVmlFill({ opacity: 0.5 }));

        expect(tree).toStrictEqual({ "v:fill": { _attr: { opacity: 0.5 } } });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlFill({ on: true, type: "gradient", color: "silver", color2: "#ff0000", opacity: 0.25, angle: 45 }),
        );

        expect(tree).toStrictEqual({
            "v:fill": { _attr: { on: "t", type: "gradient", color: "silver", color2: "#ff0000", opacity: 0.25, angle: 45 } },
        });
    });
});
