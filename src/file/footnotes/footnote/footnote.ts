import { Paragraph } from "file/paragraph";
import { XmlComponent } from "file/xml-components";

import { FootnoteAttributes } from "./footnote-attributes";
import { FootnoteRefRun } from "./run/footnote-ref-run";

export enum FootnoteType {
    SEPERATOR = "separator",
    CONTINUATION_SEPERATOR = "continuationSeparator",
}

export class Footnote extends XmlComponent {
    constructor(id: number, type?: FootnoteType) {
        super("w:footnote");
        this.root.push(
            new FootnoteAttributes({
                type: type,
                id: id,
            }),
        );
    }

    public addParagraph(paragraph: Paragraph): void {
        paragraph.addRunToFront(new FootnoteRefRun());
        this.root.push(paragraph);
    }
}
