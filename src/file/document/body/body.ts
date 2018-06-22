import { XmlComponent, IXmlableObject } from "file/xml-components";
import { SectionProperties, SectionPropertiesOptions } from "./section-properties/section-properties";
import { Paragraph, ParagraphProperties } from "../..";

export class Body extends XmlComponent {
    private defaultSection: SectionProperties;

    private sections: SectionProperties[] = [];

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
    addSection(section: SectionPropertiesOptions | SectionProperties) {
        const currentSection = this.sections.pop() as SectionProperties;
        this.root.push(this.createSectionParagraph(currentSection));
        if (section instanceof SectionProperties) {
            this.sections.push(section);
        } else {
            this.sections.push(new SectionProperties(section));
        }
    }
    public prepForXml(): IXmlableObject {
        if (this.sections.length === 1) {
            this.root.push(this.sections[0]);
        } else if (this.sections.length > 1) {
            throw new Error("Invalid usage of sections. At the end of the body element there must be ONE section.");
        }

        return super.prepForXml();
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }

    get DefaultSection() {
        return this.defaultSection;
    }

    private createSectionParagraph(section: SectionProperties) {
        const paragraph = new Paragraph();
        const properties = new ParagraphProperties();
        properties.addChildElement(section);
        paragraph.addChildElement(properties);
        return paragraph;
    }
}
