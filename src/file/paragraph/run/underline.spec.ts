import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Underline, UnderlineType } from "./underline";

describe("Underline", () => {
    describe("#constructor()", () => {
        it("should create a new Underline object with u:u as the rootKey", () => {
            const underline = new Underline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": {
                    _attr: {
                        "w:val": "single",
                    },
                },
            });
        });

        it("should default to 'single' and no color", () => {
            const underline = new Underline();
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": { _attr: { "w:val": "single" } },
            });
        });

        it("should use the given style type and color", () => {
            const underline = new Underline(UnderlineType.DOUBLE, "FF00CC");
            const tree = new Formatter().format(underline);
            expect(tree).to.deep.equal({
                "w:u": { _attr: { "w:val": "double", "w:color": "FF00CC" } },
            });
        });
    });
});
