import { IRunStylePropertiesOptions, RunProperties } from "file/paragraph/run/properties";
import { XmlComponent } from "file/xml-components";

export class RunPropertiesDefaults extends XmlComponent {
    private readonly properties: RunProperties;

    constructor(options?: IRunStylePropertiesOptions) {
        super("w:rPrDefault");
        this.properties = new RunProperties(options);
        this.root.push(this.properties);
    }
}
