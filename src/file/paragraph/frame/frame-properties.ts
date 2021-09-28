// http://officeopenxml.com/WPparagraph-textFrames.php
import { HeightRule } from "file";
import { HorizontalPositionAlign, VerticalPositionAlign } from "file/shared/alignment";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum DropCapType {
    NONE = "none",
    DROP = "drop",
    MARGIN = "margin",
}

export enum FrameAnchorType {
    MARGIN = "margin",
    PAGE = "page",
    TEXT = "text",
}

export enum FrameWrap {
    AROUND = "around",
    AUTO = "auto",
    NONE = "none",
    NOT_BESIDE = "notBeside",
    THROUGH = "through",
    TIGHT = "tight",
}

export interface IFrameOptions {
    readonly anchorLock?: boolean;
    readonly dropCap?: DropCapType;
    readonly width: number;
    readonly height: number;
    readonly position: {
        readonly x: number;
        readonly y: number;
    };
    readonly wrap?: FrameWrap;
    readonly lines?: number;
    readonly anchor: {
        readonly horizontal: FrameAnchorType;
        readonly vertical: FrameAnchorType;
    };
    readonly space?: {
        readonly horizontal: number;
        readonly vertical: number;
    };
    readonly rule?: HeightRule;
    readonly alignment: {
        readonly x: HorizontalPositionAlign;
        readonly y: VerticalPositionAlign;
    };
}

export class FramePropertiesAttributes extends XmlAttributeComponent<{
    readonly anchorLock?: boolean;
    readonly dropCap?: DropCapType;
    readonly width: number;
    readonly height: number;
    readonly x: number;
    readonly y: number;
    readonly wrap?: FrameWrap;
    readonly lines?: number;
    readonly anchorHorizontal?: FrameAnchorType;
    readonly anchorVertical?: FrameAnchorType;
    readonly spaceHorizontal?: number;
    readonly spaceVertical?: number;
    readonly rule?: HeightRule;
    readonly alignmentX?: HorizontalPositionAlign;
    readonly alignmentY?: VerticalPositionAlign;
}> {
    protected readonly xmlKeys = {
        anchorLock: "w:anchorLock",
        dropCap: "w:dropCap",
        width: "w:w",
        height: "w:h",
        x: "w:x",
        y: "w:y",
        anchorHorizontal: "w:hAnchor",
        anchorVertical: "w:vAnchor",
        spaceHorizontal: "w:hSpace",
        spaceVertical: "w:vSpace",
        rule: "w:hRule",
        alignmentX: "w:xAlign",
        alignmentY: "w:yAlign",
        lines: "w:lines",
        wrap: "w:wrap",
    };
}

export class FrameProperties extends XmlComponent {
    constructor(options: IFrameOptions) {
        super("w:framePr");
        this.root.push(
            new FramePropertiesAttributes({
                anchorLock: options.anchorLock,
                dropCap: options.dropCap,
                width: options.width,
                height: options.height,
                x: options.position.x,
                y: options.position.y,
                anchorHorizontal: options.anchor.horizontal,
                anchorVertical: options.anchor.vertical,
                spaceHorizontal: options.space?.horizontal,
                spaceVertical: options.space?.vertical,
                rule: options.rule,
                alignmentX: options.alignment.x,
                alignmentY: options.alignment.y,
                lines: options.lines,
                wrap: options.wrap,
            }),
        );
    }
}
