import { assert } from "chai";

import { Utility } from "tests/utility";

import { ThematicBreak } from "./border";

describe("Border", () => {
    // TODO: Need tests here
});

describe("ThematicBreak", () => {
    let thematicBreak: ThematicBreak;

    beforeEach(() => {
        thematicBreak = new ThematicBreak();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(thematicBreak);

            try {
                JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });

        it("should create a Thematic Break with correct border properties", () => {
            const newJson = Utility.jsonify(thematicBreak);
            const attributes = {
                color: "auto",
                space: "1",
                val: "single",
                sz: "6",
            };
            assert.equal(JSON.stringify(newJson.root[0].root[0].root), JSON.stringify(attributes));
        });
    });
});
