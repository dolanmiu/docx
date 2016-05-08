import {XmlComponent} from "../../docx/xml-components";
import {ParagraphPropertiesDefaults} from "./paragraph-properties";
import {RunPropertiesDefaults} from "./run-properties";

export class DocumentDefaults extends XmlComponent {
    
    constructor(runPropertiesDefaults: RunPropertiesDefaults, paragraphPropertiesDefaults: ParagraphPropertiesDefaults) {
        super("w:docDefaults");
        this.root.push(runPropertiesDefaults);
        this.root.push(paragraphPropertiesDefaults);
    }
}