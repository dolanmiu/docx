import { BuilderElement, XmlComponent } from "@file/xml-components";

export const EmphasisMarkType = {
    DOT: "dot",
} as const;

type IEmphasisMarkAttributes = {
    readonly val: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType];
};

export const createEmphasisMark = (
    emphasisMarkType: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType] = EmphasisMarkType.DOT,
): XmlComponent =>
    new BuilderElement<IEmphasisMarkAttributes>({
        name: "w:em",
        attributes: {
            val: { key: "w:val", value: emphasisMarkType },
        },
    });

export const createDotEmphasisMark = (): XmlComponent => createEmphasisMark(EmphasisMarkType.DOT);
