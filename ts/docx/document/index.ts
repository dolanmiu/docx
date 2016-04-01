import {XmlComponent, Attributes} from "../xml-components";
import {Body} from "./body";
import {Paragraph} from "../paragraph";

export class Document {
    private document: Array<XmlComponent>;
    private body: Body;

    constructor() {
        this.document = new Array<XmlComponent>();
        this.document.push(new Attributes({}));
        this.body = new Body();
        this.document.push(this.body);
    }

    addParagraph(paragraph: Paragraph) {
        this.body.push(paragraph);
    }
}