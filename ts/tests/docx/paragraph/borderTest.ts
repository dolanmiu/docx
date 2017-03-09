import { assert } from "chai";
import { ThematicBreak } from "../../../docx/paragraph/border";
import { Utility } from "../../utility";

describe("Border", () => {
    // TODO: Need tests here
});

describe("ThematicBreak", () => {
    let thematicBreak: ThematicBreak;

    beforeEach(() => {
        thematicBreak = new ThematicBreak();
    });

    describe("#constructor()", () => {
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
