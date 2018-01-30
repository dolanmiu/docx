import { XmlComponent } from "file/xml-components";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties/section-properties";

export class Body extends XmlComponent {
    constructor(sectionPropertiesOptions?: SectionPropertiesOptions) {
        super("w:body");

        this.root.push(new SectionProperties(sectionPropertiesOptions));
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }
}
