import { IXmlableObject, XmlComponent } from "file/xml-components";
export declare enum BorderStyle {
    SINGLE = "single",
    DASH_DOT_STROKED = "dashDotStroked",
    DASHED = "dashed",
    DASH_SMALL_GAP = "dashSmallGap",
    DOT_DASH = "dotDash",
    DOT_DOT_DASH = "dotDotDash",
    DOTTED = "dotted",
    DOUBLE = "double",
    DOUBLE_WAVE = "doubleWave",
    INSET = "inset",
    NIL = "nil",
    NONE = "none",
    OUTSET = "outset",
    THICK = "thick",
    THICK_THIN_LARGE_GAP = "thickThinLargeGap",
    THICK_THIN_MEDIUM_GAP = "thickThinMediumGap",
    THICK_THIN_SMALL_GAP = "thickThinSmallGap",
    THIN_THICK_LARGE_GAP = "thinThickLargeGap",
    THIN_THICK_MEDIUM_GAP = "thinThickMediumGap",
    THIN_THICK_SMALL_GAP = "thinThickSmallGap",
    THIN_THICK_THIN_LARGE_GAP = "thinThickThinLargeGap",
    THIN_THICK_THIN_MEDIUM_GAP = "thinThickThinMediumGap",
    THIN_THICK_THIN_SMALL_GAP = "thinThickThinSmallGap",
    THREE_D_EMBOSS = "threeDEmboss",
    THREE_D_ENGRAVE = "threeDEngrave",
    TRIPLE = "triple",
    WAVE = "wave"
}
export declare class TableCellBorders extends XmlComponent {
    constructor();
    prepForXml(): IXmlableObject;
    addTopBorder(style: BorderStyle, size: number, color: string): TableCellBorders;
    addStartBorder(style: BorderStyle, size: number, color: string): TableCellBorders;
    addBottomBorder(style: BorderStyle, size: number, color: string): TableCellBorders;
    addEndBorder(style: BorderStyle, size: number, color: string): TableCellBorders;
}
export declare class GridSpan extends XmlComponent {
    constructor(value: number);
}
export declare enum VMergeType {
    CONTINUE = "continue",
    RESTART = "restart"
}
export declare class VMerge extends XmlComponent {
    constructor(value: VMergeType);
}
export declare enum VerticalAlign {
    BOTTOM = "bottom",
    CENTER = "center",
    TOP = "top"
}
export declare class VAlign extends XmlComponent {
    constructor(value: VerticalAlign);
}
export declare enum WidthType {
    AUTO = "auto",
    DXA = "dxa",
    NIL = "nil",
    PERCENTAGE = "pct"
}
export declare class TableCellWidth extends XmlComponent {
    constructor(value: string | number, type: WidthType);
}
