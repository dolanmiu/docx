import {XmlComponent, Attributes} from "../../xml-components";
import {SectionProperties} from "./section-properties";

export class Body extends XmlComponent {

    constructor() {
        super("w:body");
        //this.root.push(new SectionProperties()); not actually needed
    }

    push(component: XmlComponent) {
        //this.root.splice(this.body.length - 1, 0, component);
        this.root.push(component);
    }
}
