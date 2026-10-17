import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { TwoLinesInOneBrackets, createEastAsianLayout } from "./east-asian-layout";

describe("createEastAsianLayout", () => {
    it("should write two lines in one as w:combine", () => {
        const tree = new Formatter().format(createEastAsianLayout({ twoLinesInOne: true }));
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:combine": true } },
        });
    });

    it("should write the brackets around two lines in one as w:combineBrackets", () => {
        const tree = new Formatter().format(createEastAsianLayout({ twoLinesInOne: true, brackets: TwoLinesInOneBrackets.CURLY }));
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:combine": true, "w:combineBrackets": "curly" } },
        });
    });

    it("should write horizontal in vertical fitted to the line as w:vert and w:vertCompress", () => {
        const tree = new Formatter().format(createEastAsianLayout({ horizontalInVertical: true, fitToLine: true }));
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:vert": true, "w:vertCompress": true } },
        });
    });

    it("should write the group as w:id, first as the schema has it", () => {
        const tree = new Formatter().format(createEastAsianLayout({ group: 1, twoLinesInOne: true }));
        expect(Object.keys(tree["w:eastAsianLayout"]._attr)).to.deep.equal(["w:id", "w:combine"]);
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:id": 1, "w:combine": true } },
        });
    });

    it("should write a group of 0", () => {
        const tree = new Formatter().format(createEastAsianLayout({ group: 0, horizontalInVertical: true }));
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:id": 0, "w:vert": true } },
        });
    });

    it("should write false to turn off two lines in one that a style turns on", () => {
        const tree = new Formatter().format(createEastAsianLayout({ twoLinesInOne: false }));
        expect(tree).to.deep.equal({
            "w:eastAsianLayout": { _attr: { "w:combine": false } },
        });
    });

    it("should throw for a group that isn't a number, rather than write it as w:id", () => {
        expect(() => createEastAsianLayout({ group: NaN })).to.throw();
    });

    it("should throw for an infinite group, rather than write it as w:id", () => {
        expect(() => createEastAsianLayout({ group: Infinity })).to.throw();
        expect(() => createEastAsianLayout({ group: -Infinity })).to.throw();
    });
});
