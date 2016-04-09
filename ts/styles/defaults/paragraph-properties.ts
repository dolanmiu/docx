import {XmlComponent} from "../../docx/xml-components";
import {ParagraphProperties} from "../../docx/paragraph/properties";

export class ParagraphPropertiesDefaults extends XmlComponent {

    constructor() {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties());
    }
}