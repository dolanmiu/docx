import { Attributes, XmlComponent } from "@file/xml-components";

export const EmphasisMarkType = {
    DOT: "dot",
} as const;

export abstract class BaseEmphasisMark extends XmlComponent {
    protected constructor(emphasisMarkType: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType]) {
        super("w:em");
        this.root.push(
            new Attributes({
                val: emphasisMarkType,
            }),
        );
    }
}

export class EmphasisMark extends BaseEmphasisMark {
    public constructor(emphasisMarkType: (typeof EmphasisMarkType)[keyof typeof EmphasisMarkType] = EmphasisMarkType.DOT) {
        super(emphasisMarkType);
    }
}

export class DotEmphasisMark extends BaseEmphasisMark {
    public constructor() {
        super(EmphasisMarkType.DOT);
    }
}
