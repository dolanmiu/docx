import { expect } from "chai";

import { Formatter } from "export/formatter";

import { DocumentBackground } from "./document-background";

describe("DocumentBackground", () => {
    describe("#constructor()", () => {
        it("should create a DocumentBackground with no options and set color to auto", () => {
            const documentBackground = new DocumentBackground({});
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {
                        "w:color": "auto",
                    },
                },
            });
        });

        it("should create a DocumentBackground with no options and set color to value", () => {
            const documentBackground = new DocumentBackground({ color: "ffffff" });
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {
                        "w:color": "ffffff",
                    },
                },
            });
        });

        it("should create a DocumentBackground with no options and set other values", () => {
            const documentBackground = new DocumentBackground({
                color: "ffffff",
                themeColor: "test",
                themeShade: "test",
                themeTint: "test",
            });
            const tree = new Formatter().format(documentBackground);
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: {
                        "w:color": "ffffff",
                        "w:themeColor": "test",
                        "w:themeShade": "test",
                        "w:themeTint": "test",
                    },
                },
            });
        });
    });
});
