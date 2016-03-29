import {XmlComponent, Attributes} from "../xml-components";

export class ParagraphProperties implements XmlComponent {
    private pPr: Array<XmlComponent>;

    constructor() {
        this.pPr = new Array<XmlComponent>();
        this.pPr.push(new Attributes());
    }

    push(item: XmlComponent) {
        this.pPr.push(item);
    }
}