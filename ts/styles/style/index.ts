import {XmlComponent} from "../../docx/xml-components";
import {StyleAttributes} from "./attributes";

export class Style implements XmlComponent {
    private style: Array<XmlComponent>;
    
    xmlKeys = {
        style: "w:style"
    }
    
    constructor(attributes: StyleAttributes) {
        this.style = new Array<XmlComponent>();
        this.style.push(attributes);
    }
    
    push(styleSegment: XmlComponent): void {
        this.style.push(styleSegment);
    }
}