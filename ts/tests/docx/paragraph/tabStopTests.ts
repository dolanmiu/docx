import {LeftTabStop, MaxRightTabStop} from "../../../docx/paragraph/tab-stop";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("LeftTabStop", () => {
    let tabStop: LeftTabStop;

    beforeEach(() => {
        tabStop = new LeftTabStop(100);
    });

    describe("#constructor()", () => {
        it("should create a Tab Stop with correct attributes", () => {
            let newJson = jsonify(tabStop);
            let attributes = {
                val: "left",
                pos: 100
            };
            assert.equal(JSON.stringify(newJson.root[0].root[0].root), JSON.stringify(attributes));
        });

        it("should create a Tab Stop with w:tab", () => {
            let newJson = jsonify(tabStop);
            assert.equal(newJson.root[0].rootKey, "w:tab");
        });
    });
});

describe("RightTabStop", () => {

});

describe.only("MaxRightTabStop", () => {
    let tabStop: MaxRightTabStop;

    beforeEach(() => {
        tabStop = new MaxRightTabStop();
    });

    describe("#constructor()", () => {
        it("should create a Tab Stop with correct attributes", () => {
            let newJson = jsonify(tabStop);

            let attributes = {
                val: "right",
                pos: 9026
            };
            assert.equal(JSON.stringify(newJson.root[0].root[0].root), JSON.stringify(attributes));
        });

        it("should create a Tab Stop with w:tab", () => {
            let newJson = jsonify(tabStop);
            assert.equal(newJson.root[0].rootKey, "w:tab");
        });
    });
});