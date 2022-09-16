import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Style } from "./style";

describe("Style", () => {
    describe("#constructor()", () => {
        it("should set the given properties", () => {
            const style = new Style(
                {
                    type: "paragraph",
                    styleId: "myStyleId",
                    default: true,
                },
                {},
            );
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId", "w:default": true } },
            });
        });

        it("should set the name of the style, if given", () => {
            const style = new Style(
                {
                    type: "paragraph",
                    styleId: "myStyleId",
                },
                { name: "Style Name" },
            );
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:name": { _attr: { "w:val": "Style Name" } } },
                ],
            });
        });
    });
});
