import {XmlComponent} from "../../docx/xml-components";
import {StyleAttributes} from "./attributes";

export class Style extends XmlComponent {
    
    constructor(attributes: StyleAttributes) {
        super("w:style");
        this.root.push(attributes);
    }
    
    push(styleSegment: XmlComponent): void {
        this.root.push(styleSegment);
    }
}