// http://officeopenxml.com/WPparagraphProperties.php
import { XmlComponent } from "file/xml-components";
import { Border } from "./formatting/border";
import { Style } from "./formatting/style";

export class ParagraphProperties extends XmlComponent {
    public paragraphBorder: Border;

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

    public getStyles(): Style[] {
        return this.root.filter((child) => child instanceof Style) as Style[];
    }
}
