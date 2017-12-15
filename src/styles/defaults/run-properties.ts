import { Size } from "../../docx/run/formatting";
import { RunProperties } from "../../docx/run/properties";
import { RunFonts } from "../../docx/run/run-fonts";
import { XmlComponent } from "../../docx/xml-components";

export class RunPropertiesDefaults extends XmlComponent {
    private properties: RunProperties;

    constructor() {
        super("w:rPrDefault");
        this.properties = new RunProperties();
        this.root.push(this.properties);
    }

    public size(size: number): RunPropertiesDefaults {
        this.properties.push(new Size(size));
        return this;
    }

    public font(fontName: string): RunPropertiesDefaults {
        this.properties.push(new RunFonts(fontName));
        return this;
    }
}
