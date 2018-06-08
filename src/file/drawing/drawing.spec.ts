import { assert } from "chai";
import * as fs from "fs";

import { Utility } from "../../tests/utility";
import { Drawing, DrawingOptions, PlacementPosition } from "./";

function createDrawing(drawingOptions?: DrawingOptions) {
    const path = "./demo/images/image1.jpeg";
    return new Drawing(
        {
            fileName: "test.jpg",
            referenceId: 1,
            stream: fs.createReadStream(path),
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
        },
        drawingOptions,
    );
}

describe("Drawing", () => {
    let currentBreak: Drawing;

    describe("#constructor()", () => {
        it("should create a Drawing with correct root key", () => {
            currentBreak = createDrawing();
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:drawing");
        });

        it("should create a drawing with inline element when there are no options passed", () => {
            currentBreak = createDrawing();
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.root[0].rootKey, "wp:inline");
        });

        it("should create a drawing with anchor element when there options are passed", () => {
            currentBreak = createDrawing({
                position: PlacementPosition.FLOATING,
            });
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.root[0].rootKey, "wp:anchor");
        });
    });
});
