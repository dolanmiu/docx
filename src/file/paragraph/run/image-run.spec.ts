import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";

import { ImageRun } from "./image-run";

describe("ImageRun", () => {
    describe("#constructor()", () => {
        it("should create with Buffer", () => {
            const currentImageRun = new ImageRun({
                type: "png",
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
                        addImage: vi.fn(),
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
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
                                                id: 1,
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
                                                                                "r:embed":
                                                                                    "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
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
                type: "png",
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
                        addImage: vi.fn(),
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
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
                                                id: 1,
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
                                                                                "r:embed":
                                                                                    "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
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
            vi.spyOn(global, "atob").mockReturnValue("atob result");

            const currentImageRun = new ImageRun({
                type: "png",
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
                        addImage: vi.fn(),
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
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
                                                id: 1,
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
                                                                                "r:embed":
                                                                                    "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
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

        it("should use data as is if its not a string", () => {
            vi.spyOn(global, "atob").mockReturnValue("atob result");

            const currentImageRun = new ImageRun({
                type: "png",
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
                        addImage: vi.fn(),
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
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
                                                id: 1,
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
                                                                                "r:embed":
                                                                                    "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
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

        it("should strip base64 marker", () => {
            const spy = vi.spyOn(global, "atob").mockReturnValue("atob result");

            new ImageRun({
                type: "png",
                data: ";base64,",
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
            });

            expect(spy).toBeCalledWith("");
        });

        it("should work with svgs", () => {
            const currentImageRun = new ImageRun({
                type: "svg",
                data: Buffer.from(""),
                transformation: {
                    width: 200,
                    height: 200,
                },
                fallback: {
                    type: "png",
                    data: Buffer.from(""),
                },
            });

            const tree = new Formatter().format(currentImageRun, {
                file: {
                    Media: {
                        addImage: vi.fn(),
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toStrictEqual({
                "w:r": [
                    {
                        "w:drawing": [
                            {
                                "wp:inline": expect.arrayContaining([
                                    {
                                        "a:graphic": expect.arrayContaining([
                                            {
                                                "a:graphicData": expect.arrayContaining([
                                                    {
                                                        "pic:pic": expect.arrayContaining([
                                                            {
                                                                "pic:blipFill": expect.arrayContaining([
                                                                    {
                                                                        "a:blip": [
                                                                            {
                                                                                _attr: {
                                                                                    cstate: "none",
                                                                                    "r:embed":
                                                                                        "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
                                                                                },
                                                                            },
                                                                            {
                                                                                "a:extLst": [
                                                                                    {
                                                                                        "a:ext": [
                                                                                            {
                                                                                                _attr: {
                                                                                                    uri: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}",
                                                                                                },
                                                                                            },
                                                                                            {
                                                                                                "asvg:svgBlip": {
                                                                                                    _attr: expect.objectContaining({
                                                                                                        "r:embed":
                                                                                                            "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.svg}",
                                                                                                    }),
                                                                                                },
                                                                                            },
                                                                                        ],
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ],
                                                                    },
                                                                ]),
                                                            },
                                                        ]),
                                                    },
                                                ]),
                                            },
                                        ]),
                                    },
                                ]),
                            },
                        ],
                    },
                ],
            });
        });

        it("using same data twice should use same media key", () => {
            const imageRunStringData = new ImageRun({
                type: "png",
                data: "DATA",
                transformation: {
                    width: 100,
                    height: 100,
                    rotation: 42,
                },
            });

            const imageRunBufferData = new ImageRun({
                type: "png",
                data: Buffer.from("DATA"),
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
            });

            const addImageSpy = vi.fn();
            const context = {
                file: {
                    Media: {
                        addImage: addImageSpy,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            };

            new Formatter().format(imageRunStringData, context);
            new Formatter().format(imageRunBufferData, context);

            const expectedHash = "580393f5a94fb469585f5dd2a6859a4aab899f37";

            expect(addImageSpy).toHaveBeenCalledTimes(2);
            expect(addImageSpy).toHaveBeenNthCalledWith(
                1,
                `${expectedHash}.png`,
                expect.objectContaining({ fileName: `${expectedHash}.png` }),
            );
            expect(addImageSpy).toHaveBeenNthCalledWith(
                2,
                `${expectedHash}.png`,
                expect.objectContaining({ fileName: `${expectedHash}.png` }),
            );
        });
    });
});
