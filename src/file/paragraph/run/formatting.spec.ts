import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CharacterSpacing, Color } from "./formatting";

describe("CharacterSpacing", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const element = new CharacterSpacing(32);

            const tree = new Formatter().format(element);
            expect(tree).to.deep.equal({
                "w:spacing": {
                    _attr: {
                        "w:val": 32,
                    },
                },
            });
        });
    });
});

describe("Color", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const element = new Color("#FFFFFF");

            const tree = new Formatter().format(element);
            expect(tree).to.deep.equal({
                "w:color": {
                    _attr: {
                        "w:val": "FFFFFF",
                    },
                },
            });
        });

        it("should create a color of the document's theme", () => {
            const tree = new Formatter().format(new Color({ theme: "accent1", lighter: 40 }));
            expect(tree).to.deep.equal({
                "w:color": { _attr: { "w:val": "8EAADB", "w:themeColor": "accent1", "w:themeTint": "99" } },
            });
        });
    });
});
