/**
 * Frame properties module for paragraph text frames in WordprocessingML documents.
 *
 * Frames allow paragraphs to be positioned absolutely on the page, enabling text wrapping
 * and drop cap effects. They are commonly used for floating text boxes and decorative elements.
 *
 * Reference: http://officeopenxml.com/WPparagraph-textFrames.php
 *
 * @module
 */
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";
import { HeightRule } from "@file/table";
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Drop cap types for paragraph frames.
 *
 * Drop caps are decorative large initial letters that span multiple lines at the
 * beginning of a paragraph. This enum defines how the drop cap should be positioned.
 */
export const DropCapType = {
    /** No drop cap effect */
    NONE: "none",
    /** Drop cap that drops down into the paragraph text */
    DROP: "drop",
    /** Drop cap that extends into the margin */
    MARGIN: "margin",
} as const;

/**
 * Frame anchor types specifying what the frame should be anchored relative to.
 *
 * Determines the reference point for frame positioning (horizontal and vertical).
 */
export const FrameAnchorType = {
    /** Anchor relative to the page margin */
    MARGIN: "margin",
    /** Anchor relative to the page edge */
    PAGE: "page",
    /** Anchor relative to the text column */
    TEXT: "text",
} as const;

/**
 * Text wrapping types for frames.
 *
 * Controls how surrounding text wraps around the frame.
 */
export const FrameWrap = {
    /** Wrap text around the frame on all sides */
    AROUND: "around",
    /** Automatic wrapping based on available space */
    AUTO: "auto",
    /** No text wrapping */
    NONE: "none",
    /** Do not allow text beside the frame */
    NOT_BESIDE: "notBeside",
    /** Allow text to flow through the frame */
    THROUGH: "through",
    /** Wrap text tightly around the frame */
    TIGHT: "tight",
} as const;

/**
 * Base options shared by all frame types.
 *
 * @property anchorLock - Lock the anchor position to prevent it from moving
 * @property dropCap - Drop cap effect type
 * @property width - Frame width in twips
 * @property height - Frame height in twips
 * @property wrap - Text wrapping behavior around the frame
 * @property lines - Number of lines for drop cap effect
 * @property anchor - Anchor reference points for horizontal and vertical positioning
 * @property space - Spacing between frame and surrounding text
 * @property rule - Height rule determining how frame height is calculated
 */
type IBaseFrameOptions = {
    /** Lock the anchor position to prevent it from moving */
    readonly anchorLock?: boolean;
    /** Drop cap effect type */
    readonly dropCap?: (typeof DropCapType)[keyof typeof DropCapType];
    /** Frame width in twips */
    readonly width: number;
    /** Frame height in twips */
    readonly height: number;
    /** Text wrapping behavior around the frame */
    readonly wrap?: (typeof FrameWrap)[keyof typeof FrameWrap];
    /** Number of lines for drop cap effect */
    readonly lines?: number;
    /** Anchor reference points for horizontal and vertical positioning */
    readonly anchor: {
        /** Horizontal anchor reference point */
        readonly horizontal: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
        /** Vertical anchor reference point */
        readonly vertical: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    };
    /** Spacing between frame and surrounding text in twips */
    readonly space?: {
        /** Horizontal spacing in twips */
        readonly horizontal: number;
        /** Vertical spacing in twips */
        readonly vertical: number;
    };
    /** Height rule determining how frame height is calculated */
    readonly rule?: (typeof HeightRule)[keyof typeof HeightRule];
};

/**
 * Options for frames positioned using absolute X/Y coordinates.
 *
 * Use this type when you need precise control over frame positioning using
 * specific coordinate values.
 *
 * @property type - Must be "absolute" for coordinate-based positioning
 * @property position - Absolute X and Y coordinates in twips
 */
export type IXYFrameOptions = {
    /** Must be "absolute" for coordinate-based positioning */
    readonly type: "absolute";
    /** Absolute X and Y coordinates in twips */
    readonly position: {
        /** Horizontal position in twips from the anchor point */
        readonly x: number;
        /** Vertical position in twips from the anchor point */
        readonly y: number;
    };
} & IBaseFrameOptions;

/**
 * Options for frames positioned using alignment values.
 *
 * Use this type when you want to position the frame relative to the anchor
 * using standard alignment positions (e.g., left, center, right, top, bottom).
 *
 * @property type - Must be "alignment" for alignment-based positioning
 * @property alignment - Horizontal and vertical alignment values
 */
export type IAlignmentFrameOptions = {
    /** Must be "alignment" for alignment-based positioning */
    readonly type: "alignment";
    /** Horizontal and vertical alignment values */
    readonly alignment: {
        /** Horizontal alignment relative to the anchor */
        readonly x: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
        /** Vertical alignment relative to the anchor */
        readonly y: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    };
} & IBaseFrameOptions;

/**
 * Union type for all frame positioning options.
 *
 * A frame can be positioned using either absolute coordinates (IXYFrameOptions)
 * or alignment values (IAlignmentFrameOptions).
 *
 * Note: Be wary of TypeScript's Open types when using discriminated unions.
 * Reference: https://stackoverflow.com/q/46370222/3481582
 */
export type IFrameOptions = IXYFrameOptions | IAlignmentFrameOptions;

/**
 * Internal attributes type for the frame properties XML element.
 *
 * This type maps the high-level IFrameOptions to the actual XML attributes
 * used in the OOXML format.
 *
 * @property anchorLock - Lock the anchor position
 * @property dropCap - Drop cap effect type
 * @property width - Frame width in twips
 * @property height - Frame height in twips
 * @property x - Absolute horizontal position in twips (for coordinate-based positioning)
 * @property y - Absolute vertical position in twips (for coordinate-based positioning)
 * @property wrap - Text wrapping behavior
 * @property lines - Number of lines for drop cap
 * @property anchorHorizontal - Horizontal anchor reference point
 * @property anchorVertical - Vertical anchor reference point
 * @property spaceHorizontal - Horizontal spacing in twips
 * @property spaceVertical - Vertical spacing in twips
 * @property rule - Height rule
 * @property alignmentX - Horizontal alignment (for alignment-based positioning)
 * @property alignmentY - Vertical alignment (for alignment-based positioning)
 */
type FramePropertiesAttributes = {
    /** Lock the anchor position */
    readonly anchorLock?: boolean;
    /** Drop cap effect type */
    readonly dropCap?: (typeof DropCapType)[keyof typeof DropCapType];
    /** Frame width in twips */
    readonly width: number;
    /** Frame height in twips */
    readonly height: number;
    /** Absolute horizontal position in twips (for coordinate-based positioning) */
    readonly x?: number;
    /** Absolute vertical position in twips (for coordinate-based positioning) */
    readonly y?: number;
    /** Text wrapping behavior */
    readonly wrap?: (typeof FrameWrap)[keyof typeof FrameWrap];
    /** Number of lines for drop cap */
    readonly lines?: number;
    /** Horizontal anchor reference point */
    readonly anchorHorizontal?: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    /** Vertical anchor reference point */
    readonly anchorVertical?: (typeof FrameAnchorType)[keyof typeof FrameAnchorType];
    /** Horizontal spacing in twips */
    readonly spaceHorizontal?: number;
    /** Vertical spacing in twips */
    readonly spaceVertical?: number;
    /** Height rule */
    readonly rule?: (typeof HeightRule)[keyof typeof HeightRule];
    /** Horizontal alignment (for alignment-based positioning) */
    readonly alignmentX?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    /** Vertical alignment (for alignment-based positioning) */
    readonly alignmentY?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
};

/**
 * Creates a frame properties XML component for paragraph text frames.
 *
 * Frames allow paragraphs to be positioned absolutely on the page with text wrapping.
 * They support both coordinate-based and alignment-based positioning, along with
 * drop cap effects and various text wrapping options.
 *
 * Reference: http://officeopenxml.com/WPparagraph-textFrames.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FramePr">
 *   <xsd:attribute name="dropCap" type="ST_DropCap" use="optional"/>
 *   <xsd:attribute name="lines" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="w" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="h" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="vSpace" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="hSpace" type="s:ST_TwipsMeasure" use="optional"/>
 *   <xsd:attribute name="wrap" type="ST_Wrap" use="optional"/>
 *   <xsd:attribute name="hAnchor" type="ST_HAnchor" use="optional"/>
 *   <xsd:attribute name="vAnchor" type="ST_VAnchor" use="optional"/>
 *   <xsd:attribute name="x" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="xAlign" type="s:ST_XAlign" use="optional"/>
 *   <xsd:attribute name="y" type="ST_SignedTwipsMeasure" use="optional"/>
 *   <xsd:attribute name="yAlign" type="s:ST_YAlign" use="optional"/>
 *   <xsd:attribute name="hRule" type="ST_HeightRule" use="optional"/>
 *   <xsd:attribute name="anchorLock" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Frame with absolute positioning
 * createFrameProperties({
 *   type: "absolute",
 *   position: { x: 1440, y: 1440 }, // 1 inch from anchor
 *   width: 2880, // 2 inches
 *   height: 1440, // 1 inch
 *   anchor: {
 *     horizontal: FrameAnchorType.PAGE,
 *     vertical: FrameAnchorType.PAGE,
 *   },
 *   wrap: FrameWrap.AROUND,
 * });
 *
 * // Frame with alignment positioning and drop cap
 * createFrameProperties({
 *   type: "alignment",
 *   alignment: {
 *     x: HorizontalPositionAlign.LEFT,
 *     y: VerticalPositionAlign.TOP,
 *   },
 *   width: 1440,
 *   height: 1440,
 *   anchor: {
 *     horizontal: FrameAnchorType.TEXT,
 *     vertical: FrameAnchorType.TEXT,
 *   },
 *   dropCap: DropCapType.DROP,
 *   lines: 3,
 * });
 * ```
 *
 * @param options - Frame positioning and formatting options
 * @returns XmlComponent representing the frame properties element
 */
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
