// tslint:disable:object-literal-key-quotes
import { assert, expect } from "chai";

import { Formatter } from "export/formatter";

import { ImageParagraph } from "./image";

describe("Image", () => {
    let image: ImageParagraph;

    beforeEach(() => {
        image = new ImageParagraph({
            referenceId: 0,
            stream: new Buffer(""),
            path: "",
            fileName: "",
            dimensions: {
                pixels: {
                    x: 10,
                    y: 10,
                },
                emus: {
                    x: 10,
                    y: 10,
                },
            },
        });
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(image);

            try {
                JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });

    describe("#scale()", () => {
        it("should set the scale of the object properly", () => {
            image.scale(2);
            const tree = new Formatter().format(image);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [],
                    },
                    {
                        "w:r": [
                            {
                                "w:rPr": [],
                            },
                            {
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
                                                "wp:extent": [
                                                    {
                                                        _attr: {
                                                            cx: 20,
                                                            cy: 20,
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "wp:effectExtent": [
                                                    {
                                                        _attr: {
                                                            b: 0,
                                                            l: 0,
                                                            r: 0,
                                                            t: 0,
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "wp:docPr": [
                                                    {
                                                        _attr: {
                                                            descr: "",
                                                            id: 0,
                                                            name: "",
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                "wp:cNvGraphicFramePr": [
                                                    {
                                                        "a:graphicFrameLocks": [
                                                            {
                                                                _attr: {
                                                                    noChangeAspect: 1,
                                                                    "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                                                                },
                                                            },
                                                        ],
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
                                                                            "xmlns:pic":
                                                                                "http://schemas.openxmlformats.org/drawingml/2006/picture",
                                                                        },
                                                                    },
                                                                    {
                                                                        "pic:nvPicPr": [
                                                                            {
                                                                                "pic:cNvPr": [
                                                                                    {
                                                                                        _attr: {
                                                                                            desc: "",
                                                                                            id: 0,
                                                                                            name: "",
                                                                                        },
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                "pic:cNvPicPr": [
                                                                                    {
                                                                                        "a:picLocks": [
                                                                                            {
                                                                                                _attr: {
                                                                                                    noChangeArrowheads: 1,
                                                                                                    noChangeAspect: 1,
                                                                                                },
                                                                                            },
                                                                                        ],
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ],
                                                                    },
                                                                    {
                                                                        "pic:blipFill": [
                                                                            {
                                                                                "a:blip": [
                                                                                    {
                                                                                        _attr: {
                                                                                            cstate: "none",
                                                                                            "r:embed": "rId0",
                                                                                        },
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                "a:srcRect": [],
                                                                            },
                                                                            {
                                                                                "a:stretch": [
                                                                                    {
                                                                                        "a:fillRect": [],
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
                                                                                        "a:ext": [
                                                                                            {
                                                                                                _attr: {
                                                                                                    cx: 10,
                                                                                                    cy: 10,
                                                                                                },
                                                                                            },
                                                                                        ],
                                                                                    },
                                                                                    {
                                                                                        "a:off": [
                                                                                            {
                                                                                                _attr: {
                                                                                                    x: 0,
                                                                                                    y: 0,
                                                                                                },
                                                                                            },
                                                                                        ],
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
                                                                                        "a:avLst": [],
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
                            },
                        ],
                    },
                ],
            });
        });
    });
});
