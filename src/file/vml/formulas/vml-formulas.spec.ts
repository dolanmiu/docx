import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlFormula, createVmlFormulas } from "./vml-formulas";

describe("createVmlFormula", () => {
    it("should store the equation in the eqn attribute", () => {
        const tree = new Formatter().format(createVmlFormula("sum #0 0 10800"));

        expect(tree).toStrictEqual({ "v:f": { _attr: { eqn: "sum #0 0 10800" } } });
    });
});

describe("createVmlFormulas", () => {
    it("should create one formula per equation in order", () => {
        const tree = new Formatter().format(createVmlFormulas(["sum #0 0 10800", "prod #0 2 1"]));

        expect(tree).toStrictEqual({
            "v:formulas": [{ "v:f": { _attr: { eqn: "sum #0 0 10800" } } }, { "v:f": { _attr: { eqn: "prod #0 2 1" } } }],
        });
    });

    it("should create an empty element when there are no equations", () => {
        const tree = new Formatter().format(createVmlFormulas([]));

        expect(tree).toStrictEqual({ "v:formulas": {} });
    });
});
