import {XmlComponent} from "../../docx/xml-components";
import {ParagraphPropertiesDefaults} from "./paragraph-properties";
import {RunPropertiesDefaults} from "./run-properties";

export class DocumentDefaults implements XmlComponent {
    private docDefaults: Array<XmlComponent>;
    
    xmlKeys = {
        docDefaults: "w:docDefaults"
    }
    
    constructor() {
        this.docDefaults = new Array<XmlComponent>();
        this.docDefaults.push(new RunPropertiesDefaults());
        this.docDefaults.push(new ParagraphPropertiesDefaults());
    }
}