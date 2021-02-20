import { expect } from "chai";

import { Formatter } from "export/formatter";

import { ParagraphStyle } from "./paragraph-style";

describe("ParagraphStyle", () => {
    let style: ParagraphStyle;

    describe("#constructor()", () => {
        it("should create a style with given value", () => {
            style = new ParagraphStyle("test");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:pStyle": {
                    _attr: {
                        "w:val": "test",
                    },
                },
            });
        });

        it("should create a style with blank val", () => {
            style = new ParagraphStyle("");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:pStyle": {
                    _attr: {
                        "w:val": "",
                    },
                },
            });
        });
    });
});
