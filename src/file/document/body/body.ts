import { Paragraph, ParagraphProperties } from "@file/paragraph";
import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import { ISectionPropertiesOptions, SectionProperties } from "./section-properties/section-properties";

/**
 * Represents the document body in a WordprocessingML document.
 *
 * The body element is the container for all block-level content in the document.
 * This includes paragraphs, tables, and section properties that define page layout.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Body">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="sectPr" minOccurs="0" maxOccurs="1" type="CT_SectPr"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export class Body extends XmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly sections: SectionProperties[] = [];

    public constructor() {
        super("w:body");
    }

    /**
     * Adds new section properties.
     * Note: Previous section is created in paragraph after the current element, and then new section will be added.
     * The spec says:
     *  - section element should be in the last paragraph of the section
     *  - last section should be direct child of body
     *
     * @param options new section options
     */
    public addSection(options: ISectionPropertiesOptions): void {
        const currentSection = this.sections.pop() as SectionProperties;
        this.root.push(this.createSectionParagraph(currentSection));

        this.sections.push(new SectionProperties(options));
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.splice(0, 1);
            this.root.push(this.sections.pop() as SectionProperties);
        }

        return super.prepForXml(context);
    }

    public push(component: XmlComponent): void {
        this.root.push(component);
    }

    private createSectionParagraph(section: SectionProperties): Paragraph {
        const paragraph = new Paragraph({});
        const properties = new ParagraphProperties({});
        properties.push(section);
        paragraph.addChildElement(properties);
        return paragraph;
    }
}
