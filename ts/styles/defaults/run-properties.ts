import {XmlComponent} from "../../docx/xml-components";
import {RunProperties} from "../../docx/run/properties";

export class RunPropertiesDefaults extends XmlComponent {

    constructor() {
        super("w:rPrDefault");
        this.root.push(new RunProperties());
    }
}