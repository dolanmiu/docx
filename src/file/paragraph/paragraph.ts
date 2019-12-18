// http://officeopenxml.com/WPparagraph.php
import { FootnoteReferenceRun } from "file/footnotes/footnote/run/reference-run";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { File } from "../file";
import { Alignment, AlignmentType } from "./formatting/alignment";
import { Bidirectional } from "./formatting/bidirectional";
import { IBorderOptions, ThematicBreak } from "./formatting/border";
import { IIndentAttributesProperties, Indent } from "./formatting/indent";
import { KeepLines, KeepNext } from "./formatting/keep";
import { PageBreak, PageBreakBefore } from "./formatting/page-break";
import { ContextualSpacing, ISpacingProperties, Spacing } from "./formatting/spacing";
import { HeadingLevel, Style } from "./formatting/style";
import { LeaderType, TabStop, TabStopPosition, TabStopType } from "./formatting/tab-stop";
import { NumberProperties } from "./formatting/unordered-list";
import { Bookmark, HyperlinkRef, OutlineLevel } from "./links";
import { ParagraphProperties } from "./properties";
import { PictureRun, Run, SequentialIdentifier, SymbolRun, TextRun } from "./run";

export interface IParagraphOptions {
    readonly text?: string;
    readonly border?: IBorderOptions;
    readonly spacing?: ISpacingProperties;
    readonly outlineLevel?: number;
    readonly alignment?: AlignmentType;
    readonly heading?: HeadingLevel;
    readonly bidirectional?: boolean;
    readonly thematicBreak?: boolean;
    readonly pageBreakBefore?: boolean;
    readonly contextualSpacing?: boolean;
    readonly indent?: IIndentAttributesProperties;
    readonly keepLines?: boolean;
    readonly keepNext?: boolean;
    readonly tabStops?: Array<{
        readonly position: number | TabStopPosition;
        readonly type: TabStopType;
        readonly leader?: LeaderType;
    }>;
    readonly style?: string;
    readonly bullet?: {
        readonly level: number;
    };
    readonly numbering?: {
        readonly reference: string;
        readonly level: number;
        readonly custom?: boolean;
    };
    readonly children?: Array<
        TextRun | PictureRun | SymbolRun | Bookmark | PageBreak | SequentialIdentifier | FootnoteReferenceRun | HyperlinkRef
    >;
}

export class Paragraph extends XmlComponent {
    private readonly properties: ParagraphProperties;

    constructor(options: string | PictureRun | IParagraphOptions) {
        super("w:p");

        if (typeof options === "string") {
            this.properties = new ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(new TextRun(options));
            return;
        }

        if (options instanceof PictureRun) {
            this.properties = new ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(options);
            return;
        }

        this.properties = new ParagraphProperties({
            border: options.border,
        });

        this.root.push(this.properties);

        if (options.text) {
            this.root.push(new TextRun(options.text));
        }

        if (options.spacing) {
            this.properties.push(new Spacing(options.spacing));
        }

        if (options.outlineLevel !== undefined) {
            this.properties.push(new OutlineLevel(options.outlineLevel));
        }

        if (options.alignment) {
            this.properties.push(new Alignment(options.alignment));
        }

        if (options.heading) {
            this.properties.push(new Style(options.heading));
        }

        if (options.bidirectional) {
            this.properties.push(new Bidirectional());
        }

        if (options.thematicBreak) {
            this.properties.push(new ThematicBreak());
        }

        if (options.pageBreakBefore) {
            this.properties.push(new PageBreakBefore());
        }

        if (options.contextualSpacing) {
            this.properties.push(new ContextualSpacing(options.contextualSpacing));
        }

        if (options.indent) {
            this.properties.push(new Indent(options.indent));
        }

        if (options.keepLines) {
            this.properties.push(new KeepLines());
        }

        if (options.keepNext) {
            this.properties.push(new KeepNext());
        }

        if (options.tabStops) {
            for (const tabStop of options.tabStops) {
                this.properties.push(new TabStop(tabStop.type, tabStop.position, tabStop.leader));
            }
        }

        if (options.style) {
            this.properties.push(new Style(options.style));
        }

        if (options.bullet) {
            this.properties.push(new Style("ListParagraph"));
            this.properties.push(new NumberProperties(1, options.bullet.level));
        }

        if (options.numbering) {
            if (!options.numbering.custom) {
                this.properties.push(new Style("ListParagraph"));
            }
            this.properties.push(new NumberProperties(options.numbering.reference, options.numbering.level));
        }

        if (options.children) {
            for (const child of options.children) {
                if (child instanceof Bookmark) {
                    this.root.push(child.start);
                    this.root.push(child.text);
                    this.root.push(child.end);
                    continue;
                }

                this.root.push(child);
            }
        }
    }

    public prepForXml(file: File): IXmlableObject | undefined {
        for (const element of this.root) {
            if (element instanceof HyperlinkRef) {
                const index = this.root.indexOf(element);
                this.root[index] = file.HyperlinkCache[element.id];
            }
        }

        return super.prepForXml();
    }

    public addRunToFront(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }
}
