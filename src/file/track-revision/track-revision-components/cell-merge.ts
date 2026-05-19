import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import type { IChangedAttributesProperties } from "../track-revision";

/**
 * Vertical merge revision types.
 */
export const VerticalMergeRevisionType = {
    /**
     * Cell that is merged with upper one.
     */
    CONTINUE: "cont",
    /**
     * Cell that is starting the vertical merge.
     */
    RESTART: "rest",
} as const;

export type ICellMergeAttributes = IChangedAttributesProperties & {
    readonly verticalMerge?: (typeof VerticalMergeRevisionType)[keyof typeof VerticalMergeRevisionType];
    readonly verticalMergeOriginal?: (typeof VerticalMergeRevisionType)[keyof typeof VerticalMergeRevisionType];
};

export class CellMergeAttributes extends XmlAttributeComponent<ICellMergeAttributes> {
    protected readonly xmlKeys = {
        id: "w:id",
        author: "w:author",
        date: "w:date",
        verticalMerge: "w:vMerge",
        verticalMergeOriginal: "w:vMergeOrig",
    };
}

export class CellMerge extends XmlComponent {
    public constructor(options: ICellMergeAttributes) {
        super("w:cellMerge");

        this.root.push(new CellMergeAttributes(options));
    }
}
