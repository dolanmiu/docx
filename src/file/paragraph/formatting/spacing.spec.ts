import { expect } from "chai";

import { Formatter } from "export/formatter";

import { ContextualSpacing, Spacing } from "./spacing";

describe("Spacing", () => {
    describe("#constructor", () => {
        it("should set the properties given", () => {
            const spacing = new Spacing({ before: 100, after: 120, line: 150 });
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:spacing": [{ _attr: { "w:after": 120, "w:before": 100, "w:line": 150 } }],
            });
        });

        it("should only set the given properties", () => {
            const spacing = new Spacing({ before: 100 });
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:spacing": [{ _attr: { "w:before": 100 } }],
            });
        });
    });
});

describe("ContextualSpacing", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const spacing = new ContextualSpacing(true);
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:contextualSpacing": [{ _attr: { "w:val": 1 } }],
            });
        });

        it("should create with value of 0 if param is false", () => {
            const spacing = new ContextualSpacing(false);
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:contextualSpacing": [{ _attr: { "w:val": 0 } }],
            });
        });
    });
});
