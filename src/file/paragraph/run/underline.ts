import { Attributes, XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

export const UnderlineType = {
    SINGLE: "single",
    WORDS: "words",
    DOUBLE: "double",
    THICK: "thick",
    DOTTED: "dotted",
    DOTTEDHEAVY: "dottedHeavy",
    DASH: "dash",
    DASHEDHEAVY: "dashedHeavy",
    DASHLONG: "dashLong",
    DASHLONGHEAVY: "dashLongHeavy",
    DOTDASH: "dotDash",
    DASHDOTHEAVY: "dashDotHeavy",
    DOTDOTDASH: "dotDotDash",
    DASHDOTDOTHEAVY: "dashDotDotHeavy",
    WAVE: "wave",
    WAVYHEAVY: "wavyHeavy",
    WAVYDOUBLE: "wavyDouble",
    NONE: "none",
} as const;

export class Underline extends XmlComponent {
    public constructor(underlineType: (typeof UnderlineType)[keyof typeof UnderlineType] = UnderlineType.SINGLE, color?: string) {
        super("w:u");
        this.root.push(
            new Attributes({
                val: underlineType,
                color: color === undefined ? undefined : hexColorValue(color),
            }),
        );
    }
}
