import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { createLanguageComponent } from "./language";

describe("Language", () => {
    describe("#createLanguageComponent", () => {
        it("should create a language component", () => {
            const tree = new Formatter().format(
                createLanguageComponent({
                    value: "en-US",
                    eastAsia: "zh-CN",
                    bidirectional: "ar-SA",
                }),
            );

            expect(tree).to.deep.equal({
                "w:lang": {
                    _attr: {
                        "w:bidi": "ar-SA",
                        "w:eastAsia": "zh-CN",
                        "w:val": "en-US",
                    },
                },
            });
        });
    });
});
