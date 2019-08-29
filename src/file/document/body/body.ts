import { IXmlableObject, XmlComponent } from "file/xml-components";
import { TableOfContents } from "../..";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties/section-properties";

export class Body extends XmlComponent {
    private readonly sections: SectionProperties[] = [];

    constructor() {
        super("w:body");
    }

    /**
     * Adds new section properties.
     * Note: Previous section is created in paragraph after the current element, and then new section will be added.
     * The spec says:
     *  - section element should be in the last paragraph of the section
     *  - last section should be direct child of body
     * @param options new section options
     */
    public addSection(options: SectionPropertiesOptions): void {
        this.sections.push(new SectionProperties(options));
    }

    public prepForXml(): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.push(this.sections.pop() as SectionProperties);
        }

        return super.prepForXml();
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }

    public getTablesOfContents(): TableOfContents[] {
        return this.root.filter((child) => child instanceof TableOfContents) as TableOfContents[];
    }
}
