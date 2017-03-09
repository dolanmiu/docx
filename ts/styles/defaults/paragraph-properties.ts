import { ParagraphProperties } from "../../docx/paragraph/properties";
import { XmlComponent } from "../../docx/xml-components";

export class ParagraphPropertiesDefaults extends XmlComponent {

    constructor() {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties());
    }
}
