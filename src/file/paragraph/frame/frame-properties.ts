// http://officeopenxml.com/WPparagraph-textFrames.php
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";
import { HeightRule } from "@file/table";
import { BuilderElement, XmlComponent } from "@file/xml-components";

export const DropCapType = {
    NONE: "none",
    DROP: "drop",
    MARGIN: "margin",
} as const;

export const FrameAnchorType = {
    MARGIN: "margin",
    PAGE: "page",
    TEXT: "text",
} as const;

export const FrameWrap = {
    AROUND: "around",
    AUTO: "auto",
    NONE: "none",

    NOT_BESIDE: "notBeside",
    THROUGH: "through",
    TIGHT: "tight",
} as const;

type IBaseFrameOptions = {
    readonly anchorLock?: boolean;
    readonly dropCap?: (typeof DropCapType)[keyof typeof DropCapType];
    readonly width: number;
    readonly height: number;
    readonly wrap?: (typeof FrameWrap)[keyof typeof FrameWrap];
    readonly lines?: number;
    readonly anchor: {
        readonly horizontal: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
        readonly vertical: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    };
    readonly space?: {
        readonly horizontal: number;
        readonly vertical: number;
    };
    readonly rule?: (typeof HeightRule)[keyof typeof HeightRule];
};

export type IXYFrameOptions = {
    readonly type: "absolute";
    readonly position: {
        readonly x: number;
        readonly y: number;
    };
} & IBaseFrameOptions;

export type IAlignmentFrameOptions = {
    readonly type: "alignment";
    readonly alignment: {
        readonly x: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
        readonly y: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    };
} & IBaseFrameOptions;

// Be wary of Typescript's Open types:
// https://stackoverflow.com/q/46370222/3481582
export type IFrameOptions = IXYFrameOptions | IAlignmentFrameOptions;

// <xsd:complexType name="CT_FramePr">
//     <xsd:attribute name="dropCap" type="ST_DropCap" use="optional"/>
//     <xsd:attribute name="lines" type="ST_DecimalNumber" use="optional"/>
//     <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="h" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="vSpace" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="hSpace" type="s:ST_TwipsMeasure" use="optional"/>
//     <xsd:attribute name="wrap" type="ST_Wrap" use="optional"/>
//     <xsd:attribute name="hAnchor" type="ST_HAnchor" use="optional"/>
//     <xsd:attribute name="vAnchor" type="ST_VAnchor" use="optional"/>
//     <xsd:attribute name="x" type="ST_SignedTwipsMeasure" use="optional"/>
//     <xsd:attribute name="xAlign" type="s:ST_XAlign" use="optional"/>
//     <xsd:attribute name="y" type="ST_SignedTwipsMeasure" use="optional"/>
//     <xsd:attribute name="yAlign" type="s:ST_YAlign" use="optional"/>
//     <xsd:attribute name="hRule" type="ST_HeightRule" use="optional"/>
//     <xsd:attribute name="anchorLock" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>
type FramePropertiesAttributes = {
    readonly anchorLock?: boolean;
    readonly dropCap?: (typeof DropCapType)[keyof typeof DropCapType];
    readonly width: number;
    readonly height: number;
    readonly x?: number;
    readonly y?: number;
    readonly wrap?: (typeof FrameWrap)[keyof typeof FrameWrap];
    readonly lines?: number;
    readonly anchorHorizontal?: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    readonly anchorVertical?: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    readonly spaceHorizontal?: number;
    readonly spaceVertical?: number;
    readonly rule?: (typeof HeightRule)[keyof typeof HeightRule];
    readonly alignmentX?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    readonly alignmentY?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
};

export const createFrameProperties = (options: IFrameOptions): XmlComponent =>
    new BuilderElement<FramePropertiesAttributes>({
        name: "w:framePr",
        attributes: {
            anchorLock: {
                key: "w:anchorLock",
                value: options.anchorLock,
            },
            dropCap: {
                key: "w:dropCap",
                value: options.dropCap,
            },
            width: {
                key: "w:w",
                value: options.width,
            },
            height: {
                key: "w:h",
                value: options.height,
            },
            x: {
                key: "w:x",
                value: (options as IXYFrameOptions).position ? (options as IXYFrameOptions).position.x : undefined,
            },
            y: {
                key: "w:y",
                value: (options as IXYFrameOptions).position ? (options as IXYFrameOptions).position.y : undefined,
            },
            anchorHorizontal: {
                key: "w:hAnchor",
                value: options.anchor.horizontal,
            },
            anchorVertical: {
                key: "w:vAnchor",
                value: options.anchor.vertical,
            },
            spaceHorizontal: {
                key: "w:hSpace",
                value: options.space?.horizontal,
            },
            spaceVertical: {
                key: "w:vSpace",
                value: options.space?.vertical,
            },
            rule: {
                key: "w:hRule",
                value: options.rule,
            },
            alignmentX: {
                key: "w:xAlign",
                value: (options as IAlignmentFrameOptions).alignment ? (options as IAlignmentFrameOptions).alignment.x : undefined,
            },
            alignmentY: {
                key: "w:yAlign",
                value: (options as IAlignmentFrameOptions).alignment ? (options as IAlignmentFrameOptions).alignment.y : undefined,
            },
            lines: {
                key: "w:lines",
                value: options.lines,
            },
            wrap: {
                key: "w:wrap",
                value: options.wrap,
            },
        },
    });
