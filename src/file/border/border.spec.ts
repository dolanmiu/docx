import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";

import { BorderElement } from "./border";

describe("BorderElement", () => {
    describe("#constructor", () => {
        it("should create a simple border element", () => {
            const border = new BorderElement("w:top", {
                style: BorderStyle.SINGLE,
            });
            const tree = new Formatter().format(border);
            expect(tree).to.deep.equal({
                "w:top": {
                    _attr: {
                        "w:val": "single",
                    },
                },
            });
        });
        it("should create a simple border element with a size", () => {
            const border = new BorderElement("w:top", {
                style: BorderStyle.SINGLE,
                size: 22,
            });
            const tree = new Formatter().format(border);
            expect(tree).to.deep.equal({
                "w:top": {
                    _attr: {
                        "w:val": "single",
                        "w:sz": 22,
                    },
                },
            });
        });
        it("should create a simple border element with space", () => {
            const border = new BorderElement("w:top", {
                style: BorderStyle.SINGLE,
                space: 22,
            });
            const tree = new Formatter().format(border);
            expect(tree).to.deep.equal({
                "w:top": {
                    _attr: {
                        "w:val": "single",
                        "w:space": 22,
                    },
                },
            });
        });
    });
});
