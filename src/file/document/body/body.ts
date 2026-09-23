/**
 * Document body module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * @module
 */
import { Paragraph, ParagraphProperties } from "@file/paragraph";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { type ISectionPropertiesOptions, SectionProperties } from "./section-properties/section-properties";

/**
 * Represents the document body in a WordprocessingML document.
 *
 * The body element is the container for all block-level content in the document.
 * This includes paragraphs, tables, and section properties that define page layout.
 *
 * The body supports multiple sections, where each section (except the last one) must
 * have its section properties stored in a paragraph's properties at the end of that
 * section. The last section's properties are stored as a direct child of the body element.
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
 *
 * @example
 * ```typescript
 * // Body is typically created internally by the Document class
 * const doc = new Document({});
 * const body = doc.Body;
 *
 * // Add content to the body via Document.add()
 * doc.add(new Paragraph("Content in first section"));
 *
 * // Add a new section
 * body.addSection({
 *   page: {
 *     size: { width: 12240, height: 15840 },
 *   },
 * });
 *
 * // Content after addSection belongs to the new section
 * doc.add(new Paragraph("Content in second section"));
 * ```
 */
export class Body extends XmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly sections: SectionProperties[] = [];
    /**
     * Section properties that were moved into a paragraph at the end of their section
     * by {@link addSection}, keyed by that paragraph. Used to find the section that
     * governs a given child of the body.
     */
    private readonly sectionParagraphs = new Map<Paragraph, SectionProperties>();

    public constructor() {
        super("w:body");
    }

    /**
     * Finds the section properties that govern a top-level child of the body.
     *
     * A section's properties are stored after its content (either in the closing
     * paragraph of the section or, for the last section, at the end of the body), so
     * the governing section is the first one found at or after the child. When no
     * child is given (or it is not a direct child of the body), the first section is
     * returned.
     *
     * @param child - A direct child of the body (paragraph, table, etc.)
     * @returns The governing section properties, or undefined if the body has no sections
     */
    public getSectionPropertiesFor(child?: XmlComponent): SectionProperties | undefined {
        const start = child ? this.root.indexOf(child) + 1 : 0;
        for (let i = start; i < this.root.length; i++) {
            const component = this.root[i];
            if (component instanceof SectionProperties) {
                return component;
            }
            const section = this.sectionParagraphs.get(component);
            if (section) {
                return section;
            }
        }

        return this.sections[this.sections.length - 1];
    }

    /**
     * Adds new section properties to the document body.
     *
     * Creates a new section by moving the previous section's properties into a paragraph
     * at the end of that section, and then adding the new section as the current section.
     *
     * According to the OOXML specification:
     * - Section properties for all sections except the last must be stored in a paragraph's
     *   properties (pPr/sectPr) at the end of each section
     * - The last section's properties are stored as a direct child of the body element (w:body/w:sectPr)
     *
     * @param options - Section properties configuration (page size, margins, headers, footers, etc.)
     */
    public addSection(options: ISectionPropertiesOptions): void {
        const currentSection = this.sections.pop() as SectionProperties;
        const sectionParagraph = this.createSectionParagraph(currentSection);
        this.root.push(sectionParagraph);
        if (currentSection) {
            // eslint-disable-next-line functional/immutable-data
            this.sectionParagraphs.set(sectionParagraph, currentSection);
        }

        this.sections.push(new SectionProperties(options));
    }

    /**
     * Prepares the body element for XML serialization.
     *
     * Ensures that the last section's properties are placed as a direct child of the body
     * element, as required by the OOXML specification.
     *
     * @param context - The XML serialization context
     * @returns The prepared XML object or undefined
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.splice(0, 1);
            this.root.push(this.sections.pop() as SectionProperties);
        }

        return super.prepForXml(context);
    }

    /**
     * Adds a block-level component to the body.
     *
     * This method is used internally by the Document class to add paragraphs,
     * tables, and other block-level elements to the document body.
     *
     * @param component - The XML component to add (paragraph, table, etc.)
     */
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
