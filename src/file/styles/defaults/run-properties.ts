import { Size, SizeComplexScript } from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { RunFonts } from "file/paragraph/run/run-fonts";
import { XmlComponent } from "file/xml-components";

export class RunPropertiesDefaults extends XmlComponent {
    private readonly properties: RunProperties;

    constructor() {
        super("w:rPrDefault");
        this.properties = new RunProperties();
        this.root.push(this.properties);
    }

    public size(size: number): RunPropertiesDefaults {
        this.properties.push(new Size(size));
        this.properties.push(new SizeComplexScript(size));
        return this;
    }

    public font(fontName: string): RunPropertiesDefaults {
        this.properties.push(new RunFonts(fontName));
        return this;
    }
}
