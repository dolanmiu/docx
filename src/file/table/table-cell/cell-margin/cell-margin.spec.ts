import { expect } from "chai";

import { Formatter } from "export/formatter";

import { BottomCellMargin, LeftCellMargin, RightCellMargin, TopCellMargin } from "./cell-margin";

describe("TopCellMargin", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargin = new TopCellMargin(1);
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:top": {
                    _attr: {
                        "w:type": "dxa",
                        "w:w": 1,
                    },
                },
            });
        });
    });
});

describe("BottomCellMargin", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargin = new BottomCellMargin(1);
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:bottom": {
                    _attr: {
                        "w:type": "dxa",
                        "w:w": 1,
                    },
                },
            });
        });
    });
});

describe("LeftCellMargin", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargin = new LeftCellMargin(1);
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:start": {
                    _attr: {
                        "w:type": "dxa",
                        "w:w": 1,
                    },
                },
            });
        });
    });
});

describe("RightCellMargin", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargin = new RightCellMargin(1);
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:end": {
                    _attr: {
                        "w:type": "dxa",
                        "w:w": 1,
                    },
                },
            });
        });
    });
});
