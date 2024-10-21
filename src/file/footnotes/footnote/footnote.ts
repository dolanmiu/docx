import { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

import { FootnoteAttributes } from "./footnote-attributes";
import { FootnoteRefRun } from "./run/footnote-ref-run";

export const FootnoteType = {
    SEPERATOR: "separator",

    CONTINUATION_SEPERATOR: "continuationSeparator",
} as const;

export type IFootnoteOptions = {
    readonly id: number;
    readonly type?: (typeof FootnoteType)[keyof typeof FootnoteType];
    readonly children: readonly Paragraph[];
};

export class Footnote extends XmlComponent {
    public constructor(options: IFootnoteOptions) {
        super("w:footnote");
        this.root.push(
            new FootnoteAttributes({
                type: options.type,
                id: options.id,
            }),
        );

        for (let i = 0; i < options.children.length; i++) {
            const child = options.children[i];

            if (i === 0) {
                child.addRunToFront(new FootnoteRefRun());
            }

            this.root.push(child);
        }
    }
}
