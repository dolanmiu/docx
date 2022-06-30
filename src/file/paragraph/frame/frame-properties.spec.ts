import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared";

import { FrameAnchorType, FrameProperties } from "./frame-properties";

describe("FrameProperties", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const currentFrameProperties = new FrameProperties({
                position: {
                    x: 1000,
                    y: 3000,
                },
                width: 4000,
                height: 1000,
                anchor: {
                    horizontal: FrameAnchorType.MARGIN,
                    vertical: FrameAnchorType.MARGIN,
                },
                alignment: {
                    x: HorizontalPositionAlign.CENTER,
                    y: VerticalPositionAlign.TOP,
                },
            });

            const tree = new Formatter().format(currentFrameProperties);
            expect(tree).to.deep.equal({
                "w:framePr": {
                    _attr: {
                        "w:h": 1000,
                        "w:hAnchor": "margin",
                        "w:vAnchor": "margin",
                        "w:w": 4000,
                        "w:x": 1000,
                        "w:xAlign": "center",
                        "w:y": 3000,
                        "w:yAlign": "top",
                    },
                },
            });
        });

        it("should create with the space attribute", () => {
            const currentFrameProperties = new FrameProperties({
                position: {
                    x: 1000,
                    y: 3000,
                },
                width: 4000,
                height: 1000,
                anchor: {
                    horizontal: FrameAnchorType.MARGIN,
                    vertical: FrameAnchorType.MARGIN,
                },
                alignment: {
                    x: HorizontalPositionAlign.CENTER,
                    y: VerticalPositionAlign.TOP,
                },
                space: {
                    horizontal: 100,
                    vertical: 200,
                },
            });

            const tree = new Formatter().format(currentFrameProperties);
            expect(tree).to.deep.equal({
                "w:framePr": {
                    _attr: {
                        "w:h": 1000,
                        "w:hAnchor": "margin",
                        "w:vAnchor": "margin",
                        "w:w": 4000,
                        "w:x": 1000,
                        "w:xAlign": "center",
                        "w:y": 3000,
                        "w:yAlign": "top",
                        "w:hSpace": 100,
                        "w:vSpace": 200,
                    },
                },
            });
        });

        it("should create without x and y", () => {
            const currentFrameProperties = new FrameProperties({
                width: 4000,
                height: 1000,
                anchor: {
                    horizontal: FrameAnchorType.MARGIN,
                    vertical: FrameAnchorType.MARGIN,
                },
                alignment: {
                    x: HorizontalPositionAlign.CENTER,
                    y: VerticalPositionAlign.TOP,
                },
                space: {
                    horizontal: 100,
                    vertical: 200,
                },
            });

            const tree = new Formatter().format(currentFrameProperties);
            expect(tree).to.deep.equal({
                "w:framePr": {
                    _attr: {
                        "w:h": 1000,
                        "w:hAnchor": "margin",
                        "w:vAnchor": "margin",
                        "w:w": 4000,
                        "w:xAlign": "center",
                        "w:yAlign": "top",
                        "w:hSpace": 100,
                        "w:vSpace": 200,
                    },
                },
            });
        });

        it("should create without alignments", () => {
            const currentFrameProperties = new FrameProperties({
                position: {
                    x: 1000,
                    y: 3000,
                },
                width: 4000,
                height: 1000,
                anchor: {
                    horizontal: FrameAnchorType.MARGIN,
                    vertical: FrameAnchorType.MARGIN,
                },
                space: {
                    horizontal: 100,
                    vertical: 200,
                },
            });

            const tree = new Formatter().format(currentFrameProperties);
            expect(tree).to.deep.equal({
                "w:framePr": {
                    _attr: {
                        "w:h": 1000,
                        "w:hAnchor": "margin",
                        "w:vAnchor": "margin",
                        "w:w": 4000,
                        "w:x": 1000,
                        "w:y": 3000,
                        "w:hSpace": 100,
                        "w:vSpace": 200,
                    },
                },
            });
        });
    });
});
