// http://officeopenxml.com/WPparagraph-textFrames.php
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";
import { HeightRule } from "@file/table";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

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

interface IBaseFrameOptions {
    readonly anchorLock?: boolean;
    readonly dropCap?: DropCapType;
    readonly width: number;
    readonly height: number;
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
}

export interface IXYFrameOptions extends IBaseFrameOptions {
    readonly position: {
        readonly x: number;
        readonly y: number;
    };
}

export interface IAlignmentFrameOptions extends IBaseFrameOptions {
    readonly alignment: {
        readonly x: HorizontalPositionAlign;
        readonly y: VerticalPositionAlign;
    };
}

// Be wary of Typescript's Open types:
// https://stackoverflow.com/q/46370222/3481582
export type IFrameOptions = IXYFrameOptions | IAlignmentFrameOptions;

export class FramePropertiesAttributes extends XmlAttributeComponent<{
    readonly anchorLock?: boolean;
    readonly dropCap?: DropCapType;
    readonly width: number;
    readonly height: number;
    readonly x?: number;
    readonly y?: number;
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
    public constructor(options: IFrameOptions) {
        super("w:framePr");
        this.root.push(
            new FramePropertiesAttributes({
                anchorLock: options.anchorLock,
                dropCap: options.dropCap,
                width: options.width,
                height: options.height,
                x: (options as IXYFrameOptions).position ? (options as IXYFrameOptions).position.x : undefined,
                y: (options as IXYFrameOptions).position ? (options as IXYFrameOptions).position.y : undefined,
                anchorHorizontal: options.anchor.horizontal,
                anchorVertical: options.anchor.vertical,
                spaceHorizontal: options.space?.horizontal,
                spaceVertical: options.space?.vertical,
                rule: options.rule,
                alignmentX: (options as IAlignmentFrameOptions).alignment ? (options as IAlignmentFrameOptions).alignment.x : undefined,
                alignmentY: (options as IAlignmentFrameOptions).alignment ? (options as IAlignmentFrameOptions).alignment.y : undefined,
                lines: options.lines,
                wrap: options.wrap,
            }),
        );
    }
}
