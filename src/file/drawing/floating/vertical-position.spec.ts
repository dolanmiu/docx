import { assert } from "chai";

import { Utility } from "tests/utility";

import { VerticalPositionAlign, VerticalPositionRelativeFrom } from "./floating-position";
import { VerticalPosition } from "./vertical-position";

describe("VerticalPosition", () => {
    describe("#constructor()", () => {
        it("should create a element with position align", () => {
            const newJson = Utility.jsonify(
                new VerticalPosition({
                    relative: VerticalPositionRelativeFrom.MARGIN,
                    align: VerticalPositionAlign.INSIDE,
                }),
            );
            assert.equal(newJson.rootKey, "wp:positionV");
            assert.include(newJson.root[0].root, {
                relativeFrom: "margin",
            });

            assert.equal(newJson.root[1].rootKey, "wp:align");
            assert.include(newJson.root[1].root, "inside");
        });

        it("should create a element with offset", () => {
            const newJson = Utility.jsonify(
                new VerticalPosition({
                    relative: VerticalPositionRelativeFrom.MARGIN,
                    offset: 40,
                }),
            );
            assert.equal(newJson.rootKey, "wp:positionV");
            assert.include(newJson.root[0].root, {
                relativeFrom: "margin",
            });

            assert.equal(newJson.root[1].rootKey, "wp:posOffset");
            assert.include(newJson.root[1].root[0], 40);
        });
    });
});
