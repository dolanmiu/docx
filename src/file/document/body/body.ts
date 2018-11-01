import { IXmlableObject, XmlComponent } from "file/xml-components";
import { Paragraph, ParagraphProperties, TableOfContents } from "../..";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties/section-properties";

export class Body extends XmlComponent {
    private readonly defaultSection: SectionProperties;

    private readonly sections: SectionProperties[] = [];

    constructor(sectionPropertiesOptions?: SectionPropertiesOptions) {
        super("w:body");

        this.defaultSection = new SectionProperties(sectionPropertiesOptions);
        this.sections.push(this.defaultSection);
    }

    /**
     * Adds new section properties.
     * Note: Previous section is created in paragraph after the current element, and then new section will be added.
     * The spec says:
     *  - section element should be in the last paragraph of the section
     *  - last section should be direct child of body
     * @param section new section
     */
    public addSection(section: SectionPropertiesOptions | SectionProperties): void {
        const currentSection = this.sections.pop() as SectionProperties;
        this.root.push(this.createSectionParagraph(currentSection));
        if (section instanceof SectionProperties) {
            this.sections.push(section);
        } else {
            const params = {
                ...this.defaultSection.Options,
                ...section,
            };
            this.sections.push(new SectionProperties(params));
        }
    }
    public prepForXml(): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.push(this.sections[0]);
        }

        return super.prepForXml();
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }

    public get DefaultSection(): SectionProperties {
        return this.defaultSection;
    }

    public getTablesOfContents(): TableOfContents[] {
        return this.root.filter((child) => child instanceof TableOfContents) as TableOfContents[];
    }

    public getParagraphs(): Paragraph[] {
        return this.root.filter((child) => child instanceof Paragraph) as Paragraph[];
    }

    private createSectionParagraph(section: SectionProperties): Paragraph {
        const paragraph = new Paragraph();
        const properties = new ParagraphProperties();
        properties.addChildElement(section);
        paragraph.addChildElement(properties);
        return paragraph;
    }
}
