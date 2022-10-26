import { expect } from "chai";
import { SinonStub, stub } from "sinon";

import { Formatter } from "@export/formatter";
import * as convenienceFunctions from "@util/convenience-functions";

import { Drawing, IDrawingOptions } from "./drawing";

const imageBase64Data = `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`;

const createDrawing = (drawingOptions?: IDrawingOptions): Drawing =>
    new Drawing(
        {
            fileName: "test.jpg",
            stream: Buffer.from(imageBase64Data, "base64"),
            transformation: {
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

describe("Drawing", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueNumericId").callsFake(() => 0);
    });

    after(() => {
        (convenienceFunctions.uniqueNumericId as SinonStub).restore();
    });

    let currentBreak: Drawing;

    describe("#constructor()", () => {
        it("should create a drawing with inline element when there are no options passed", () => {
            currentBreak = createDrawing();
            const tree = new Formatter().format(currentBreak);
            expect(tree).to.deep.equal({
                "w:drawing": [
                    {
                        "wp:inline": [
                            {
                                _attr: {
                                    distB: 0,
                                    distL: 0,
                                    distR: 0,
                                    distT: 0,
                                },
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
                                "wp:docPr": {
                                    _attr: {
                                        descr: "",
                                        id: 0,
                                        name: "",
                                        title: "",
                                    },
                                },
                            },
                            {
                                "wp:cNvGraphicFramePr": [
                                    {
                                        "a:graphicFrameLocks": {
                                            _attr: {
                                                // tslint:disable-next-line:object-literal-key-quotes
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
                                                                        // tslint:disable-next-line:object-literal-key-quotes
                                                                        cstate: "none",
                                                                        "r:embed": "rId{test.jpg}",
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
                    },
                ],
            });
        });

        it("should create a drawing with anchor element when there options are passed", () => {
            currentBreak = createDrawing({
                floating: {
                    horizontalPosition: {
                        offset: 0,
                    },
                    verticalPosition: {
                        offset: 0,
                    },
                },
            });
            const tree = new Formatter().format(currentBreak);
            expect(tree).to.deep.equal({
                "w:drawing": [
                    {
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
                                    relativeHeight: 952500,
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
                                        descr: "",
                                        id: 0,
                                        name: "",
                                        title: "",
                                    },
                                },
                            },
                            {
                                "wp:cNvGraphicFramePr": [
                                    {
                                        "a:graphicFrameLocks": {
                                            _attr: {
                                                // tslint:disable-next-line:object-literal-key-quotes
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
                                                                        // tslint:disable-next-line:object-literal-key-quotes
                                                                        cstate: "none",
                                                                        "r:embed": "rId{test.jpg}",
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
                    },
                ],
            });
        });
    });
});
