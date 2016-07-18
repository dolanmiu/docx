import {Tab} from "../../../docx/run/tab";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Tab", () => {
    let tab: Tab;

    beforeEach(() => {
        tab = new Tab();
    });

    describe("#constructor()", () => {
        it("should create a Tab with correct root key", () => {
            let newJson = jsonify(tab);
            assert.equal(newJson.rootKey, "w:tab");
        });
    });
});