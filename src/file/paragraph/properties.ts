// http://officeopenxml.com/WPparagraphProperties.php
// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_suppressLineNumbers_topic_ID0ECJAO.html
import { IContext, IgnoreIfEmptyXmlComponent, IXmlableObject, OnOffElement, XmlComponent } from "@file/xml-components";
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
import { FrameProperties, IFrameOptions } from "./frame/frame-properties";
import { OutlineLevel } from "./links";

export interface ILevelParagraphStylePropertiesOptions {
    readonly alignment?: AlignmentType;
    readonly thematicBreak?: boolean;
    readonly contextualSpacing?: boolean;
    readonly rightTabStop?: number;
    readonly leftTabStop?: number;
    readonly indent?: IIndentAttributesProperties;
    readonly spacing?: ISpacingProperties;
    readonly keepNext?: boolean;
    readonly keepLines?: boolean;
    readonly outlineLevel?: number;
}

export interface IParagraphStylePropertiesOptions extends ILevelParagraphStylePropertiesOptions {
    readonly numbering?: {
        readonly reference: string;
        readonly level: number;
        readonly instance?: number;
        readonly custom?: boolean;
    };
}

export interface IParagraphPropertiesOptions extends IParagraphStylePropertiesOptions {
    readonly border?: IBordersOptions;
    readonly heading?: HeadingLevel;
    readonly bidirectional?: boolean;
    readonly pageBreakBefore?: boolean;
    readonly tabStops?: readonly TabStopDefinition[];
    readonly style?: string;
    readonly bullet?: {
        readonly level: number;
    };
    readonly shading?: IShadingAttributesProperties;
    readonly widowControl?: boolean;
    readonly frame?: IFrameOptions;
    readonly suppressLineNumbers?: boolean;
    readonly wordWrap?: boolean;
    readonly scale?: number;
}

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
            this.push(new FrameProperties(options.frame));
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

        /**
         * FIX: Multitab support for Libre Writer
         * Ensure there is only one w:tabs tag with multiple w:tab
         */
        const tabDefinitions: readonly TabStopDefinition[] = [
            ...(options.rightTabStop ? [{ type: TabStopType.RIGHT, position: options.rightTabStop }] : []),
            ...(options.tabStops ? options.tabStops : []),
            ...(options.leftTabStop ? [{ type: TabStopType.LEFT, position: options.leftTabStop }] : []),
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
