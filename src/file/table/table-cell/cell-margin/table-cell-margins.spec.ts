import { expect } from "chai";

import { Formatter } from "export/formatter";

import { TableCellMargin } from "./table-cell-margins";

describe("TableCellMargin", () => {
    describe("#constructor", () => {
        it("should create with default values", () => {
            const cellMargin = new TableCellMargin({});
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:tcMar": [
                    {
                        "w:top": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 0,
                            },
                        },
                    },
                    {
                        "w:bottom": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 0,
                            },
                        },
                    },
                    {
                        "w:end": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 0,
                            },
                        },
                    },
                    {
                        "w:start": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 0,
                            },
                        },
                    },
                ],
            });
        });

        it("should create with values", () => {
            const cellMargin = new TableCellMargin({
                top: 5,
                bottom: 5,
                left: 5,
                right: 5,
            });
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({
                "w:tcMar": [
                    {
                        "w:top": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 5,
                            },
                        },
                    },
                    {
                        "w:bottom": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 5,
                            },
                        },
                    },
                    {
                        "w:end": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 5,
                            },
                        },
                    },
                    {
                        "w:start": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 5,
                            },
                        },
                    },
                ],
            });
        });
    });
});
