import { Attributes, XmlComponent } from "../xml-components";

export class ParagraphProperties extends XmlComponent {

    constructor() {
        super("w:pPr");
        this.root.push(new Attributes());
    }

    push(item: XmlComponent): void {
        this.root.push(item);
    }
}