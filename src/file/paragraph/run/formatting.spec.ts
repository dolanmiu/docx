import { expect } from "chai";

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
    });
});
