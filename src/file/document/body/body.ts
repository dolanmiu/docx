/**
 * Document body module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * @module
 */
import { Paragraph } from "@file/paragraph";
import { HeadingBookmarkIds, fillTablesOfContents } from "@file/table-of-contents/heading-entries";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { type PageNumberEstimator, fillPageNumbers, fillSequenceNumbers } from "./page-numbers";
import { type ISectionPropertiesOptions, SectionProperties } from "./section-properties/section-properties";

/**
 * Options for the body of a document.
 */
export type IBodyOptions = {
    /** Works out the page each bookmark is on, to write the page numbers of page references. See {@link PageNumberEstimator} */
    readonly pageNumbers?: PageNumberEstimator;
};

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
     * governs a given child of the body, and to write each section's properties into
     * its paragraph while the body is written.
     */
    private readonly sectionParagraphs = new Map<Paragraph, SectionProperties>();
    private readonly headingBookmarkIds = new HeadingBookmarkIds();
    private readonly pageNumbers?: PageNumberEstimator;

    public constructor({ pageNumbers }: IBodyOptions = {}) {
        super("w:body");
        this.pageNumbers = pageNumbers;
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
        // The paragraph that ends a section has that section's properties, so the search starts at the child itself
        const start = child ? Math.max(this.root.indexOf(child), 0) : 0;
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
     * Creates a new section by moving the previous section's properties into the last
     * paragraph of that section, and then adding the new section as the current section.
     * When that section doesn't end with a paragraph of its own (it ends with a table, or
     * it is empty), an empty paragraph is added to hold its properties.
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
        const lastParagraph = this.lastParagraphOfSection();
        if (currentSection && lastParagraph) {
            // The paragraph is the user's, so the section's properties are only added to it while the body is written
            // eslint-disable-next-line functional/immutable-data
            this.sectionParagraphs.set(lastParagraph, currentSection);
        } else {
            const sectionParagraph = this.createSectionParagraph();
            this.root.push(sectionParagraph);
            if (currentSection) {
                // eslint-disable-next-line functional/immutable-data
                this.sectionParagraphs.set(sectionParagraph, currentSection);
            }
        }

        this.sections.push(new SectionProperties(options));
    }

    /**
     * Prepares the body element for XML serialization.
     *
     * Ensures that the last section's properties are placed as a direct child of the body
     * element, as required by the OOXML specification. Once the body is written, its tables
     * of contents are filled in from its headings, and, when the body has a page number
     * estimator, its page references are given their page numbers. Its SEQ fields are given
     * their numbers after the tables of contents are filled in, as Word leaves a heading's SEQ
     * number out of its entry.
     *
     * @param context - The XML serialization context
     * @returns The prepared XML object or undefined
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.sections.length === 1) {
            this.root.splice(0, 1);
            this.root.push(this.sections.pop() as SectionProperties);
        }

        // Each section's properties are written into the paragraph that ends it, and taken out again afterwards so the
        // paragraph is left as it was given, ready to be written again or used in another document
        for (const [paragraph, section] of this.sectionParagraphs) {
            paragraph.addSectionProperties(section);
        }
        let xml: IXmlableObject;
        try {
            xml = super.prepForXml(context) as IXmlableObject;
        } finally {
            for (const [paragraph, section] of this.sectionParagraphs) {
                paragraph.removeSectionProperties(section);
            }
        }
        fillTablesOfContents(xml, context, this.headingBookmarkIds);
        if (this.pageNumbers) {
            fillSequenceNumbers(xml, context);
            fillPageNumbers(xml, context, this.pageNumbers);
        }
        return xml;
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
        const section = component instanceof Paragraph ? this.sectionParagraphs.get(component) : undefined;
        if (section) {
            // The paragraph ends an earlier section and is used again, so that section's properties move to a paragraph
            // of their own after it, or both places would end a section
            const sectionParagraph = this.createSectionParagraph();
            this.root.splice(this.root.indexOf(component) + 1, 0, sectionParagraph);
            // eslint-disable-next-line functional/immutable-data
            this.sectionParagraphs.delete(component as Paragraph);
            // eslint-disable-next-line functional/immutable-data
            this.sectionParagraphs.set(sectionParagraph, section);
        }
        this.root.push(component);
    }

    /**
     * The paragraph the current section ends with, which can hold its properties.
     *
     * There is none when the section ends with something other than a paragraph, or is empty:
     * its last child is then the placeholder at the start of the body (removed when the body is
     * written) or the paragraph that ends the section before, which has properties of its own.
     */
    private lastParagraphOfSection(): Paragraph | undefined {
        const last = this.root[this.root.length - 1];
        // A paragraph used more than once in the body would end a section in each place, so only one used once can
        const canHoldSection =
            last instanceof Paragraph &&
            last !== this.root[0] &&
            !this.sectionParagraphs.has(last) &&
            this.root.indexOf(last) === this.root.length - 1;
        return canHoldSection ? last : undefined;
    }

    /**
     * An empty paragraph to end a section that has no paragraph of its own to end it. The section's
     * properties are written into it with the others, when the body is written.
     */
    private createSectionParagraph(): Paragraph {
        return new Paragraph({});
    }
}
