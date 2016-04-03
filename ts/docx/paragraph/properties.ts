import {XmlComponent, Attributes} from "../xml-components";

export class ParagraphProperties implements XmlComponent {
    private pPr: Array<XmlComponent>;
    
    xmlKeys = {
        pPr: 'w:rPr'
    }

    constructor() {
        this.pPr = new Array<XmlComponent>();
        this.pPr.push(new Attributes());
    }

    push(item: XmlComponent): void {
        this.pPr.push(item);
    }
}