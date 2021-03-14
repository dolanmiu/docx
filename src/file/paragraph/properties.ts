// http://officeopenxml.com/WPparagraphProperties.php
import { IContext, IgnoreIfEmptyXmlComponent, IXmlableObject, XmlComponent } from "file/xml-components";
import { DocumentWrapper } from "../document-wrapper";
import { ShadingType } from "../table/shading";
import { Alignment, AlignmentType } from "./formatting/alignment";
import { Bidirectional } from "./formatting/bidirectional";
import { Border, IBorderOptions, ThematicBreak } from "./formatting/border";
import { IIndentAttributesProperties, Indent } from "./formatting/indent";
import { KeepLines, KeepNext } from "./formatting/keep";
import { PageBreakBefore } from "./formatting/page-break";
import { ContextualSpacing, ISpacingProperties, Spacing } from "./formatting/spacing";
import { HeadingLevel, Style } from "./formatting/style";
import { LeaderType, TabStop, TabStopPosition, TabStopType } from "./formatting/tab-stop";
import { NumberProperties } from "./formatting/unordered-list";
import { WidowControl } from "./formatting/widow-control";
import { FrameProperties, IFrameOptions } from "./frame/frame-properties";
import { OutlineLevel } from "./links";
import { Shading } from "./run/formatting";

export interface IParagraphStylePropertiesOptions {
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

export interface IParagraphPropertiesOptions extends IParagraphStylePropertiesOptions {
    readonly border?: IBorderOptions;
    readonly heading?: HeadingLevel;
    readonly bidirectional?: boolean;
    readonly pageBreakBefore?: boolean;
    readonly tabStops?: {
        readonly position: number | TabStopPosition;
        readonly type: TabStopType;
        readonly leader?: LeaderType;
    }[];
    readonly style?: string;
    readonly bullet?: {
        readonly level: number;
    };
    readonly numbering?: {
        readonly reference: string;
        readonly level: number;
        readonly instance?: number;
        readonly custom?: boolean;
    };
    readonly shading?: {
        readonly type: ShadingType;
        readonly fill: string;
        readonly color: string;
    };
    readonly widowControl?: boolean;
    readonly frame?: IFrameOptions;
}

export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
    private readonly numberingReferences: { readonly reference: string; readonly instance: number }[] = [];

    constructor(options?: IParagraphPropertiesOptions) {
        super("w:pPr");

        if (!options) {
            return;
        }

        if (options.border) {
            this.push(new Border(options.border));
        }

        if (options.spacing) {
            this.push(new Spacing(options.spacing));
        }

        if (options.outlineLevel !== undefined) {
            this.push(new OutlineLevel(options.outlineLevel));
        }

        if (options.alignment) {
            this.push(new Alignment(options.alignment));
        }

        if (options.heading) {
            this.push(new Style(options.heading));
        }

        if (options.bidirectional) {
            this.push(new Bidirectional());
        }

        if (options.thematicBreak) {
            this.push(new ThematicBreak());
        }

        if (options.pageBreakBefore) {
            this.push(new PageBreakBefore());
        }

        if (options.contextualSpacing) {
            this.push(new ContextualSpacing(options.contextualSpacing));
        }

        if (options.indent) {
            this.push(new Indent(options.indent));
        }

        if (options.keepLines) {
            this.push(new KeepLines());
        }

        if (options.keepNext) {
            this.push(new KeepNext());
        }

        if (options.tabStops) {
            for (const tabStop of options.tabStops) {
                this.push(new TabStop(tabStop.type, tabStop.position, tabStop.leader));
            }
        }

        if (options.style) {
            this.push(new Style(options.style));
        }

        if (options.bullet) {
            this.push(new Style("ListParagraph"));
            this.push(new NumberProperties(1, options.bullet.level));
        }

        if (options.numbering) {
            if (!options.style && !options.heading) {
                if (!options.numbering.custom) {
                    this.push(new Style("ListParagraph"));
                }
            }
            this.numberingReferences.push({
                reference: options.numbering.reference,
                instance: options.numbering.instance ?? 0,
            });

            this.push(new NumberProperties(`${options.numbering.reference}-${options.numbering.instance ?? 0}`, options.numbering.level));
        }

        if (options.rightTabStop) {
            this.push(new TabStop(TabStopType.RIGHT, options.rightTabStop));
        }

        if (options.leftTabStop) {
            this.push(new TabStop(TabStopType.LEFT, options.leftTabStop));
        }

        if (options.shading) {
            this.push(new Shading(options.shading.type, options.shading.fill, options.shading.color));
        }

        if (options.widowControl) {
            this.push(new WidowControl(options.widowControl));
        }

        if (options.frame) {
            this.push(new FrameProperties(options.frame));
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
