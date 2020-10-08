// http://officeopenxml.com/WPparagraphProperties.php
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "file/xml-components";
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
import { OutlineLevel } from "./links";

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
        readonly custom?: boolean;
    };
}

export class ParagraphProperties extends IgnoreIfEmptyXmlComponent {
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
            if (!options.numbering.custom) {
                this.push(new Style("ListParagraph"));
            }
            this.push(new NumberProperties(options.numbering.reference, options.numbering.level));
        }

        if (options.rightTabStop) {
            this.push(new TabStop(TabStopType.RIGHT, options.rightTabStop));
        }

        if (options.leftTabStop) {
            this.push(new TabStop(TabStopType.LEFT, options.leftTabStop));
        }
    }

    public push(item: XmlComponent): void {
        this.root.push(item);
    }
}
