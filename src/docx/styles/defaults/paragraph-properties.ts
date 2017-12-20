import { ParagraphProperties } from "../../paragraph/properties";
import { XmlComponent } from "../../xml-components";

export class ParagraphPropertiesDefaults extends XmlComponent {

    constructor() {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties());
    }
}
