import { RunProperties } from "../../docx/run/properties";
import { XmlComponent } from "../../docx/xml-components";

export class RunPropertiesDefaults extends XmlComponent {

    constructor() {
        super("w:rPrDefault");
        this.root.push(new RunProperties());
    }
}
