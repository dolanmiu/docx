import { assert } from "chai";

import { Utility } from "tests/utility";

import { HorizontalPositionAlign, HorizontalPositionRelativeFrom } from "./floating-position";
import { HorizontalPosition } from "./horizontal-position";

describe("HorizontalPosition", () => {
    describe("#constructor()", () => {
        it("should create a element with position align", () => {
            const newJson = Utility.jsonify(
                new HorizontalPosition({
                    relative: HorizontalPositionRelativeFrom.MARGIN,
                    align: HorizontalPositionAlign.CENTER,
                }),
            );
            assert.equal(newJson.rootKey, "wp:positionH");
            assert.include(newJson.root[0].root, {
                relativeFrom: "margin",
            });

            assert.equal(newJson.root[1].rootKey, "wp:align");
            assert.include(newJson.root[1].root, "center");
        });

        it("should create a element with offset", () => {
            const newJson = Utility.jsonify(
                new HorizontalPosition({
                    relative: HorizontalPositionRelativeFrom.MARGIN,
                    offset: 40,
                }),
            );
            assert.equal(newJson.rootKey, "wp:positionH");
            assert.include(newJson.root[0].root, {
                relativeFrom: "margin",
            });

            assert.equal(newJson.root[1].rootKey, "wp:posOffset");
            assert.include(newJson.root[1].root[0], 40);
        });
    });
});
