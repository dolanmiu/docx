import { assert } from "chai";
import * as fs from "fs";

import { Utility } from "../../tests/utility";
import { Drawing } from "./";

describe("Drawing", () => {
    let currentBreak: Drawing;

    beforeEach(() => {
        const path = "./demo/images/image1.jpeg";
        currentBreak = new Drawing({
            fileName: "test.jpg",
            referenceId: 1,
            path: path,
            dimensions: {
                pixels: {
                    x: 100,
                    y: 100,
                },
                emus: {
                    x: 100 * 9525,
                    y: 100 * 9525,
                },
            },
        });
    });

    describe("#constructor()", () => {
        it("should create a Drawing with correct root key", () => {
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:drawing");
            // console.log(JSON.stringify(newJson, null, 2));
        });
    });
});
