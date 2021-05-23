import { expect } from "chai";

import { Formatter } from "export/formatter";

import { BorderStyle } from "file/border";
import { Border, ThematicBreak } from "./border";

describe("Border", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const border = new Border({
                top: {
                    color: "red",
                    space: 1,
                    style: BorderStyle.WAVE,
                    size: 2,
                },
                bottom: {
                    color: "red",
                    space: 3,
                    style: BorderStyle.WAVE,
                    size: 4,
                },
                left: {
                    color: "red",
                    space: 5,
                    style: BorderStyle.WAVE,
                    size: 6,
                },
                right: {
                    color: "red",
                    space: 7,
                    style: BorderStyle.WAVE,
                    size: 8,
                },
            });

            const tree = new Formatter().format(border);

            expect(tree).to.deep.equal({
                "w:pBdr": [
                    {
                        "w:top": {
                            _attr: {
                                "w:color": "red",
                                "w:space": 1,
                                "w:sz": 2,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:bottom": {
                            _attr: {
                                "w:color": "red",
                                "w:space": 3,
                                "w:sz": 4,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:left": {
                            _attr: {
                                "w:color": "red",
                                "w:space": 5,
                                "w:sz": 6,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:right": {
                            _attr: {
                                "w:color": "red",
                                "w:space": 7,
                                "w:sz": 8,
                                "w:val": "wave",
                            },
                        },
                    },
                ],
            });
        });
    });
});

describe("ThematicBreak", () => {
    let thematicBreak: ThematicBreak;

    beforeEach(() => {
        thematicBreak = new ThematicBreak();
    });

    describe("#constructor()", () => {
        it("should create a Thematic Break with correct border properties", () => {
            const tree = new Formatter().format(thematicBreak);
            expect(tree).to.deep.equal({
                "w:pBdr": [
                    {
                        "w:bottom": {
                            _attr: {
                                "w:color": "auto",
                                "w:space": 1,
                                "w:sz": 6,
                                "w:val": "single",
                            },
                        },
                    },
                ],
            });
        });
    });
});
