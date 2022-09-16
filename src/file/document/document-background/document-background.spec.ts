import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { DocumentBackground } from "./document-background";

describe("DocumentBackground", () => {
    describe("#constructor()", () => {
        it("should create a DocumentBackground with no options", () => {
            const documentBackground = new DocumentBackground({});
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {},
                },
            });
        });

        it("should create a DocumentBackground with no options and set color to value", () => {
            const documentBackground = new DocumentBackground({ color: "ffff00" });
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {
                        "w:color": "ffff00",
                    },
                },
            });
        });

        it("should create a DocumentBackground with no options and set other values", () => {
            const documentBackground = new DocumentBackground({
                color: "ffff00",
                themeColor: "test",
                themeShade: "0A",
                themeTint: "0B",
            });
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {
                        "w:color": "ffff00",
                        "w:themeColor": "test",
                        "w:themeShade": "0A",
                        "w:themeTint": "0B",
                    },
                },
            });
        });
    });
});
