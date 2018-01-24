import { XmlComponent } from "file/xml-components";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties/section-properties";

export class Body extends XmlComponent {
    constructor(sectionPropertiesOptions?: SectionPropertiesOptions) {
        super("w:body");
    }

    public push(component: XmlComponent): void {
        this.root.push(component);

        this.root.push(
            new SectionProperties({
                width: 11906,
                height: 16838,
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
                header: 708,
                footer: 708,
                gutter: 0,
                space: 708,
                linePitch: 360,
            }),
        );
    }
}
