import { assert } from "chai";

import { Utility } from "tests/utility";

import { Tab } from "./tab";

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
