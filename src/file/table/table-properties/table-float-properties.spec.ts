import { expect } from "chai";

import { Formatter } from "@export/formatter";

import {
    OverlapType,
    RelativeHorizontalPosition,
    RelativeVerticalPosition,
    TableAnchorType,
    TableFloatProperties,
} from "./table-float-properties";

describe("Table Float Properties", () => {
    describe("#constructor", () => {
        it("should construct a TableFloatProperties with all options", () => {
            const properties = new TableFloatProperties({
                horizontalAnchor: TableAnchorType.MARGIN,
                verticalAnchor: TableAnchorType.PAGE,
                absoluteHorizontalPosition: 10,
                relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
                absoluteVerticalPosition: 20,
                relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
                bottomFromText: 30,
                topFromText: 40,
                leftFromText: 50,
                rightFromText: 60,
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal(DEFAULT_TFP);
        });

        it("should add overlap", () => {
            const properties = new TableFloatProperties({
                overlap: OverlapType.NEVER,
            });
            const tree = new Formatter().format(properties);

            expect(tree).to.deep.equal({
                "w:tblpPr": [
                    {
                        _attr: {
                            overlap: "never",
                        },
                    },
                    {
                        "w:tblOverlap": {
                            _attr: {
                                "w:val": "never",
                            },
                        },
                    },
                ],
            });
        });
    });
});

const DEFAULT_TFP = {
    "w:tblpPr": {
        _attr: {
            "w:horzAnchor": "margin",
            "w:vertAnchor": "page",
            "w:tblpX": 10,
            "w:tblpXSpec": "center",
            "w:tblpY": 20,
            "w:tblpYSpec": "bottom",
            "w:bottomFromText": 30,
            "w:topFromText": 40,
            "w:leftFromText": 50,
            "w:rightFromText": 60,
        },
    },
};
