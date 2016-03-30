import {XmlComponent, Attributes} from "../xml-components";

export class RunProperties {
    private rPr: Array<XmlComponent>;

    constructor() {
        this.rPr = new Array<XmlComponent>();
    }

    push(item: XmlComponent): void {
        this.rPr.push(item);
    }
}
