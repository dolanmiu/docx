import {XmlComponent, Attributes} from "../xml-components";

export class Document {
    private document: Array<XmlComponent>;

    constructor() {
        this.document = new Array<XmlComponent>();
        this.document.push(new Attributes({}));
        this.
    }

    test() {
        return "hello";
    }
}