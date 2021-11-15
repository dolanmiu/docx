import { XmlComponent } from "../../file/xml-components";
export interface IBorderOptions {
    readonly style: BorderStyle;
    readonly color?: string;
    readonly size?: number;
    readonly space?: number;
}
export declare class BorderElement extends XmlComponent {
    constructor(elementName: string, { color, size, space, style }: IBorderOptions);
}
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
