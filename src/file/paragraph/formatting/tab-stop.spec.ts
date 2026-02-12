import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { LeaderType, TabStopType, createTabStop } from "./tab-stop";

describe("LeftTabStop", () => {
    describe("#createTabStop()", () => {
        it("should create a Tab Stop with correct attributes", () => {
            const tabStop = createTabStop([{ type: TabStopType.LEFT, position: 100 }]);
            const tree = new Formatter().format(tabStop);
            expect(tree).to.deep.equal({
                "w:tabs": [
                    {
                        "w:tab": {
                            _attr: {
                                "w:val": "left",
                                "w:pos": 100,
                            },
                        },
                    },
                ],
            });
        });
    });
});

describe("RightTabStop", () => {
    describe("#createTabStop()", () => {
        it("should create a Tab Stop with correct attributes", () => {
            const tabStop = createTabStop([{ type: TabStopType.RIGHT, position: 100, leader: LeaderType.DOT }]);
            const tree = new Formatter().format(tabStop);
            expect(tree).to.deep.equal({
                "w:tabs": [
                    {
                        "w:tab": {
                            _attr: {
                                "w:val": "right",
                                "w:pos": 100,
                                "w:leader": "dot",
                            },
                        },
                    },
                ],
            });
        });
    });
});
