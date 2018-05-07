import { assert, expect } from "chai";

import { Formatter } from "../../../export/formatter";
import { Utility } from "../../../tests/utility";
import { Hyperlink } from "./";

describe("Hyperlink", () => {
    let hyperlink: Hyperlink;

    describe("#constructor()", () => {
        it("should create a hyperlink with correct root key", () => {
            hyperlink = new Hyperlink("https://example.com", 0);
            const newJson = Utility.jsonify(hyperlink);
            assert.equal(newJson.rootKey, "w:hyperlink");
        });

        it("should create a hyperlink with right attributes", () => {
            hyperlink = new Hyperlink("https://example.com", 0);
            const newJson = Utility.jsonify(hyperlink);
            const attributes = {
                id: "rId1",
                history: 1,
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a hyperlink with a run component", () => {
            hyperlink = new Hyperlink("https://example.com", 0);
            const tree = new Formatter().format(hyperlink);
            expect(tree["w:hyperlink"][1]).to.deep.equal({
                "w:r": [
                    { "w:rPr": [{ "w:rStyle": [{ _attr: { "w:val": "Hyperlink"} }] }] },
                    { "w:t": [{_attr: {"xml:space": "preserve"}}, "https://example.com"]},
                ]});
        });
    });
});
