import { assert } from "chai";

import { Utility } from "tests/utility";

import { IDrawingOptions } from "../drawing";
import { TextWrappingType } from "../text-wrap";
import { Anchor } from "./anchor";

function createAnchor(drawingOptions: IDrawingOptions): Anchor {
    return new Anchor(
        1,
        {
            pixels: {
                x: 100,
                y: 100,
            },
            emus: {
                x: 100 * 9525,
                y: 100 * 9525,
            },
        },
        drawingOptions,
    );
}

describe("Anchor", () => {
    let anchor: Anchor;

    describe("#constructor()", () => {
        it("should create a Drawing with correct root key", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.rootKey, "wp:anchor");
            assert.equal(newJson.root.length, 10);
        });

        it("should create a Drawing with all default options", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.root.length, 10);

            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                distT: 0,
                distB: 0,
                distL: 0,
                distR: 0,
                simplePos: "0",
                allowOverlap: "1",
                behindDoc: "0",
                locked: "0",
                layoutInCell: "1",
                relativeHeight: 952500,
            });

            // 1: simple pos
            assert.equal(newJson.root[1].rootKey, "wp:simplePos");

            // 2: horizontal position
            const horizontalPosition = newJson.root[2];
            assert.equal(horizontalPosition.rootKey, "wp:positionH");
            assert.include(horizontalPosition.root[0].root, {
                relativeFrom: "page",
            });
            assert.equal(horizontalPosition.root[1].rootKey, "wp:posOffset");
            assert.include(horizontalPosition.root[1].root[0], 0);

            // 3: vertical position
            const verticalPosition = newJson.root[3];
            assert.equal(verticalPosition.rootKey, "wp:positionV");
            assert.include(verticalPosition.root[0].root, {
                relativeFrom: "page",
            });
            assert.equal(verticalPosition.root[1].rootKey, "wp:posOffset");
            assert.include(verticalPosition.root[1].root[0], 0);

            // 4: extent
            const extent = newJson.root[4];
            assert.equal(extent.rootKey, "wp:extent");
            assert.include(extent.root[0].root, {
                cx: 952500,
                cy: 952500,
            });

            // 5: effect extent
            const effectExtent = newJson.root[5];
            assert.equal(effectExtent.rootKey, "wp:effectExtent");

            // 6 text wrap: none
            const textWrap = newJson.root[6];
            assert.equal(textWrap.rootKey, "wp:wrapNone");

            // 7: doc properties
            const docProperties = newJson.root[7];
            assert.equal(docProperties.rootKey, "wp:docPr");

            // 8: graphic frame properties
            const graphicFrame = newJson.root[8];
            assert.equal(graphicFrame.rootKey, "wp:cNvGraphicFramePr");

            // 9: graphic
            const graphic = newJson.root[9];
            assert.equal(graphic.rootKey, "a:graphic");
        });

        it("should create a Drawing with square text wrapping", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    wrap: {
                        type: TextWrappingType.SQUARE,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.root.length, 10);

            // 6 text wrap: square
            const textWrap = newJson.root[6];
            assert.equal(textWrap.rootKey, "wp:wrapSquare");
        });

        it("should create a Drawing with no text wrapping", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    wrap: {
                        type: TextWrappingType.NONE,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.root.length, 10);

            const textWrap = newJson.root[6];
            assert.equal(textWrap.rootKey, "wp:wrapNone");
        });

        it("should create a Drawing with tight text wrapping", () => {
            anchor = createAnchor({
                floating: {
                    horizontalPosition: {
                        offset: 0,
                    },
                    verticalPosition: {
                        offset: 0,
                    },
                    wrap: {
                        type: TextWrappingType.TIGHT,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.root.length, 10);

            const textWrap = newJson.root[6];
            assert.equal(textWrap.rootKey, "wp:wrapTight");
        });

        it("should create a Drawing with tight text wrapping", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    wrap: {
                        type: TextWrappingType.TOP_AND_BOTTOM,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            assert.equal(newJson.root.length, 10);

            const textWrap = newJson.root[6];
            assert.equal(textWrap.rootKey, "wp:wrapTopAndBottom");
        });
    });
});
