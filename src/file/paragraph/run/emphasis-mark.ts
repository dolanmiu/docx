import { Attributes, XmlComponent } from "@file/xml-components";

export enum EmphasisMarkType {
    DOT = "dot",
}

export abstract class BaseEmphasisMark extends XmlComponent {
    protected constructor(emphasisMarkType: EmphasisMarkType) {
        super("w:em");
        this.root.push(
            new Attributes({
                val: emphasisMarkType,
            }),
        );
    }
}

export class EmphasisMark extends BaseEmphasisMark {
    public constructor(emphasisMarkType: EmphasisMarkType = EmphasisMarkType.DOT) {
        super(emphasisMarkType);
    }
}

export class DotEmphasisMark extends BaseEmphasisMark {
    public constructor() {
        super(EmphasisMarkType.DOT);
    }
}
