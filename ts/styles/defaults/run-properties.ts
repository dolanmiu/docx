import {XmlComponent} from "../../docx/xml-components";
import {RunProperties} from "../../docx/run/properties";

export class RunPropertiesDefaults implements XmlComponent {
    private rPrDefault: Array<XmlComponent>;
    
    xmlKeys = {
        rPrDefault: "w:rPrDefault"
    }
    
    constructor() {
        this.rPrDefault = new Array<XmlComponent>();    
        this.rPrDefault.push(new RunProperties());    
    }
}