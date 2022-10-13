import { IParagraphStylePropertiesOptions, ParagraphProperties } from "@file/paragraph/properties";
import { XmlComponent } from "@file/xml-components";

export class ParagraphPropertiesDefaults extends XmlComponent {
    public constructor(options?: IParagraphStylePropertiesOptions) {
        super("w:pPrDefault");
        this.root.push(new ParagraphProperties(options));
    }
}
