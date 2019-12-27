import { IXmlableObject, XmlComponent } from "file/xml-components";
import { Paragraph, ParagraphProperties, TableOfContents } from "../..";
import { File } from "../../../file";
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
        const currentSection = this.sections.pop() as SectionProperties;
        this.root.push(this.createSectionParagraph(currentSection));

        this.sections.push(new SectionProperties(options));
    }

    public prepForXml(file?: File): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.splice(0, 1);
            this.root.push(this.sections.pop() as SectionProperties);
        }

        return super.prepForXml(file);
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }

    public getTablesOfContents(): TableOfContents[] {
        return this.root.filter((child) => child instanceof TableOfContents) as TableOfContents[];
    }

    private createSectionParagraph(section: SectionProperties): Paragraph {
        const paragraph = new Paragraph({});
        const properties = new ParagraphProperties({});
        properties.addChildElement(section);
        paragraph.addChildElement(properties);
        return paragraph;
    }
}
