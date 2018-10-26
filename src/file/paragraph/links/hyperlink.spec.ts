import { assert, expect } from "chai";

import { Formatter } from "export/formatter";
import { Utility } from "tests/utility";

import { Hyperlink } from "./";

describe("Hyperlink", () => {
    let hyperlink: Hyperlink;

    beforeEach(() => {
        hyperlink = new Hyperlink("https://example.com", 0);
    });

    describe("#constructor()", () => {
        it("should create a hyperlink with correct root key", () => {
            const newJson = Utility.jsonify(hyperlink);
            assert.equal(newJson.rootKey, "w:hyperlink");
        });

        it("should create a hyperlink with right attributes", () => {
            const newJson = Utility.jsonify(hyperlink);
            const attributes = {
                history: 1,
                id: "rId1",
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a hyperlink with a run component", () => {
            const tree = new Formatter().format(hyperlink);
            const runJson = {
                "w:r": [
                    { "w:rPr": [{ "w:rStyle": [{ _attr: { "w:val": "Hyperlink" } }] }] },
                    { "w:t": [{ _attr: { "xml:space": "preserve" } }, "https://example.com"] },
                ],
            };
            expect(tree["w:hyperlink"][1]).to.deep.equal(runJson);
        });

        describe("with optional anchor parameter", () => {
            beforeEach(() => {
                hyperlink = new Hyperlink("Anchor Text", 0, "anchor");
            });

            it("should create an internal link with anchor tag", () => {
                const newJson = Utility.jsonify(hyperlink);
                const attributes = {
                    history: 1,
                    anchor: "anchor",
                };
                assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
            });
        });
    });
});
