import { Paragraph } from "file/paragraph";
import { XmlComponent } from "file/xml-components";

export class StdContent extends XmlComponent {
    constructor() {
        super("w:stdContent");
    }

    public addGeneratedContent(paragraph: Paragraph): void {
        this.root.splice(this.root.length - 1, 0, paragraph);
    }
}
