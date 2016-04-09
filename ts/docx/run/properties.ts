import {XmlComponent, Attributes} from "../xml-components";

export class RunProperties extends XmlComponent {

    constructor() {
        super("w:rPr");
    }

    push(item: XmlComponent): void {
        this.root.push(item);
    }
}
