import { expect } from "chai";

import { Formatter } from "export/formatter";

import { TableCellMargain } from "./table-cell-margains";

describe("TableCellMargain", () => {
    describe("#constructor", () => {
        it("should create with default values", () => {
            const cellMargain = new TableCellMargain({});
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:tcMar": [
                    {
                        "w:top": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 0,
                                },
                            },
                        ],
                    },
                    {
                        "w:bottom": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 0,
                                },
                            },
                        ],
                    },
                    {
                        "w:end": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 0,
                                },
                            },
                        ],
                    },
                    {
                        "w:start": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 0,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should create with values", () => {
            const cellMargain = new TableCellMargain({
                top: 5,
                bottom: 5,
                left: 5,
                right: 5,
            });
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({
                "w:tcMar": [
                    {
                        "w:top": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 5,
                                },
                            },
                        ],
                    },
                    {
                        "w:bottom": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 5,
                                },
                            },
                        ],
                    },
                    {
                        "w:end": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 5,
                                },
                            },
                        ],
                    },
                    {
                        "w:start": [
                            {
                                _attr: {
                                    "w:type": "dxa",
                                    "w:w": 5,
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });
});
