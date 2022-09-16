import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Style } from "./style";

describe("ParagraphStyle", () => {
    let style: Style;

    describe("#constructor()", () => {
        it("should create a style with given value", () => {
            style = new Style("test");
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
            style = new Style("");
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
