import {XmlComponent} from "../../docx/xml-components";
import {ParagraphPropertiesDefaults} from "./paragraph-properties";
import {RunPropertiesDefaults} from "./run-properties";

export class DocumentDefaults extends XmlComponent {
    
    constructor() {
        super("w:docDefaults");
        this.root.push(new RunPropertiesDefaults());
        this.root.push(new ParagraphPropertiesDefaults());
    }
}