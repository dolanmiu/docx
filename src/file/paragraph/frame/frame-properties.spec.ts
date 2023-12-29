import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared";

import { FrameAnchorType, createFrameProperties } from "./frame-properties";

describe("createFrameProperties", () => {
    it("should create", () => {
        const currentFrameProperties = createFrameProperties({
            type: "absolute",
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
                },
            },
        });
    });

    it("should create with the space attribute", () => {
        const currentFrameProperties = createFrameProperties({
            type: "absolute",
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

    it("should create without x and y", () => {
        const currentFrameProperties = createFrameProperties({
            type: "alignment",
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
        const currentFrameProperties = createFrameProperties({
            type: "absolute",
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
