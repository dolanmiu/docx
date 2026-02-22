import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createParagraphStyle } from "./style";

describe("ParagraphStyle", () => {
    describe("#createParagraphStyle()", () => {
        it("should create a style with given value", () => {
            const style = createParagraphStyle("test");
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
            const style = createParagraphStyle("");
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
