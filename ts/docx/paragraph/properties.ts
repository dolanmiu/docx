import {XmlComponent, Attributes} from "../xml-components";

export class ParagraphProperties extends XmlComponent {

    constructor() {
        super("w:rPr");
        this.root.push(new Attributes());
    }

    push(item: XmlComponent): void {
        this.root.push(item);
    }
}