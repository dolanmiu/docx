import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";

import { DocumentBackground, DocumentBackgroundAttributes } from "./document-background";

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

        it("should write a theme color with the hex color it comes to, as Word writes it", () => {
            const tree = new Formatter().format(new DocumentBackground({ color: { theme: "accent1", lighter: 80 } }));
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: { "w:color": "D9E2F3", "w:themeColor": "accent1", "w:themeTint": "33" },
                },
            });
        });

        it("should work out the hex color from the document's theme", () => {
            const file = new File({ theme: { colors: { accent1: "2E7D32" } }, sections: [] });
            const tree = new Formatter().format(new DocumentBackground({ color: { theme: "accent1", darker: 25 } }), {
                file,
                viewWrapper: file.Document,
                stack: [],
            });
            expect(tree).to.deep.equal({
                "w:background": {
                    _attr: { "w:color": "225D25", "w:themeColor": "accent1", "w:themeShade": "BF" },
                },
            });
        });

        it("should keep the order of the attributes", () => {
            const attributes = (options: ConstructorParameters<typeof DocumentBackground>[0]): readonly string[] =>
                Object.keys(
                    (new Formatter().format(new DocumentBackground(options)) as { readonly "w:background": { readonly _attr: object } })[
                        "w:background"
                    ]._attr,
                );
            expect(attributes({ color: "FFFF00", themeTint: "0B", themeShade: "0A", themeColor: "accent1" })).to.deep.equal([
                "w:color",
                "w:themeColor",
                "w:themeShade",
                "w:themeTint",
            ]);
            expect(attributes({ color: { theme: "accent1", lighter: 40 } })).to.deep.equal(["w:color", "w:themeColor", "w:themeTint"]);
        });

        it("should throw when a theme color is given in color and in the older options", () => {
            expect(() => new DocumentBackground({ color: { theme: "accent1" }, themeColor: "accent2" })).to.throw(
                "Invalid background. Expected a theme color in color, or themeColor, themeShade and themeTint, not both",
            );
            expect(() => new DocumentBackground({ color: { theme: "accent1" }, themeShade: "BF" })).to.throw("Invalid background");
            expect(() => new DocumentBackground({ color: { theme: "accent1" }, themeTint: "99" })).to.throw("Invalid background");
        });

        it("should throw for a theme color that isn't valid", () => {
            expect(() => new DocumentBackground({ color: { theme: "text1" as "dark1" } })).to.throw(
                'Invalid theme color "text1". Did you mean "dark1"?',
            );
        });
    });
});

describe("DocumentBackgroundAttributes", () => {
    it("should write the background's attributes", () => {
        const tree = new Formatter().format(
            new DocumentBackgroundAttributes({ color: "FFFF00", themeColor: "accent1", themeShade: "BF", themeTint: "99" }),
        );
        expect(tree).to.deep.equal({
            _attr: { "w:color": "FFFF00", "w:themeColor": "accent1", "w:themeShade": "BF", "w:themeTint": "99" },
        });
    });
});
