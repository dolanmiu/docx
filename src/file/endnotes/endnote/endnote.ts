import type { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

import { EndnoteAttributes } from "./endnote-attributes";
import { EndnoteRefRun } from "./run/endnote-ref-run";

export const EndnoteType = {
    SEPARATOR: "separator",

    CONTINUATION_SEPARATOR: "continuationSeparator",
} as const;

export type IEndnoteOptions = {
    readonly id: number;
    readonly type?: (typeof EndnoteType)[keyof typeof EndnoteType];
    readonly children: readonly Paragraph[];
};

export class Endnote extends XmlComponent {
    public constructor(options: IEndnoteOptions) {
        super("w:endnote");
        this.root.push(
            new EndnoteAttributes({
                type: options.type,
                id: options.id,
            }),
        );

        for (let i = 0; i < options.children.length; i++) {
            const child = options.children[i];

            if (i === 0) {
                child.addRunToFront(new EndnoteRefRun());
            }

            this.root.push(child);
        }
    }
}
