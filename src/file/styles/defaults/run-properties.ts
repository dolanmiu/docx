import { IRunStylePropertiesOptions, RunProperties } from "@file/paragraph/run/properties";
import { XmlComponent } from "@file/xml-components";

export class RunPropertiesDefaults extends XmlComponent {
    public constructor(options?: IRunStylePropertiesOptions) {
        super("w:rPrDefault");

        this.root.push(new RunProperties(options));
    }
}
