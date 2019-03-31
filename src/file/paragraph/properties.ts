// http://officeopenxml.com/WPparagraphProperties.php
import { XmlComponent } from "file/xml-components";
import { Border } from "./formatting/border";

export class ParagraphProperties extends XmlComponent {
    private readonly border: Border;

    constructor() {
        super("w:pPr");
        this.border = new Border();
    }

    public createBorder(): void {
        this.push(this.border);
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }

    public get Border(): Border {
        return this.border;
    }
}
