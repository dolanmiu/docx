import {XmlComponent, Attributes} from "../xml-components";
import {Body} from "./body";

export class Document {
    private document: Array<XmlComponent>;

    constructor() {
        this.document = new Array<XmlComponent>();
        this.document.push(new Attributes({}));
        this.document.push(new Body());
    }

    test() {
        return "hello";
    }
}