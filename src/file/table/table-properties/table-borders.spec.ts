import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";

import { TABLE_BORDERS_NONE, createTableBorders } from "./table-borders";

describe("TableBorders", () => {
    describe("#constructor", () => {
        describe("default borders", () => {
            it("should add a table cell top border using default width type", () => {
                const tableBorders = createTableBorders({});
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("top border", () => {
            it("should add a table cell top border", () => {
                const tableBorders = createTableBorders({
                    top: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "FF0000",
                    },
                });

                const tree = new Formatter().format(tableBorders);
                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "FF0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("left border", () => {
            it("should add a table cell left border", () => {
                const tableBorders = createTableBorders({
                    left: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "ff0000",
                    },
                });
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "ff0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("bottom border", () => {
            it("should add a table cell bottom border", () => {
                const tableBorders = createTableBorders({
                    bottom: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "ff0000",
                    },
                });
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "ff0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("right border", () => {
            it("should add a table cell right border", () => {
                const tableBorders = createTableBorders({
                    right: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "ff0000",
                    },
                });
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "ff0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("inside horizontal border", () => {
            it("should add a table cell inside horizontal border", () => {
                const tableBorders = createTableBorders({
                    insideHorizontal: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "ff0000",
                    },
                });
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "ff0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("inside vertical border", () => {
            it("should add a table cell inside horizontal border", () => {
                const tableBorders = createTableBorders({
                    insideVertical: {
                        style: BorderStyle.DOUBLE,
                        size: 1,
                        color: "ff0000",
                    },
                });
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 4,
                                    "w:val": "single",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "ff0000",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        },
                    ],
                });
            });
        });

        describe("TABLE_BORDERS_NONE convenience object", () => {
            it("should add no borders", () => {
                const tableBorders = createTableBorders(TABLE_BORDERS_NONE);
                const tree = new Formatter().format(tableBorders);

                expect(tree).to.deep.equal({
                    "w:tblBorders": [
                        {
                            "w:top": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                        {
                            "w:left": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                        {
                            "w:bottom": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                        {
                            "w:right": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                        {
                            "w:insideH": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                        {
                            "w:insideV": {
                                _attr: {
                                    "w:color": "auto",
                                    "w:sz": 0,
                                    "w:val": "none",
                                },
                            },
                        },
                    ],
                });
            });
        });
    });
});
