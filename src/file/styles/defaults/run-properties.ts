import { XmlComponent } from "file/xml-components";
import { Size, SizeCs } from "../../paragraph/run/formatting";
import { RunProperties } from "../../paragraph/run/properties";
import { RunFonts } from "../../paragraph/run/run-fonts";

export class RunPropertiesDefaults extends XmlComponent {
    private readonly properties: RunProperties;

    constructor() {
        super("w:rPrDefault");
        this.properties = new RunProperties();
        this.root.push(this.properties);
    }

    public size(size: number): RunPropertiesDefaults {
        this.properties.push(new Size(size));
        this.properties.push(new SizeCs(size));
        return this;
    }

    public font(fontName: string): RunPropertiesDefaults {
        this.properties.push(new RunFonts(fontName));
        return this;
    }
}
