import { assert, expect } from "chai";
import { SinonStub, stub } from "sinon";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { Utility } from "tests/utility";

import { IDrawingOptions } from "../drawing";
import { TextWrappingType } from "../text-wrap";
import { Anchor } from "./anchor";

const createAnchor = (drawingOptions: IDrawingOptions): Anchor =>
    new Anchor(
        {
            fileName: "test.png",
            stream: new Buffer(""),
            transformation: {
                pixels: {
                    x: 0,
                    y: 0,
                },
                emus: {
                    x: 0,
                    y: 0,
                },
            },
        },
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

describe("Anchor", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueNumericId").callsFake(() => 0);
    });

    after(() => {
        (convenienceFunctions.uniqueNumericId as SinonStub).restore();
    });

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

        it("should create a Drawing with a margin", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    margins: {
                        top: 10,
                        left: 10,
                        bottom: 10,
                        right: 10,
                    },
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                distT: 10,
                distB: 10,
                distL: 10,
                distR: 10,
            });
        });

        it("should create a Drawing with a default margin", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    margins: {},
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                distT: 0,
                distB: 0,
                distL: 0,
                distR: 0,
            });
        });

        it("should create a Drawing with allowOverlap being false", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    allowOverlap: false,
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                allowOverlap: "0",
            });
        });

        it("should create a Drawing with behindDocument being true", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    behindDocument: true,
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                behindDoc: "1",
            });
        });

        it("should create a Drawing with locked being true", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    lockAnchor: true,
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                locked: "1",
            });
        });

        it("should create a Drawing with locked being false", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    layoutInCell: false,
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;
            assert.include(anchorAttributes, {
                layoutInCell: "0",
            });
        });

        it("should create a Drawing with a certain z-index", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    zIndex: 120,
                },
            });
            const newJson = Utility.jsonify(anchor);
            const anchorAttributes = newJson.root[0].root;

            assert.include(anchorAttributes, {
                relativeHeight: 120,
            });
        });

        it("should create a Drawing with doc properties", () => {
            anchor = createAnchor({
                floating: {
                    verticalPosition: {
                        offset: 0,
                    },
                    horizontalPosition: {
                        offset: 0,
                    },
                    zIndex: 120,
                },
                docProperties: {
                    name: "test",
                    description: "test",
                    title: "test",
                },
            });
            const tree = new Formatter().format(anchor);
            expect(tree).to.deep.equal({
                "wp:anchor": [
                    {
                        _attr: {
                            allowOverlap: "1",
                            behindDoc: "0",
                            distB: 0,
                            distL: 0,
                            distR: 0,
                            distT: 0,
                            layoutInCell: "1",
                            locked: "0",
                            relativeHeight: 120,
                            simplePos: "0",
                        },
                    },
                    {
                        "wp:simplePos": {
                            _attr: {
                                x: 0,
                                y: 0,
                            },
                        },
                    },
                    {
                        "wp:positionH": [
                            {
                                _attr: {
                                    relativeFrom: "page",
                                },
                            },
                            {
                                "wp:posOffset": ["0"],
                            },
                        ],
                    },
                    {
                        "wp:positionV": [
                            {
                                _attr: {
                                    relativeFrom: "page",
                                },
                            },
                            {
                                "wp:posOffset": ["0"],
                            },
                        ],
                    },
                    {
                        "wp:extent": {
                            _attr: {
                                cx: 952500,
                                cy: 952500,
                            },
                        },
                    },
                    {
                        "wp:effectExtent": {
                            _attr: {
                                b: 0,
                                l: 0,
                                r: 0,
                                t: 0,
                            },
                        },
                    },
                    {
                        "wp:wrapNone": {},
                    },
                    {
                        "wp:docPr": {
                            _attr: {
                                descr: "test",
                                id: 0,
                                name: "test",
                                title: "test",
                            },
                        },
                    },
                    {
                        "wp:cNvGraphicFramePr": [
                            {
                                "a:graphicFrameLocks": {
                                    _attr: {
                                        noChangeAspect: 1,
                                        "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "a:graphic": [
                            {
                                _attr: {
                                    "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                                },
                            },
                            {
                                "a:graphicData": [
                                    {
                                        _attr: {
                                            uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
                                        },
                                    },
                                    {
                                        "pic:pic": [
                                            {
                                                _attr: {
                                                    "xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                                                },
                                            },
                                            {
                                                "pic:nvPicPr": [
                                                    {
                                                        "pic:cNvPr": {
                                                            _attr: {
                                                                descr: "",
                                                                id: 0,
                                                                name: "",
                                                            },
                                                        },
                                                    },
                                                    {
                                                        "pic:cNvPicPr": [
                                                            {
                                                                "a:picLocks": {
                                                                    _attr: {
                                                                        noChangeArrowheads: 1,
                                                                        noChangeAspect: 1,
                                                                    },
                                                                },
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                "pic:blipFill": [
                                                    {
                                                        "a:blip": {
                                                            _attr: {
                                                                cstate: "none",
                                                                "r:embed": "rId{test.png}",
                                                            },
                                                        },
                                                    },
                                                    {
                                                        "a:srcRect": {},
                                                    },
                                                    {
                                                        "a:stretch": [
                                                            {
                                                                "a:fillRect": {},
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                "pic:spPr": [
                                                    {
                                                        _attr: {
                                                            bwMode: "auto",
                                                        },
                                                    },
                                                    {
                                                        "a:xfrm": [
                                                            {
                                                                _attr: {},
                                                            },
                                                            {
                                                                "a:off": {
                                                                    _attr: {
                                                                        x: 0,
                                                                        y: 0,
                                                                    },
                                                                },
                                                            },
                                                            {
                                                                "a:ext": {
                                                                    _attr: {
                                                                        cx: 952500,
                                                                        cy: 952500,
                                                                    },
                                                                },
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        "a:prstGeom": [
                                                            {
                                                                _attr: {
                                                                    prst: "rect",
                                                                },
                                                            },
                                                            {
                                                                "a:avLst": {},
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
