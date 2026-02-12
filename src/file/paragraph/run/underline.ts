import { BuilderElement, XmlComponent } from "@file/xml-components";
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

type IUnderlineAttributes = {
    readonly val: (typeof UnderlineType)[keyof typeof UnderlineType];
    readonly color?: string;
};

export const createUnderline = (
    underlineType: (typeof UnderlineType)[keyof typeof UnderlineType] = UnderlineType.SINGLE,
    color?: string,
): XmlComponent =>
    new BuilderElement<IUnderlineAttributes>({
        name: "w:u",
        attributes: {
            val: { key: "w:val", value: underlineType },
            color: { key: "w:color", value: color === undefined ? undefined : hexColorValue(color) },
        },
    });
