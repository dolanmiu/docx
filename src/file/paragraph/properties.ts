// http://officeopenxml.com/WPparagraphProperties.php
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "file/xml-components";
import { Border } from "./formatting/border";

export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    public readonly paragraphBorder: Border;

    constructor() {
        super("w:pPr");
        this.paragraphBorder = new Border();
    }

    public createBorder(): void {
        this.push(this.paragraphBorder);
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}
