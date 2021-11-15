import { XmlComponent } from "../../../file/xml-components";
export declare enum UnderlineType {
    SINGLE = "single",
    WORDS = "words",
    DOUBLE = "double",
    THICK = "thick",
    DOTTED = "dotted",
    DOTTEDHEAVY = "dottedHeavy",
    DASH = "dash",
    DASHEDHEAVY = "dashedHeavy",
    DASHLONG = "dashLong",
    DASHLONGHEAVY = "dashLongHeavy",
    DOTDASH = "dotDash",
    DASHDOTHEAVY = "dashDotHeavy",
    DOTDOTDASH = "dotDotDash",
    DASHDOTDOTHEAVY = "dashDotDotHeavy",
    WAVE = "wave",
    WAVYHEAVY = "wavyHeavy",
    WAVYDOUBLE = "wavyDouble"
}
export declare class Underline extends XmlComponent {
    constructor(underlineType?: UnderlineType, color?: string);
}
