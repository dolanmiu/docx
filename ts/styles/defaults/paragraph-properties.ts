import {XmlComponent} from "../../docx/xml-components";
import {ParagraphProperties} from "../../docx/paragraph/properties";

export class ParagraphPropertiesDefaults implements XmlComponent {
    private pPrDefault: Array<XmlComponent>;

    xmlKeys = {
        pPrDefault: "w:pPrDefault"
    }

    constructor() {
        this.pPrDefault = new Array<XmlComponent>();
        this.pPrDefault.push(new ParagraphProperties());
    }
}