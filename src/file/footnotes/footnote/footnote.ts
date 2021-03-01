import { Paragraph } from "file/paragraph";
import { XmlComponent } from "file/xml-components";

import { FootnoteAttributes } from "./footnote-attributes";
import { FootnoteRefRun } from "./run/footnote-ref-run";

export enum FootnoteType {
    SEPERATOR = "separator",
    CONTINUATION_SEPERATOR = "continuationSeparator",
}

export interface IFootnoteOptions {
    readonly id: number;
    readonly type?: FootnoteType;
}

export class Footnote extends XmlComponent {
    constructor(options: IFootnoteOptions) {
        super("w:footnote");
        this.root.push(
            new FootnoteAttributes({
                type: options.type,
                id: options.id,
            }),
        );
    }

    public add(paragraph: Paragraph): void {
        paragraph.addRunToFront(new FootnoteRefRun());
        this.root.push(paragraph);
    }
}
