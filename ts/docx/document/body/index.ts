import {XmlComponent, Attributes} from "../../xml-components";
import {SectionProperties} from "./section-properties";

export class Body implements XmlComponent {
    private body: Array<XmlComponent>;

    xmlKeys = {
        body: 'w:body'
    }

    constructor() {
        this.body = new Array<XmlComponent>();
        //this.body.push(new SectionProperties()); not actually needed
    }

    push(component: XmlComponent) {
        this.body.splice(this.body.length - 1, 0, component);
    }
}
