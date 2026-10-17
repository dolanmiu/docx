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
import type { SectionProperties } from "@file/document/body/section-properties/section-properties";
import { listKey } from "@file/numbering/list-key";
import type { NumberingDefinition } from "@file/numbering/numbering";
import { ChangeAttributes, type IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { type IContext, type IXmlableObject, IgnoreIfEmptyXmlComponent, OnOffElement, XmlComponent } from "@file/xml-components";
import { uniqueNumericIdCreator } from "@util/convenience-functions";

import { type IParagraphRunOptions, ParagraphRunProperties } from ".";
import { FontWrapper } from "../fonts/font-wrapper";
import { type IShadingAttributesProperties, createShading } from "../shading";
import { type AlignmentType, createAlignment } from "./formatting/alignment";
import { Border, type IBordersOptions, ThematicBreak } from "./formatting/border";
import { PageBreakBefore } from "./formatting/break";
import { type IIndentAttributesProperties, createIndent } from "./formatting/indent";
import { type ISpacingProperties, createSpacing } from "./formatting/spacing";
import { type HeadingLevel, createParagraphStyle } from "./formatting/style";
import { type TabStopDefinition, TabStopType, createTabStop } from "./formatting/tab-stop";
import { NumberProperties } from "./formatting/unordered-list";
import { createWordWrap } from "./formatting/word-wrap";
import { type IFrameOptions, createFrameProperties } from "./frame/frame-properties";
import { createOutlineLevel } from "./links";

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
              /**
               * The list the paragraph is in: the reference of one of the document's `numbering` configs, or a list's
               * definition, its reference and its levels, for a list the document's `numbering` option doesn't have.
               * The definition is added to the document's numbering when the paragraph is written, unless it already has
               * a list with that reference, which is kept
               */
              readonly reference: string | NumberingDefinition;
              /** Level in the numbering hierarchy (0-8) */
              readonly level: number;
              /**
               * Which list of this reference the paragraph is in. Paragraphs with the same `instance` are one list, numbered
               * on from each other, and a new `instance` starts a new list, at every level's `start` (`1` by default).
               * Paragraphs that leave it out are in the list that the last paragraph to `restart` it started, or, before
               * any did, the first list of the reference
               */
              readonly instance?: number;
              /**
               * Whether the paragraph starts its list again, numbering it and the paragraphs after it from every level's
               * `start` (`1` by default), as when a list carries on after other paragraphs, such as a heading, and should
               * count from 1 again. The paragraphs after it that leave out `instance` continue the restarted list, until a
               * paragraph restarts it again. Has no effect with `instance`, which says the list itself.
               * Only affects document paragraphs; style, numbering level and document default definitions are not in a list.
               */
              readonly restart?: boolean;
              /**
               * Whether the numbering is fully custom, in which case the paragraph is not given the
               * built-in `ListParagraph` style. Only affects document paragraphs; style, numbering level
               * and document default definitions never receive that style.
               */
              readonly custom?: boolean;
          }
        | false;
} & ILevelParagraphStylePropertiesOptions;

export type IParagraphPropertiesOptionsBase = {
    /** Heading level (Heading1, Heading2, etc.) - applies predefined heading style */
    readonly heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    /**
     * Whether to lay the paragraph out right-to-left, for languages such as Arabic and Hebrew.
     * A right-to-left paragraph starts on the right of the page, so it is right-aligned unless `alignment` says otherwise.
     * `alignment` `LEFT` and `RIGHT` still mean those sides of the page, while `START` and `END` follow the paragraph's direction.
     */
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
 * Options that control how a {@link ParagraphProperties} element is assembled, as opposed to what it contains.
 */
export type IParagraphPropertiesConfig = {
    /**
     * Whether `bullet` and `numbering` paragraphs that do not name a style of their own are given
     * Word's built-in `ListParagraph` style through an implicit `w:pStyle`.
     *
     * This is the default for document paragraphs, so that list items pick up the built-in list formatting.
     * Paragraph style, numbering level and document default definitions must pass `false`: a `w:pStyle`
     * inside a definition is not how a definition inherits from another style (that is `basedOn`), and
     * Word has been observed to fall back to `ListParagraph` instead of applying the custom style when it finds one there.
     *
     * @default true
     */
    readonly implicitListParagraphStyle?: boolean;
    /**
     * Whether the paragraph has a place in the order of its part's lists, where a `numbering.restart` starts its list
     * again for it and the paragraphs after it.
     *
     * This is the default for document paragraphs. Paragraph style, numbering level and document default definitions,
     * and the earlier formatting a revision keeps, must pass `false`: they are not where the list is in the part, so they
     * leave `restart` out and do not move the paragraphs after them onto another list.
     *
     * @default true
     */
    readonly inListOrder?: boolean;
};

/**
 * The restarted list that paragraphs leaving out `instance` are in, by list reference, for each part being written, as
 * the id of the restart. A paragraph that restarts a list moves the paragraphs after it in the part onto its own list,
 * and before any does, they are in instance 0. Each part is written
 * with a context of its own, so the lists of one part, or of the same part written again, start from the first list.
 */
const currentRestartedLists = new WeakMap<IContext, ReadonlyMap<string, number>>();

const restartedListIds = uniqueNumericIdCreator();

type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];

/**
 * The alignment to write for each side of the page in a right-to-left paragraph.
 *
 * Word and LibreOffice read `w:jc` `left` and `right` as the start and end of the paragraph, the same as
 * `start` and `end` (ISO/IEC 29500-4 maps the transitional `left` and `right` onto the strict `start` and `end`,
 * and [MS-OE376] 2.3.1.13 notes the same for Word 2007). So in a `w:bidi` paragraph `left` lands on the right
 * side of the page. Swapping keeps `AlignmentType.LEFT` and `AlignmentType.RIGHT` on the side of the page they name.
 * `left` and `right` are written rather than `end` and `start` because Word 2007 does not know `start` and `end`.
 */
const RIGHT_TO_LEFT_ALIGNMENTS: Partial<Record<AlignmentValue, AlignmentValue>> = {
    left: "right",
    right: "left",
};

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
    private readonly numbering?: {
        readonly reference: string;
        readonly level: number;
        readonly instance?: number;
        /** The id of the restart, for a paragraph that restarts its list */
        readonly restartedListId?: number;
        readonly definition?: NumberingDefinition;
    };
    /** The paragraph's `w:numPr`, which is written again with its list's id each time the paragraph is written */
    // eslint-disable-next-line functional/prefer-readonly-type
    private numberProperties?: NumberProperties;

    /**
     * Creates paragraph properties.
     *
     * @param options - The paragraph formatting to emit
     * @param config - Controls how the element is assembled; see {@link IParagraphPropertiesConfig}
     */
    public constructor(
        options?: IParagraphPropertiesOptions,
        { implicitListParagraphStyle = true, inListOrder = true }: IParagraphPropertiesConfig = {},
    ) {
        super("w:pPr", options?.includeIfEmpty);

        if (!options) {
            return this;
        }

        if (options.heading) {
            this.push(createParagraphStyle(options.heading));
        }

        if (implicitListParagraphStyle) {
            if (options.bullet) {
                this.push(createParagraphStyle("ListParagraph"));
            }

            if (options.numbering && !options.numbering.custom && !options.style && !options.heading) {
                this.push(createParagraphStyle("ListParagraph"));
            }
        }

        if (options.style) {
            this.push(createParagraphStyle(options.style));
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
            const { reference: list, instance, level, restart } = options.numbering;
            const reference = typeof list === "string" ? list : list.reference;
            const numberProperties = new NumberProperties(listKey(reference, instance ?? 0), level);
            this.numbering = {
                reference,
                level,
                instance,
                restartedListId: restart && inListOrder && instance === undefined ? restartedListIds() : undefined,
                definition: typeof list === "string" ? undefined : list,
            };
            this.numberProperties = numberProperties;

            this.push(numberProperties);
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
            this.push(createShading(options.shading));
        }

        if (options.wordWrap) {
            this.push(createWordWrap());
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
            this.push(createTabStop(tabDefinitions));
        }
        /**
         *  FIX - END
         */

        if (options.bidirectional !== undefined) {
            this.push(new OnOffElement("w:bidi", options.bidirectional));
        }

        if (options.spacing) {
            this.push(createSpacing(options.spacing));
        }

        if (options.indent) {
            this.push(createIndent(options.indent));
        }

        if (options.contextualSpacing !== undefined) {
            this.push(new OnOffElement("w:contextualSpacing", options.contextualSpacing));
        }

        if (options.alignment) {
            this.push(createAlignment((options.bidirectional && RIGHT_TO_LEFT_ALIGNMENTS[options.alignment]) || options.alignment));
        }

        if (options.outlineLevel !== undefined) {
            this.push(createOutlineLevel(options.outlineLevel));
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
     * Adds the section properties (`w:sectPr`) of the section this paragraph ends.
     *
     * They go after the paragraph's run properties and before its revision (`w:pPrChange`),
     * the order CT_PPr gives them.
     *
     * @param sectionProperties - The properties of the section the paragraph ends
     */
    public addSectionProperties(sectionProperties: SectionProperties): void {
        const revisionIndex = this.root.findIndex((item) => item instanceof ParagraphPropertiesChange);
        if (revisionIndex === -1) {
            this.root.push(sectionProperties);
            return;
        }
        this.root.splice(revisionIndex, 0, sectionProperties);
    }

    /**
     * Removes the section properties added with {@link addSectionProperties}.
     *
     * @param sectionProperties - The properties of the section to remove
     */
    public removeSectionProperties(sectionProperties: SectionProperties): void {
        const index = this.root.indexOf(sectionProperties);
        if (index !== -1) {
            this.root.splice(index, 1);
        }
    }

    /**
     * Prepares the paragraph properties for XML serialization.
     *
     * This method works out which list instance a numbered paragraph is in, from where it is in its part when it
     * leaves out `instance`, and creates the concrete numbering instance for it before the properties are converted to XML.
     *
     * @param context - The XML context containing document and file information
     * @returns The prepared XML object, or undefined if the component should be ignored
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.numbering) {
            const { reference, level, instance = 0, definition } = this.numbering;
            const restartedListId =
                this.numbering.instance === undefined
                    ? (this.numbering.restartedListId ?? currentRestartedLists.get(context)?.get(reference))
                    : undefined;

            if (this.numbering.restartedListId !== undefined) {
                currentRestartedLists.set(
                    context,
                    new Map([...(currentRestartedLists.get(context) ?? []), [reference, this.numbering.restartedListId]]),
                );
            }

            if (!(context.viewWrapper instanceof FontWrapper)) {
                context.file.Numbering.createConcreteNumberingInstance(reference, instance, definition, restartedListId);
            }

            // The paragraph's place in its part's lists is only known now, so its list id is written for it here. It can
            // differ each time the paragraph is written, such as in another part, so the last one written is replaced
            const numberProperties = new NumberProperties(listKey(reference, instance, restartedListId), level);
            this.root.splice(this.root.indexOf(this.numberProperties!), 1, numberProperties);
            // eslint-disable-next-line functional/immutable-data
            this.numberProperties = numberProperties;
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
        this.root.push(new ParagraphProperties({ ...options, includeIfEmpty: true }, { inListOrder: false }));
    }
}
