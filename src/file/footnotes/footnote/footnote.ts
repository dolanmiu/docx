import { XmlComponent } from "file/xml-components";
import { Paragraph } from "../../paragraph";
import { FootnoteAttributes } from "./footnote-attributes";
import { FootnoteRefRun } from "./run/footnote-ref-run";

export class FootNote extends XmlComponent {
    constructor(id: number, type?: string) {
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
