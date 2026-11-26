import { beforeEach, describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";

import { Border, type IBordersOptions, ThematicBreak } from "./border";

describe("Border", () => {
    describe("#constructor", () => {
        it("should write the borders in the schema's order: top, left, bottom, right, between", () => {
            const border = new Border({
                top: {
                    color: "FF0000",
                    space: 1,
                    style: BorderStyle.WAVE,
                    size: 2,
                },
                bottom: {
                    color: "FF0000",
                    space: 3,
                    style: BorderStyle.WAVE,
                    size: 4,
                },
                left: {
                    color: "FF0000",
                    space: 5,
                    style: BorderStyle.WAVE,
                    size: 6,
                },
                right: {
                    color: "FF0000",
                    space: 7,
                    style: BorderStyle.WAVE,
                    size: 8,
                },
                between: {
                    color: "FF0000",
                    space: 9,
                    style: BorderStyle.WAVE,
                    size: 10,
                },
            });

            const tree = new Formatter().format(border);

            expect(tree).to.deep.equal({
                "w:pBdr": [
                    {
                        "w:top": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:space": 1,
                                "w:sz": 2,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:left": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:space": 5,
                                "w:sz": 6,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:bottom": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:space": 3,
                                "w:sz": 4,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:right": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:space": 7,
                                "w:sz": 8,
                                "w:val": "wave",
                            },
                        },
                    },
                    {
                        "w:between": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:space": 9,
                                "w:sz": 10,
                                "w:val": "wave",
                            },
                        },
                    },
                ],
            });
        });

        it("should not add empty borders element if there are no borders defined", () => {
            const tb = new Border({});
            expect(() => new Formatter().format(tb)).to.throw();
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

        it("should write the paragraph's other borders in the same element, in the schema's order, in place of their bottom", () => {
            const red = { style: BorderStyle.SINGLE, size: 12, color: "FF0000", space: 1 } as const;
            // A paragraph's border, with a bottom of its own
            const border: IBordersOptions = {
                between: red,
                right: red,
                bottom: { style: BorderStyle.DOUBLE, size: 18, color: "0000FF", space: 1 },
                left: red,
                top: red,
            };
            const tree = new Formatter().format(new ThematicBreak(border));
            const redSide = { _attr: { "w:val": "single", "w:color": "FF0000", "w:sz": 12, "w:space": 1 } };
            expect(tree).to.deep.equal({
                "w:pBdr": [
                    { "w:top": redSide },
                    { "w:left": redSide },
                    { "w:bottom": { _attr: { "w:val": "single", "w:color": "auto", "w:sz": 6, "w:space": 1 } } },
                    { "w:right": redSide },
                    { "w:between": redSide },
                ],
            });
        });
    });
});
