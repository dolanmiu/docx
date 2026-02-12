import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { CellMerge, VerticalMergeRevisionType } from "./cell-merge";

describe("CellMerge", () => {
    describe("#constructor()", () => {
        it("creates with vMerge attribute", () => {
            const tree = new Formatter().format(
                new CellMerge({
                    id: 1,
                    date: "123",
                    author: "Firstname Lastname",
                    verticalMerge: VerticalMergeRevisionType.CONTINUE,
                }),
            );
            expect(tree).to.deep.equal({
                "w:cellMerge": {
                    _attr: {
                        "w:author": "Firstname Lastname",
                        "w:date": "123",
                        "w:id": 1,
                        "w:vMerge": "cont",
                    },
                },
            });
        });

        it("creates with vMergeOrig attribute", () => {
            const tree = new Formatter().format(
                new CellMerge({
                    id: 1,
                    date: "123",
                    author: "Firstname Lastname",
                    verticalMergeOriginal: VerticalMergeRevisionType.RESTART,
                }),
            );
            expect(tree).to.deep.equal({
                "w:cellMerge": {
                    _attr: {
                        "w:author": "Firstname Lastname",
                        "w:date": "123",
                        "w:id": 1,
                        "w:vMergeOrig": "rest",
                    },
                },
            });
        });
    });
});
