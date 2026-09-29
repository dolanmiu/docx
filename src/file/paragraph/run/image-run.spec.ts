import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import type { IContext, IXmlableObject } from "@file/xml-components";
import * as convenienceFunctions from "@util/convenience-functions";

import { ImageRun } from "./image-run";
import type { IRunOptions } from "./run";
import { ConcreteHyperlink } from "../links";

describe("ImageRun", () => {
    beforeEach(() => {
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockReturnValue(1);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

        it("should add crop attributes to the source rectangle", () => {
            const currentImageRun = new ImageRun({
                type: "png",
                data: Buffer.from(""),
                transformation: {
                    width: 200,
                    height: 200,
                },
                crop: {
                    left: 10,
                    top: 5,
                    right: 10,
                    bottom: 5,
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
                                                                        "a:srcRect": {
                                                                            _attr: {
                                                                                l: 10000,
                                                                                t: 5000,
                                                                                r: 10000,
                                                                                b: 5000,
                                                                            },
                                                                        },
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

    describe("links and decorative images", () => {
        const format = (imageRun: ImageRun, stack: readonly unknown[] = []) => {
            const addRelationship = vi.fn();
            const tree = new Formatter().format(imageRun, {
                file: { Media: { addImage: vi.fn() } } as unknown as File,
                viewWrapper: { Relationships: { addRelationship } } as unknown as IViewWrapper,
                stack,
            } as unknown as IContext);
            return { tree, addRelationship };
        };
        const docProperties = (tree: IXmlableObject, placement: "wp:inline" | "wp:anchor"): readonly IXmlableObject[] => {
            const run = tree["w:r"].find((child: IXmlableObject) => "w:drawing" in child);
            const drawing = run["w:drawing"][0][placement];
            return drawing.find((child: IXmlableObject) => "wp:docPr" in child)["wp:docPr"];
        };
        const image = { type: "png", data: Buffer.from(""), transformation: { width: 100, height: 100 } } as const;

        it("should open a web address when the image is clicked, through a relationship from the part it is in", () => {
            const { tree, addRelationship } = format(new ImageRun({ ...image, link: "https://example.com" }));

            expect(addRelationship).toHaveBeenCalledOnce();
            const [linkId, type, target, mode] = addRelationship.mock.calls[0];
            expect([type, target, mode]).to.deep.equal([
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                "https://example.com",
                "External",
            ]);
            expect(docProperties(tree, "wp:inline")[1]).to.deep.equal({
                "a:hlinkClick": {
                    _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main", "r:id": `rId${linkId}` },
                },
            });
        });

        it("should mark the image as decorative, so screen readers skip it", () => {
            const { tree, addRelationship } = format(new ImageRun({ ...image, decorative: true }));

            expect(addRelationship).not.toHaveBeenCalled();
            expect(docProperties(tree, "wp:inline")[1]).to.deep.equal({
                "a:extLst": [
                    { _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main" } },
                    {
                        "a:ext": [
                            { _attr: { uri: "{C183D7F6-B498-43B3-948B-1728B52AA6E4}" } },
                            {
                                "adec:decorative": {
                                    _attr: { "xmlns:adec": "http://schemas.microsoft.com/office/drawing/2017/decorative", val: 1 },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should link and mark a floating image, with the link first", () => {
            const { tree } = format(
                new ImageRun({
                    ...image,
                    link: "https://example.com",
                    decorative: true,
                    floating: { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 } },
                }),
            );

            expect(docProperties(tree, "wp:anchor").map((child) => Object.keys(child)[0])).to.deep.equal([
                "_attr",
                "a:hlinkClick",
                "a:extLst",
            ]);
        });

        it("should prefer its own link to a hyperlink it is in", () => {
            const { tree, addRelationship } = format(new ImageRun({ ...image, link: "https://example.com" }), [
                new ConcreteHyperlink([], "outer"),
            ]);

            const [linkId] = addRelationship.mock.calls[0];
            expect(docProperties(tree, "wp:inline")[1]["a:hlinkClick"]._attr["r:id"]).to.equal(`rId${linkId}`);
        });
    });

    it("should wrap the run with w:ins when insertion revision is set", () => {
        const base = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
        });
        const withInsertion = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
            insertion: { id: 7, author: "Firstname Lastname", date: "2026-01-01T12:00:00Z" },
        });

        const context = {
            file: {
                Media: {
                    addImage: vi.fn(),
                },
            } as unknown as File,
            viewWrapper: {} as unknown as IViewWrapper,
            stack: [],
        };

        const baseTree = new Formatter().format(base, context);
        const tree = new Formatter().format(withInsertion, context);

        expect(tree).to.deep.equal({
            "w:ins": [
                {
                    _attr: {
                        "w:author": "Firstname Lastname",
                        "w:date": "2026-01-01T12:00:00Z",
                        "w:id": 7,
                    },
                },
                {
                    "w:r": baseTree["w:r"],
                },
            ],
        });
    });

    it("should wrap the run with w:del when deletion revision is set", () => {
        const base = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
        });
        const withDeletion = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
            deletion: { id: 8, author: "Firstname Lastname", date: "2026-01-01T12:00:00Z" },
        });

        const context = {
            file: {
                Media: {
                    addImage: vi.fn(),
                },
            } as unknown as File,
            viewWrapper: {} as unknown as IViewWrapper,
            stack: [],
        };

        const baseTree = new Formatter().format(base, context);
        const tree = new Formatter().format(withDeletion, context);

        expect(tree).to.deep.equal({
            "w:del": [
                {
                    _attr: {
                        "w:author": "Firstname Lastname",
                        "w:date": "2026-01-01T12:00:00Z",
                        "w:id": 8,
                    },
                },
                {
                    "w:r": baseTree["w:r"],
                },
            ],
        });
    });

    it("should put the run in w:del inside w:ins when the image was inserted and then deleted", () => {
        const base = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
        });
        const withBoth = new ImageRun({
            type: "png",
            data: Buffer.from(""),
            transformation: { width: 100, height: 100 },
            insertion: { id: 7, author: "Firstname Lastname", date: "2026-01-01T12:00:00Z" },
            deletion: { id: 8, author: "Another Author", date: "2026-01-02T12:00:00Z" },
        });

        const context = {
            file: {
                Media: {
                    addImage: vi.fn(),
                },
            } as unknown as File,
            viewWrapper: {} as unknown as IViewWrapper,
            stack: [],
        };

        const baseTree = new Formatter().format(base, context);
        const tree = new Formatter().format(withBoth, context);

        expect(tree).to.deep.equal({
            "w:ins": [
                {
                    _attr: {
                        "w:author": "Firstname Lastname",
                        "w:date": "2026-01-01T12:00:00Z",
                        "w:id": 7,
                    },
                },
                {
                    "w:del": [
                        {
                            _attr: {
                                "w:author": "Another Author",
                                "w:date": "2026-01-02T12:00:00Z",
                                "w:id": 8,
                            },
                        },
                        {
                            "w:r": baseTree["w:r"],
                        },
                    ],
                },
            ],
        });
    });

    describe("run formatting", () => {
        const format = (imageRun: ImageRun, addImage = vi.fn()): IXmlableObject =>
            new Formatter().format(imageRun, {
                file: { Media: { addImage } } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });
        // The w:r of an image, inside the w:ins and w:del of one that is a tracked revision
        const runOf = (tree: IXmlableObject): readonly IXmlableObject[] =>
            "w:r" in tree ? tree["w:r"] : runOf((tree["w:ins"] ?? tree["w:del"])[1]);
        const image = { type: "png", data: Buffer.from(""), transformation: { width: 100, height: 100 } } as const;
        const revision = { id: 1, author: "Firstname Lastname", date: "2026-01-01T12:00:00Z" };
        const tracking = [
            ["an untracked image", {}],
            ["an inserted image", { insertion: revision }],
            ["a deleted image", { deletion: revision }],
            ["an image inserted and then deleted", { insertion: revision, deletion: { ...revision, id: 2 } }],
        ] as const;

        it.each(tracking)("should write the formatting of %s before its drawing", (_, revisions) => {
            const run = runOf(format(new ImageRun({ ...image, ...revisions, run: { noProof: true, position: "2pt" } })));

            expect(run).toEqual([
                { "w:rPr": [{ "w:noProof": {} }, { "w:position": { _attr: { "w:val": "2pt" } } }] },
                { "w:drawing": expect.any(Array) },
            ]);
        });

        it.each(tracking)("should ignore the breaks and text of a TextRun's options given as the formatting of %s", (_, revisions) => {
            // Options shared with a TextRun, which can have breaks and text as well as formatting
            const textRunOptions: IRunOptions = { bold: true, break: 1, text: "Caption" };
            const run = runOf(format(new ImageRun({ ...image, ...revisions, run: textRunOptions })));

            expect(run.map((child) => Object.keys(child)[0])).to.deep.equal(["w:rPr", "w:drawing"]);
        });

        it("should format the run of a floating image", () => {
            const run = runOf(
                format(
                    new ImageRun({
                        ...image,
                        floating: { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 } },
                        run: { position: "-2pt" },
                    }),
                ),
            );

            expect(run).toEqual([
                { "w:rPr": [{ "w:position": { _attr: { "w:val": "-2pt" } } }] },
                { "w:drawing": [{ "wp:anchor": expect.any(Array) }] },
            ]);
        });

        it("should format the run of an SVG image, and still add its fallback", () => {
            const addImage = vi.fn();
            const run = runOf(
                format(
                    new ImageRun({
                        type: "svg",
                        data: Buffer.from("<svg></svg>"),
                        fallback: { type: "png", data: Buffer.from("") },
                        transformation: { width: 100, height: 100 },
                        run: { style: "ImageCharacter" },
                    }),
                    addImage,
                ),
            );

            expect(run[0]).to.deep.equal({ "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "ImageCharacter" } } }] });
            expect(addImage.mock.calls.map(([fileName]) => fileName.split(".")[1])).to.deep.equal(["svg", "png"]);
        });

        it("should write a tracked change to the formatting of an inserted image, inside its w:ins", () => {
            const run = runOf(
                format(
                    new ImageRun({
                        ...image,
                        insertion: revision,
                        run: { position: "2pt", revision: { ...revision, id: 2, position: "0pt" } },
                    }),
                ),
            );

            expect(run[0]["w:rPr"].map((child: IXmlableObject) => Object.keys(child)[0])).to.deep.equal(["w:position", "w:rPrChange"]);
        });
    });

    describe("solid fill", () => {
        // The picture's shape properties, which hold its fill and outline
        const shapePropertiesOf = (imageRun: ImageRun, placement: "wp:inline" | "wp:anchor"): readonly IXmlableObject[] => {
            const tree = new Formatter().format(imageRun, {
                file: { Media: { addImage: vi.fn() } } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });
            const drawing = tree["w:r"][0]["w:drawing"][0][placement];
            const graphicData = drawing.find((child: IXmlableObject) => "a:graphic" in child)["a:graphic"][1]["a:graphicData"];
            const pic = graphicData.find((child: IXmlableObject) => "pic:pic" in child)["pic:pic"];
            return pic.find((child: IXmlableObject) => "pic:spPr" in child)["pic:spPr"];
        };
        const image = { type: "png", data: Buffer.from(""), transformation: { width: 100, height: 100 } } as const;

        it("should fill behind the picture, before its outline", () => {
            const shapeProperties = shapePropertiesOf(
                new ImageRun({
                    ...image,
                    solidFill: { type: "rgb", value: "FF0000" },
                    outline: { type: "solidFill", solidFillType: "rgb", value: "000000" },
                }),
                "wp:inline",
            );

            expect(shapeProperties.map((child) => Object.keys(child)[0])).to.deep.equal([
                "_attr",
                "a:xfrm",
                "a:prstGeom",
                "a:solidFill",
                "a:ln",
            ]);
            expect(shapeProperties[3]).to.deep.equal({ "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }] });
        });

        it("should fill behind a floating picture", () => {
            const shapeProperties = shapePropertiesOf(
                new ImageRun({
                    ...image,
                    solidFill: { type: "rgb", value: "FF0000" },
                    floating: { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 } },
                }),
                "wp:anchor",
            );

            expect(shapeProperties.map((child) => Object.keys(child)[0])).to.include("a:solidFill");
        });
    });

    describe("size", () => {
        // A 5.5 by 3.09375 inch image, given in EMUs instead of pixels
        const emusAsPixels = { width: 5029200, height: 2828925 };

        it("should throw for an inline image too big for Word to open, such as one sized in EMUs instead of pixels", () => {
            expect(() => new ImageRun({ type: "jpg", data: Buffer.from(""), transformation: emusAsPixels })).toThrow(
                "Invalid drawing width 47903130000 EMUs (5029200 pixels)",
            );
        });

        it("should throw for a floating image too big for Word to open", () => {
            expect(
                () =>
                    new ImageRun({
                        type: "jpg",
                        data: Buffer.from(""),
                        transformation: { width: 528, height: 2828925 },
                        floating: { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 } },
                    }),
            ).toThrow("Invalid drawing height 26945510625 EMUs (2828925 pixels)");
        });

        it("should allow the largest image Word opens", () => {
            expect(
                () => new ImageRun({ type: "jpg", data: Buffer.from(""), transformation: { width: 225457, height: 225457 } }),
            ).not.toThrow();
        });
    });
});
