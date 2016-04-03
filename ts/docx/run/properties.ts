import {XmlComponent, Attributes} from "../xml-components";

export class RunProperties implements XmlComponent {
    private rPr: Array<XmlComponent>;
    
    xmlKeys = {
        rPr: 'w:rPr'
    }

    constructor() {
        this.rPr = new Array<XmlComponent>();
    }

    push(item: XmlComponent): void {
        this.rPr.push(item);
    }
}
