import { expect } from "chai";
import { SinonStub, stub } from "sinon";

import { Formatter } from "@export/formatter";
import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import * as convenienceFunctions from "@util/convenience-functions";

import { ImageRun } from "./image-run";

describe("ImageRun", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueId").callsFake(() => "test-unique-id");
        stub(convenienceFunctions, "uniqueNumericId").callsFake(() => 0);
    });

    after(() => {
        (convenienceFunctions.uniqueId as SinonStub).restore();
        (convenienceFunctions.uniqueNumericId as SinonStub).restore();
    });

    describe("#constructor()", () => {
        it("should create with Buffer", () => {
            const currentImageRun = new ImageRun({
                data: Buffer.from(""),
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
                floating: {
                    zIndex: 10,
                    horizontalPosition: {
                        offset: 1014400,
                    },
                    verticalPosition: {
                        offset: 1014400,
                    },
                },
            });

            const tree = new Formatter().format(currentImageRun, {
                file: {
                    Media: {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        addImage: () => {},
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
            });
            expect(tree).to.deep.equal({
                "w:r": [
                    {
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
                                            relativeHeight: 10,
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
                                                "wp:posOffset": ["1014400"],
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
                                                "wp:posOffset": ["1014400"],
                                            },
                                        ],
                                    },
                                    {
                                        "wp:extent": {
                                            _attr: {
                                                cx: 1905000,
                                                cy: 1905000,
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
                                                                                "r:embed": "rId{test-unique-id.png}",
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
                                                                                _attr: {
                                                                                    rot: 2700000,
                                                                                },
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
                                                                                        cx: 1905000,
                                                                                        cy: 1905000,
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
                    },
                ],
            });
        });

        it("should create with string", () => {
            const currentImageRun = new ImageRun({
                data: "",
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
                floating: {
                    zIndex: 10,
                    horizontalPosition: {
                        offset: 1014400,
                    },
                    verticalPosition: {
                        offset: 1014400,
                    },
                },
            });

            const tree = new Formatter().format(currentImageRun, {
                file: {
                    Media: {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        addImage: () => {},
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
            });
            expect(tree).to.deep.equal({
                "w:r": [
                    {
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
                                            relativeHeight: 10,
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
                                                "wp:posOffset": ["1014400"],
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
                                                "wp:posOffset": ["1014400"],
                                            },
                                        ],
                                    },
                                    {
                                        "wp:extent": {
                                            _attr: {
                                                cx: 1905000,
                                                cy: 1905000,
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
                                                                                "r:embed": "rId{test-unique-id.png}",
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
                                                                                _attr: {
                                                                                    rot: 2700000,
                                                                                },
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
                                                                                        cx: 1905000,
                                                                                        cy: 1905000,
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
                    },
                ],
            });
        });

        it("should return UInt8Array if atob is present", () => {
            // eslint-disable-next-line functional/immutable-data
            global.atob = () => "atob result";

            const currentImageRun = new ImageRun({
                data: "",
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
                floating: {
                    zIndex: 10,
                    horizontalPosition: {
                        offset: 1014400,
                    },
                    verticalPosition: {
                        offset: 1014400,
                    },
                },
            });

            const tree = new Formatter().format(currentImageRun, {
                file: {
                    Media: {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        addImage: () => {},
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
            });

            expect(tree).to.deep.equal({
                "w:r": [
                    {
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
                                            relativeHeight: 10,
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
                                                "wp:posOffset": ["1014400"],
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
                                                "wp:posOffset": ["1014400"],
                                            },
                                        ],
                                    },
                                    {
                                        "wp:extent": {
                                            _attr: {
                                                cx: 1905000,
                                                cy: 1905000,
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
                                                                                "r:embed": "rId{test-unique-id.png}",
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
                                                                                _attr: {
                                                                                    rot: 2700000,
                                                                                },
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
                                                                                        cx: 1905000,
                                                                                        cy: 1905000,
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
                    },
                ],
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
            (global as any).atob = undefined;
        });

        it("should use data as is if its not a string", () => {
            // eslint-disable-next-line functional/immutable-data
            global.atob = () => "atob result";

            const currentImageRun = new ImageRun({
                data: "",
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
                floating: {
                    zIndex: 10,
                    horizontalPosition: {
                        offset: 1014400,
                    },
                    verticalPosition: {
                        offset: 1014400,
                    },
                },
            });

            const tree = new Formatter().format(currentImageRun, {
                file: {
                    Media: {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        addImage: () => {},
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
            });

            expect(tree).to.deep.equal({
                "w:r": [
                    {
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
                                            relativeHeight: 10,
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
                                                "wp:posOffset": ["1014400"],
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
                                                "wp:posOffset": ["1014400"],
                                            },
                                        ],
                                    },
                                    {
                                        "wp:extent": {
                                            _attr: {
                                                cx: 1905000,
                                                cy: 1905000,
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
                                                                                "r:embed": "rId{test-unique-id.png}",
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
                                                                                _attr: {
                                                                                    rot: 2700000,
                                                                                },
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
                                                                                        cx: 1905000,
                                                                                        cy: 1905000,
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
                    },
                ],
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
            (global as any).atob = undefined;
        });
    });
});
