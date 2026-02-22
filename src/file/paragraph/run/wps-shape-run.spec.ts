import { describe, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { Paragraph } from "@file/index";

import { WpsShapeRun } from "./wps-shape-run";

describe("WpsShapeRun", () => {
    describe("#constructor()", () => {
        it("should create with Buffer", () => {
            const currentShapeRun = new WpsShapeRun({
                type: "wps",
                children: [new Paragraph("Test Paragraph")],
                transformation: {
                    width: 200,
                    height: 200,
                    rotation: 45,
                },
                solidFill: {
                    type: "rgb",
                    value: "FF0000",
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

            const tree = new Formatter().format(currentShapeRun, {
                file: {
                    Media: {},
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            // eslint-disable-next-line no-console
            console.log(JSON.stringify(tree, null, 2));

            // expect(tree).to.deep.equal({
            //     "w:r": [
            //         {
            //             "w:drawing": [
            //                 {
            //                     "wp:anchor": [
            //                         {
            //                             _attr: {
            //                                 allowOverlap: "1",
            //                                 behindDoc: "0",
            //                                 distB: 0,
            //                                 distL: 0,
            //                                 distR: 0,
            //                                 distT: 0,
            //                                 layoutInCell: "1",
            //                                 locked: "0",
            //                                 relativeHeight: 10,
            //                                 simplePos: "0",
            //                             },
            //                         },
            //                         {
            //                             "wp:simplePos": {
            //                                 _attr: {
            //                                     x: 0,
            //                                     y: 0,
            //                                 },
            //                             },
            //                         },
            //                         {
            //                             "wp:positionH": [
            //                                 {
            //                                     _attr: {
            //                                         relativeFrom: "page",
            //                                     },
            //                                 },
            //                                 {
            //                                     "wp:posOffset": ["1014400"],
            //                                 },
            //                             ],
            //                         },
            //                         {
            //                             "wp:positionV": [
            //                                 {
            //                                     _attr: {
            //                                         relativeFrom: "page",
            //                                     },
            //                                 },
            //                                 {
            //                                     "wp:posOffset": ["1014400"],
            //                                 },
            //                             ],
            //                         },
            //                         {
            //                             "wp:extent": {
            //                                 _attr: {
            //                                     cx: 1905000,
            //                                     cy: 1905000,
            //                                 },
            //                             },
            //                         },
            //                         {
            //                             "wp:effectExtent": {
            //                                 _attr: {
            //                                     b: 0,
            //                                     l: 0,
            //                                     r: 0,
            //                                     t: 0,
            //                                 },
            //                             },
            //                         },
            //                         {
            //                             "wp:wrapNone": {},
            //                         },
            //                         {
            //                             "wp:docPr": {
            //                                 _attr: {
            //                                     descr: "",
            //                                     id: 1,
            //                                     name: "",
            //                                     title: "",
            //                                 },
            //                             },
            //                         },
            //                         {
            //                             "wp:cNvGraphicFramePr": [
            //                                 {
            //                                     "a:graphicFrameLocks": {
            //                                         _attr: {
            //                                             noChangeAspect: 1,
            //                                             "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
            //                                         },
            //                                     },
            //                                 },
            //                             ],
            //                         },
            //                         {
            //                             "a:graphic": [
            //                                 {
            //                                     _attr: {
            //                                         "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
            //                                     },
            //                                 },
            //                                 {
            //                                     "a:graphicData": [
            //                                         {
            //                                             _attr: {
            //                                                 uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            //                                             },
            //                                         },
            //                                         {
            //                                             "pic:pic": [
            //                                                 {
            //                                                     _attr: {
            //                                                         "xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
            //                                                     },
            //                                                 },
            //                                                 {
            //                                                     "pic:nvPicPr": [
            //                                                         {
            //                                                             "pic:cNvPr": {
            //                                                                 _attr: {
            //                                                                     descr: "",
            //                                                                     id: 0,
            //                                                                     name: "",
            //                                                                 },
            //                                                             },
            //                                                         },
            //                                                         {
            //                                                             "pic:cNvPicPr": [
            //                                                                 {
            //                                                                     "a:picLocks": {
            //                                                                         _attr: {
            //                                                                             noChangeArrowheads: 1,
            //                                                                             noChangeAspect: 1,
            //                                                                         },
            //                                                                     },
            //                                                                 },
            //                                                             ],
            //                                                         },
            //                                                     ],
            //                                                 },
            //                                                 {
            //                                                     "pic:blipFill": [
            //                                                         {
            //                                                             "a:blip": {
            //                                                                 _attr: {
            //                                                                     cstate: "none",
            //                                                                     "r:embed":
            //                                                                         "rId{da39a3ee5e6b4b0d3255bfef95601890afd80709.png}",
            //                                                                 },
            //                                                             },
            //                                                         },
            //                                                         {
            //                                                             "a:srcRect": {},
            //                                                         },
            //                                                         {
            //                                                             "a:stretch": [
            //                                                                 {
            //                                                                     "a:fillRect": {},
            //                                                                 },
            //                                                             ],
            //                                                         },
            //                                                     ],
            //                                                 },
            //                                                 {
            //                                                     "pic:spPr": [
            //                                                         {
            //                                                             _attr: {
            //                                                                 bwMode: "auto",
            //                                                             },
            //                                                         },
            //                                                         {
            //                                                             "a:xfrm": [
            //                                                                 {
            //                                                                     _attr: {
            //                                                                         rot: 2700000,
            //                                                                     },
            //                                                                 },
            //                                                                 {
            //                                                                     "a:off": {
            //                                                                         _attr: {
            //                                                                             x: 0,
            //                                                                             y: 0,
            //                                                                         },
            //                                                                     },
            //                                                                 },
            //                                                                 {
            //                                                                     "a:ext": {
            //                                                                         _attr: {
            //                                                                             cx: 1905000,
            //                                                                             cy: 1905000,
            //                                                                         },
            //                                                                     },
            //                                                                 },
            //                                                             ],
            //                                                         },
            //                                                         {
            //                                                             "a:prstGeom": [
            //                                                                 {
            //                                                                     _attr: {
            //                                                                         prst: "rect",
            //                                                                     },
            //                                                                 },
            //                                                                 {
            //                                                                     "a:avLst": {},
            //                                                                 },
            //                                                             ],
            //                                                         },
            //                                                     ],
            //                                                 },
            //                                             ],
            //                                         },
            //                                     ],
            //                                 },
            //                             ],
            //                         },
            //                     ],
            //                 },
            //             ],
            //         },
            //     ],
            // });
        });
    });
});
