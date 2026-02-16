/**
 * Paragraph properties module for WordprocessingML documents.
 *
 * This module provides the paragraph properties (pPr) element which specifies
 * the formatting applied to a paragraph.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 *
 * @see https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_suppressLineNumbers_topic_ID0ECJAO.html
 *
 * @module
 */
import { ChangeAttributes, IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { IContext, IXmlableObject, IgnoreIfEmptyXmlComponent, OnOffElement, XmlComponent } from "@file/xml-components";

import { IParagraphRunOptions, ParagraphRunProperties } from ".";
import { FontWrapper } from "../fonts/font-wrapper";
import { IShadingAttributesProperties, Shading } from "../shading";
import { Alignment, AlignmentType } from "./formatting/alignment";
import { Border, IBordersOptions, ThematicBreak } from "./formatting/border";
import { PageBreakBefore } from "./formatting/break";
import { IIndentAttributesProperties, Indent } from "./formatting/indent";
import { ISpacingProperties, Spacing } from "./formatting/spacing";
import { HeadingLevel, Style } from "./formatting/style";
import { TabStop, TabStopDefinition, TabStopType } from "./formatting/tab-stop";
import { NumberProperties } from "./formatting/unordered-list";
import { WordWrap } from "./formatting/word-wrap";
import { IFrameOptions, createFrameProperties } from "./frame/frame-properties";
import { OutlineLevel } from "./links";

/**
 * Paragraph style properties for numbering levels.
 *
 * These properties are used when defining paragraph styles within numbering level definitions.
 */
export type ILevelParagraphStylePropertiesOptions = {
    /** Paragraph text alignment (left, right, center, justified, etc.) */
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    /** Whether to display a horizontal line (thematic break) below the paragraph */
    readonly thematicBreak?: boolean;
    /** Whether to ignore spacing before/after when adjacent paragraphs have the same style */
    readonly contextualSpacing?: boolean;
    /** Position in twips for a right-aligned tab stop */
    readonly rightTabStop?: number;
    /** Position in twips for a left-aligned tab stop */
    readonly leftTabStop?: number;
    /** Indentation settings for the paragraph */
    readonly indent?: IIndentAttributesProperties;
    /** Spacing before/after paragraph and between lines */
    readonly spacing?: ISpacingProperties;
    /**
     * Specifies that the paragraph (or at least part of it) should be rendered on the same page as the next paragraph when possible. If multiple paragraphs are to be kept together but they exceed a page, then the set of paragraphs begin on a new page and page breaks are used thereafter as needed.
     */
    readonly keepNext?: boolean;
    /**
     * Specifies that all lines of the paragraph are to be kept on a single page when possible.
     */
    readonly keepLines?: boolean;
    /** Outline level for table of contents and document outline (0-9) */
    readonly outlineLevel?: number;
};

/**
 * Paragraph style properties options.
 *
 * These properties are used when defining paragraph styles and include
 * border, shading, and numbering options in addition to level properties.
 */
export type IParagraphStylePropertiesOptions = {
    /** Border settings for the paragraph */
    readonly border?: IBordersOptions;
    /** Background shading/fill color for the paragraph */
    readonly shading?: IShadingAttributesProperties;
    /** Numbering configuration for lists, or false to remove numbering */
    readonly numbering?:
        | {
              /** Reference ID of the numbering definition to use */
              readonly reference: string;
              /** Level in the numbering hierarchy (0-8) */
              readonly level: number;
              /** Instance number for multiple lists with same reference */
              readonly instance?: number;
              /** Whether this is a custom numbering definition */
              readonly custom?: boolean;
          }
        | false;
} & ILevelParagraphStylePropertiesOptions;

export type IParagraphPropertiesOptionsBase = {
    /** Heading level (Heading1, Heading2, etc.) - applies predefined heading style */
    readonly heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    /** Whether to render text right-to-left for bidirectional languages */
    readonly bidirectional?: boolean;
    /** Whether to insert a page break before this paragraph */
    readonly pageBreakBefore?: boolean;
    /** Custom tab stop positions and alignments */
    readonly tabStops?: readonly TabStopDefinition[];
    /** Style ID to apply to this paragraph */
    readonly style?: string;
    /** Bullet list configuration */
    readonly bullet?: {
        /** Indentation level for the bullet (0-8) */
        readonly level: number;
    };
    /** Whether to prevent single lines at top/bottom of page (widow/orphan control) */
    readonly widowControl?: boolean;
    /** Frame properties for positioning the paragraph */
    readonly frame?: IFrameOptions;
    /** Whether to suppress line numbers for this paragraph */
    readonly suppressLineNumbers?: boolean;
    /** Whether to allow word wrapping */
    readonly wordWrap?: boolean;
    /** Whether to allow punctuation to extend beyond text margins */
    readonly overflowPunctuation?: boolean;
    /** Character scaling percentage (e.g., 200 for 200%) */
    readonly scale?: number;
    /**
     * This element specifies whether inter-character spacing shall automatically be adjusted between regions of numbers and regions of East Asian text in the current paragraph. These regions shall be determined by the Unicode character values of the text content within the paragraph.
     * This only works in Microsoft Word. It is not part of the ECMA-376 OOXML standard.
     */
    readonly autoSpaceEastAsianText?: boolean;
    /**
     * Run properties to apply to all runs in the paragraph.
     * Reference: ECMA-376, 3rd Edition (June, 2011), Fundamentals and Markup Language Reference § 17.3.1.29.
     */
    readonly run?: IParagraphRunOptions;
} & IParagraphStylePropertiesOptions;

export type IParagraphPropertiesChangeOptions = IChangedAttributesProperties & IParagraphPropertiesOptionsBase;

/**
 * Options for configuring paragraph properties.
 *
 * These options control all aspects of paragraph formatting including
 * alignment, spacing, indentation, borders, numbering, and more.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 */
export type IParagraphPropertiesOptions = {
    readonly revision?: IParagraphPropertiesChangeOptions;
    readonly includeIfEmpty?: boolean;
} & IParagraphPropertiesOptionsBase;

/**
 * Represents paragraph properties (pPr) in a WordprocessingML document.
 *
 * The paragraph properties element specifies all formatting applied to a paragraph,
 * including alignment, spacing, indentation, borders, numbering, and style references.
 *
 * Reference: http://officeopenxml.com/WPparagraphProperties.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PPr">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_PPrBase">
 *       <xsd:sequence>
 *         <xsd:element name="rPr" type="CT_ParaRPr" minOccurs="0"/>
 *         <xsd:element name="sectPr" type="CT_SectPr" minOccurs="0"/>
 *         <xsd:element name="pPrChange" type="CT_PPrChange" minOccurs="0"/>
 *       </xsd:sequence>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * The base type CT_PPrBase contains:
 * ```xml
 * <xsd:complexType name="CT_PPrBase">
 *   <xsd:sequence>
 *     <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="keepNext" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="keepLines" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="pageBreakBefore" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="framePr" type="CT_FramePr" minOccurs="0"/>
 *     <xsd:element name="widowControl" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="numPr" type="CT_NumPr" minOccurs="0"/>
 *     <xsd:element name="suppressLineNumbers" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="pBdr" type="CT_PBdr" minOccurs="0"/>
 *     <xsd:element name="shd" type="CT_Shd" minOccurs="0"/>
 *     <xsd:element name="tabs" type="CT_Tabs" minOccurs="0"/>
 *     <xsd:element name="suppressAutoHyphens" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="kinsoku" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="wordWrap" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="overflowPunct" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="topLinePunct" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="autoSpaceDE" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="autoSpaceDN" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="adjustRightInd" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="snapToGrid" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="spacing" type="CT_Spacing" minOccurs="0"/>
 *     <xsd:element name="ind" type="CT_Ind" minOccurs="0"/>
 *     <xsd:element name="contextualSpacing" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="mirrorIndents" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="suppressOverlap" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="jc" type="CT_Jc" minOccurs="0"/>
 *     <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
 *     <xsd:element name="textAlignment" type="CT_TextAlignment" minOccurs="0"/>
 *     <xsd:element name="textboxTightWrap" type="CT_TextboxTightWrap" minOccurs="0"/>
 *     <xsd:element name="outlineLvl" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="divId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="cnfStyle" type="CT_Cnf" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Basic paragraph with alignment
 * new ParagraphProperties({
 *   alignment: AlignmentType.CENTER,
 * });
 *
 * // Formatted paragraph with spacing and indentation
 * new ParagraphProperties({
 *   alignment: AlignmentType.JUSTIFIED,
 *   spacing: { before: 200, after: 200, line: 360 },
 *   indent: { left: 720, right: 720 },
 * });
 *
 * // Heading with outline level
 * new ParagraphProperties({
 *   heading: HeadingLevel.HEADING_1,
 *   outlineLevel: 0,
 *   keepNext: true,
 * });
 *
 * // Numbered list item
 * new ParagraphProperties({
 *   numbering: {
 *     reference: "my-numbering",
 *     level: 0,
 *     instance: 0,
 *   },
 * });
 *
 * // Paragraph with borders and shading
 * new ParagraphProperties({
 *   border: {
 *     top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *     bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *   },
 *   shading: { fill: "EEEEEE" },
 * });
 * ```
 */
export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly numberingReferences: { readonly reference: string; readonly instance: number }[] = [];

    public constructor(options?: IParagraphPropertiesOptions) {
        super("w:pPr", options?.includeIfEmpty);

        if (!options) {
            return this;
        }

        if (options.heading) {
            this.push(new Style(options.heading));
        }

        if (options.bullet) {
            this.push(new Style("ListParagraph"));
        }

        if (options.numbering) {
            if (!options.style && !options.heading) {
                if (!options.numbering.custom) {
                    this.push(new Style("ListParagraph"));
                }
            }
        }

        if (options.style) {
            this.push(new Style(options.style));
        }

        if (options.keepNext !== undefined) {
            this.push(new OnOffElement("w:keepNext", options.keepNext));
        }

        if (options.keepLines !== undefined) {
            this.push(new OnOffElement("w:keepLines", options.keepLines));
        }

        if (options.pageBreakBefore) {
            this.push(new PageBreakBefore());
        }

        if (options.frame) {
            this.push(createFrameProperties(options.frame));
        }

        if (options.widowControl !== undefined) {
            this.push(new OnOffElement("w:widowControl", options.widowControl));
        }

        if (options.bullet) {
            this.push(new NumberProperties(1, options.bullet.level));
        }

        if (options.numbering) {
            this.numberingReferences.push({
                reference: options.numbering.reference,
                instance: options.numbering.instance ?? 0,
            });

            this.push(new NumberProperties(`${options.numbering.reference}-${options.numbering.instance ?? 0}`, options.numbering.level));
        } else if (options.numbering === false) {
            this.push(new NumberProperties(0, 0));
        }

        if (options.border) {
            this.push(new Border(options.border));
        }

        if (options.thematicBreak) {
            this.push(new ThematicBreak());
        }

        if (options.shading) {
            this.push(new Shading(options.shading));
        }

        if (options.wordWrap) {
            this.push(new WordWrap());
        }

        if (options.overflowPunctuation) {
            this.push(new OnOffElement("w:overflowPunct", options.overflowPunctuation));
        }

        /**
         * FIX: Multitab support for Libre Writer
         * Ensure there is only one w:tabs tag with multiple w:tab
         */
        const tabDefinitions: readonly TabStopDefinition[] = [
            ...(options.rightTabStop !== undefined ? [{ type: TabStopType.RIGHT, position: options.rightTabStop }] : []),
            ...(options.tabStops ? options.tabStops : []),
            ...(options.leftTabStop !== undefined ? [{ type: TabStopType.LEFT, position: options.leftTabStop }] : []),
        ];

        if (tabDefinitions.length > 0) {
            this.push(new TabStop(tabDefinitions));
        }
        /**
         *  FIX - END
         */

        if (options.bidirectional !== undefined) {
            this.push(new OnOffElement("w:bidi", options.bidirectional));
        }

        if (options.spacing) {
            this.push(new Spacing(options.spacing));
        }

        if (options.indent) {
            this.push(new Indent(options.indent));
        }

        if (options.contextualSpacing !== undefined) {
            this.push(new OnOffElement("w:contextualSpacing", options.contextualSpacing));
        }

        if (options.alignment) {
            this.push(new Alignment(options.alignment));
        }

        if (options.outlineLevel !== undefined) {
            this.push(new OutlineLevel(options.outlineLevel));
        }

        if (options.suppressLineNumbers !== undefined) {
            this.push(new OnOffElement("w:suppressLineNumbers", options.suppressLineNumbers));
        }

        if (options.autoSpaceEastAsianText !== undefined) {
            this.push(new OnOffElement("w:autoSpaceDN", options.autoSpaceEastAsianText));
        }

        if (options.run) {
            this.push(new ParagraphRunProperties(options.run));
        }

        if (options.revision) {
            this.push(new ParagraphPropertiesChange(options.revision));
        }
    }

    /**
     * Adds a property element to the paragraph properties.
     *
     * @param item - The XML component to add to the paragraph properties
     */
    public push(item: XmlComponent): void {
        this.root.push(item);
    }

    /**
     * Prepares the paragraph properties for XML serialization.
     *
     * This method creates concrete numbering instances for any numbering references
     * before the properties are converted to XML.
     *
     * @param context - The XML context containing document and file information
     * @returns The prepared XML object, or undefined if the component should be ignored
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (!(context.viewWrapper instanceof FontWrapper)) {
            for (const reference of this.numberingReferences) {
                context.file.Numbering.createConcreteNumberingInstance(reference.reference, reference.instance);
            }
        }

        return super.prepForXml(context);
    }
}

export class ParagraphPropertiesChange extends XmlComponent {
    public constructor(options: IParagraphPropertiesChangeOptions) {
        super("w:pPrChange");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        // pPr is required (minOccurs="1") even if empty
        this.root.push(new ParagraphProperties({ ...options, includeIfEmpty: true }));
    }
}
