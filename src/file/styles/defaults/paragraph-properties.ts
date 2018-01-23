import { XmlComponent } from "file/xml-components";
import { ParagraphProperties } from "../../paragraph/properties";

export class ParagraphPropertiesDefaults extends XmlComponent {
    constructor() {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties());
    }
}
