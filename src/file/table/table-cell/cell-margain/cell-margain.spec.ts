import { expect } from "chai";

import { Formatter } from "export/formatter";

import { BottomCellMargain, LeftCellMargain, RightCellMargain, TopCellMargain } from "./cell-margain";

describe("TopCellMargain", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargain = new TopCellMargain(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:top": [
                    {
                        _attr: {
                            "w:type": "dxa",
                            "w:w": 1,
                        },
                    },
                ],
            });
        });
    });
});

describe("BottomCellMargain", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargain = new BottomCellMargain(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:bottom": [
                    {
                        _attr: {
                            "w:type": "dxa",
                            "w:w": 1,
                        },
                    },
                ],
            });
        });
    });
});

describe("LeftCellMargain", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargain = new LeftCellMargain(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:start": [
                    {
                        _attr: {
                            "w:type": "dxa",
                            "w:w": 1,
                        },
                    },
                ],
            });
        });
    });
});

describe("RightCellMargain", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cellMargain = new RightCellMargain(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:end": [
                    {
                        _attr: {
                            "w:type": "dxa",
                            "w:w": 1,
                        },
                    },
                ],
            });
        });
    });
});
