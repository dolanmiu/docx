// http://officeopenxml.com/WPparagraphProperties.php
// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_suppressLineNumbers_topic_ID0ECJAO.html

import { IContext, IXmlableObject, IgnoreIfEmptyXmlComponent, OnOffElement, XmlComponent } from "@file/xml-components";

import { IRunOptions, RunProperties } from ".";
import { DocumentWrapper } from "../document-wrapper";
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

export type ILevelParagraphStylePropertiesOptions = {
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    readonly thematicBreak?: boolean;
    readonly contextualSpacing?: boolean;
    readonly rightTabStop?: number;
    readonly leftTabStop?: number;
    readonly indent?: IIndentAttributesProperties;
    readonly spacing?: ISpacingProperties;
    /**
     * Specifies that the paragraph (or at least part of it) should be rendered on the same page as the next paragraph when possible. If multiple paragraphs are to be kept together but they exceed a page, then the set of paragraphs begin on a new page and page breaks are used thereafter as needed.
     */
    readonly keepNext?: boolean;
    /**
     * Specifies that all lines of the paragraph are to be kept on a single page when possible.
     */
    readonly keepLines?: boolean;
    readonly outlineLevel?: number;
};

export type IParagraphStylePropertiesOptions = {
    readonly border?: IBordersOptions;
    readonly shading?: IShadingAttributesProperties;
    readonly numbering?:
        | {
              readonly reference: string;
              readonly level: number;
              readonly instance?: number;
              readonly custom?: boolean;
          }
        | false;
} & ILevelParagraphStylePropertiesOptions;

export type IParagraphPropertiesOptions = {
    readonly heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    readonly bidirectional?: boolean;
    readonly pageBreakBefore?: boolean;
    readonly tabStops?: readonly TabStopDefinition[];
    readonly style?: string;
    readonly bullet?: {
        readonly level: number;
    };
    readonly widowControl?: boolean;
    readonly frame?: IFrameOptions;
    readonly suppressLineNumbers?: boolean;
    readonly wordWrap?: boolean;
    readonly overflowPunctuation?: boolean;
    readonly scale?: number;
    /**
     * This element specifies whether inter-character spacing shall automatically be adjusted between regions of numbers and regions of East Asian text in the current paragraph. These regions shall be determined by the Unicode character values of the text content within the paragraph.
     * This only works in Microsoft Word. It is not part of the ECMA-376 OOXML standard.
     */
    readonly autoSpaceEastAsianText?: boolean;
    /**
     * Reference: ECMA-376, 3rd Edition (June, 2011), Fundamentals and Markup Language Reference § 17.3.1.29.
     */
    readonly run?: IRunOptions;
} & IParagraphStylePropertiesOptions;

export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly numberingReferences: { readonly reference: string; readonly instance: number }[] = [];

    public constructor(options?: IParagraphPropertiesOptions) {
        super("w:pPr");

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
            this.push(new RunProperties(options.run));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (context.viewWrapper instanceof DocumentWrapper) {
            for (const reference of this.numberingReferences) {
                context.file.Numbering.createConcreteNumberingInstance(reference.reference, reference.instance);
            }
        }

        return super.prepForXml(context);
    }
}
