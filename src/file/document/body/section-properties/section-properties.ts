// <xsd:complexType name="CT_SectPr">
//     <xsd:sequence>
//         <xsd:group ref="EG_HdrFtrReferences" minOccurs="0" maxOccurs="6"/>
//         <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
//         <xsd:element name="sectPrChange" type="CT_SectPrChange" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attributeGroup ref="AG_SectPrAttributes"/>
// </xsd:complexType>

// <xsd:group name="EG_SectPrContents">
// <xsd:sequence>
//   <xsd:element name="footnotePr" type="CT_FtnProps" minOccurs="0"/>
//   <xsd:element name="endnotePr" type="CT_EdnProps" minOccurs="0"/>
//   <xsd:element name="type" type="CT_SectType" minOccurs="0"/>
//   <xsd:element name="pgSz" type="CT_PageSz" minOccurs="0"/>
//   <xsd:element name="pgMar" type="CT_PageMar" minOccurs="0"/>
//   <xsd:element name="paperSrc" type="CT_PaperSource" minOccurs="0"/>
//   <xsd:element name="pgBorders" type="CT_PageBorders" minOccurs="0"/>
//   <xsd:element name="lnNumType" type="CT_LineNumber" minOccurs="0"/>
//   <xsd:element name="pgNumType" type="CT_PageNumber" minOccurs="0"/>
//   <xsd:element name="cols" type="CT_Columns" minOccurs="0"/>
//   <xsd:element name="formProt" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
//   <xsd:element name="noEndnote" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="titlePg" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
//   <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="rtlGutter" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="docGrid" type="CT_DocGrid" minOccurs="0"/>
//   <xsd:element name="printerSettings" type="CT_Rel" minOccurs="0"/>
// </xsd:sequence>
// </xsd:group>

/**
 * Section properties module for WordprocessingML documents.
 *
 * Section properties define page layout including page size, margins,
 * headers/footers, columns, and page numbering.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * @module
 */
import { FooterWrapper } from "@file/footer-wrapper";
import { HeaderWrapper } from "@file/header-wrapper";
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { SectionVerticalAlign, createVerticalAlign } from "@file/vertical-align";
import { OnOffElement, XmlComponent } from "@file/xml-components";

import { IColumnsAttributes, createColumns } from "./properties/columns";
import { IDocGridAttributesProperties, createDocumentGrid } from "./properties/doc-grid";
import { HeaderFooterReferenceType, HeaderFooterType, createHeaderFooterReference } from "./properties/header-footer-reference";
import { ILineNumberAttributes, createLineNumberType } from "./properties/line-number";
import { IPageBordersOptions, PageBorders } from "./properties/page-borders";
import { IPageMarginAttributes, createPageMargin } from "./properties/page-margin";
import { IPageNumberTypeAttributes, createPageNumberType } from "./properties/page-number";
import { IPageSizeAttributes, PageOrientation, createPageSize } from "./properties/page-size";
import { PageTextDirection, PageTextDirectionType } from "./properties/page-text-direction";
import { SectionType, createSectionType } from "./properties/section-type";

/**
 * Header/footer group for specifying different headers/footers
 * for default, first, and even pages.
 *
 * @property default - Header/footer for default pages (odd pages when even headers are used)
 * @property first - Header/footer for first page (requires titlePage setting)
 * @property even - Header/footer for even pages (requires evenAndOddHeaders setting)
 */
export type IHeaderFooterGroup<T> = {
    /** Header/footer for default pages (odd pages when even headers are used) */
    readonly default?: T;
    /** Header/footer for first page (requires titlePage setting) */
    readonly first?: T;
    /** Header/footer for even pages (requires evenAndOddHeaders setting) */
    readonly even?: T;
};

export type ISectionPropertiesOptionsBase = {
    /** Page-level settings including size, margins, borders, and text direction */
    readonly page?: {
        /** Page size and orientation */
        readonly size?: Partial<IPageSizeAttributes>;
        /** Page margins (top, bottom, left, right, header, footer, gutter) */
        readonly margin?: IPageMarginAttributes;
        /** Page numbering format and starting value */
        readonly pageNumbers?: IPageNumberTypeAttributes;
        /** Page border settings */
        readonly borders?: IPageBordersOptions;
        /** Text flow direction (horizontal or vertical) */
        readonly textDirection?: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
    };
    /** Document grid settings for precise East Asian character layout */
    readonly grid?: Partial<IDocGridAttributesProperties>;
    /** Header definitions for default, first, and even pages */
    readonly headerWrapperGroup?: IHeaderFooterGroup<HeaderWrapper>;
    /** Footer definitions for default, first, and even pages */
    readonly footerWrapperGroup?: IHeaderFooterGroup<FooterWrapper>;
    /** Line numbering settings for the section */
    readonly lineNumbers?: ILineNumberAttributes;
    /** Whether first page has different header/footer */
    readonly titlePage?: boolean;
    /** Vertical alignment of text on page (top, center, bottom, justified) */
    readonly verticalAlign?: SectionVerticalAlign;
    /** Column layout settings (count, spacing, equal width) */
    readonly column?: IColumnsAttributes;
    /** Section break type (next page, continuous, even page, odd page) */
    readonly type?: (typeof SectionType)[keyof typeof SectionType];
};

export type ISectionPropertiesChangeOptions = IChangedAttributesProperties & ISectionPropertiesOptionsBase;

/**
 * Options for configuring section properties.
 *
 * This type defines all possible configuration options for a document section,
 * including page layout, margins, headers/footers, and numbering.
 *
 * @property page - Page-level settings (size, margins, borders, numbering, text direction)
 * @property grid - Document grid settings for East Asian typography
 * @property headerWrapperGroup - Header definitions for default, first, and even pages
 * @property footerWrapperGroup - Footer definitions for default, first, and even pages
 * @property lineNumbers - Line numbering settings
 * @property titlePage - Whether first page has different header/footer
 * @property verticalAlign - Vertical alignment of text on page
 * @property column - Column layout settings
 * @property type - Section break type (next page, continuous, etc.)
 *
 * @see {@link SectionProperties}
 */
export type ISectionPropertiesOptions = {
    readonly revision?: ISectionPropertiesChangeOptions;
} & ISectionPropertiesOptionsBase;

/**
 * Default margin values for sections (in twips).
 *
 * Standard margins are 1 inch (1440 twips) on all sides.
 * Header/footer margins are 0.5 inches (708 twips) from page edge.
 *
 * @property TOP - Top margin: 1440 twips (1 inch)
 * @property RIGHT - Right margin: 1440 twips (1 inch)
 * @property BOTTOM - Bottom margin: 1440 twips (1 inch)
 * @property LEFT - Left margin: 1440 twips (1 inch)
 * @property HEADER - Header margin: 708 twips (0.5 inches)
 * @property FOOTER - Footer margin: 708 twips (0.5 inches)
 * @property GUTTER - Gutter margin: 0 twips
 */
export const sectionMarginDefaults = {
    /** Top margin: 1440 twips (1 inch) */
    TOP: 1440,
    /** Right margin: 1440 twips (1 inch) */
    RIGHT: 1440,
    /** Bottom margin: 1440 twips (1 inch) */
    BOTTOM: 1440,
    /** Left margin: 1440 twips (1 inch) */
    LEFT: 1440,
    /** Header margin from top: 708 twips (0.5 inches) */
    HEADER: 708,
    /** Footer margin from bottom: 708 twips (0.5 inches) */
    FOOTER: 708,
    /** Gutter margin for binding: 0 twips */
    GUTTER: 0,
};

/**
 * Default page size values (in twips, A4 portrait).
 *
 * A4 size is 210mm x 297mm (8.27" x 11.69").
 *
 * @property WIDTH - Page width: 11906 twips (8.27 inches, 210mm)
 * @property HEIGHT - Page height: 16838 twips (11.69 inches, 297mm)
 * @property ORIENTATION - Page orientation: portrait
 */
export const sectionPageSizeDefaults = {
    /** Page width: 11906 twips (8.27 inches, 210mm) */
    WIDTH: 11906,
    /** Page height: 16838 twips (11.69 inches, 297mm) */
    HEIGHT: 16838,
    /** Page orientation: portrait */
    ORIENTATION: PageOrientation.PORTRAIT,
};

/**
 * Represents section properties (sectPr) in a WordprocessingML document.
 *
 * Section properties define the page layout for a section of the document,
 * including page size, margins, headers/footers, columns, and page numbering.
 * A document can contain multiple sections with different properties.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SectPr">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_HdrFtrReferences" minOccurs="0" maxOccurs="6"/>
 *     <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
 *     <xsd:element name="sectPrChange" type="CT_SectPrChange" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attributeGroup ref="AG_SectPrAttributes"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create section with custom page size and margins
 * new SectionProperties({
 *   page: {
 *     size: {
 *       width: 12240,
 *       height: 15840,
 *       orientation: PageOrientation.PORTRAIT
 *     },
 *     margin: {
 *       top: 1440,
 *       right: 1440,
 *       bottom: 1440,
 *       left: 1440
 *     },
 *     pageNumbers: {
 *       start: 1,
 *       formatType: NumberFormat.DECIMAL
 *     }
 *   },
 *   column: {
 *     count: 2,
 *     space: 720
 *   }
 * });
 * ```
 */
export class SectionProperties extends XmlComponent {
    public constructor({
        page: {
            size: {
                width = sectionPageSizeDefaults.WIDTH,
                height = sectionPageSizeDefaults.HEIGHT,
                orientation = sectionPageSizeDefaults.ORIENTATION,
            } = {},
            margin: {
                top = sectionMarginDefaults.TOP,
                right = sectionMarginDefaults.RIGHT,
                bottom = sectionMarginDefaults.BOTTOM,
                left = sectionMarginDefaults.LEFT,
                header = sectionMarginDefaults.HEADER,
                footer = sectionMarginDefaults.FOOTER,
                gutter = sectionMarginDefaults.GUTTER,
            } = {},
            pageNumbers = {},
            borders,
            textDirection,
        } = {},
        grid: { linePitch = 360, charSpace, type: gridType } = {},
        headerWrapperGroup = {},
        footerWrapperGroup = {},
        lineNumbers,
        titlePage,
        verticalAlign,
        column,
        type,
        revision,
    }: ISectionPropertiesOptions = {}) {
        super("w:sectPr");

        this.addHeaderFooterGroup(HeaderFooterType.HEADER, headerWrapperGroup);
        this.addHeaderFooterGroup(HeaderFooterType.FOOTER, footerWrapperGroup);

        if (type) {
            this.root.push(createSectionType(type));
        }

        this.root.push(createPageSize({ width, height, orientation }));
        this.root.push(createPageMargin(top, right, bottom, left, header, footer, gutter));

        if (borders) {
            this.root.push(new PageBorders(borders));
        }

        if (lineNumbers) {
            this.root.push(createLineNumberType(lineNumbers));
        }

        this.root.push(createPageNumberType(pageNumbers));

        if (column) {
            this.root.push(createColumns(column));
        }

        if (verticalAlign) {
            this.root.push(createVerticalAlign(verticalAlign));
        }

        if (titlePage !== undefined) {
            this.root.push(new OnOffElement("w:titlePg", titlePage));
        }

        if (textDirection) {
            this.root.push(new PageTextDirection(textDirection));
        }

        if (revision) {
            this.root.push(new SectionPropertiesChange(revision));
        }

        this.root.push(createDocumentGrid({ linePitch, charSpace, type: gridType }));
    }

    private addHeaderFooterGroup(
        type: (typeof HeaderFooterType)[keyof typeof HeaderFooterType],
        group: IHeaderFooterGroup<HeaderWrapper> | IHeaderFooterGroup<FooterWrapper>,
    ): void {
        if (group.default) {
            this.root.push(
                createHeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.DEFAULT,
                    id: group.default.View.ReferenceId,
                }),
            );
        }

        if (group.first) {
            this.root.push(
                createHeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.FIRST,
                    id: group.first.View.ReferenceId,
                }),
            );
        }

        if (group.even) {
            this.root.push(
                createHeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.EVEN,
                    id: group.even.View.ReferenceId,
                }),
            );
        }
    }
}

export class SectionPropertiesChange extends XmlComponent {
    public constructor(options: ISectionPropertiesChangeOptions) {
        super("w:sectPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.root.push(new SectionProperties(options));
    }
}
