import { assert } from "chai";
import { Tab } from "../../../docx/run/tab";
import { Utility } from "../../utility";

describe("Tab", () => {
    let tab: Tab;

    beforeEach(() => {
        tab = new Tab();
    });

    describe("#constructor()", () => {
        it("should create a Tab with correct root key", () => {
            const newJson = Utility.jsonify(tab);
            assert.equal(newJson.rootKey, "w:tab");
        });
    });
});
