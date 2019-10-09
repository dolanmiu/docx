import {
    Alignment,
    AlignmentType,
    Indent,
    ISpacingProperties,
    KeepLines,
    KeepNext,
    OutlineLevel,
    ParagraphProperties,
    Spacing,
    ThematicBreak,
} from "file/paragraph";
import { IIndentAttributesProperties, TabStop, TabStopType } from "file/paragraph/formatting";
import * as formatting from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { UnderlineType } from "file/paragraph/run/underline";
import { ShadingType } from "file/table";

import { BasedOn, Link, Next, QuickFormat, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

export interface IBaseParagraphStyleOptions {
    readonly basedOn?: string;
    readonly next?: string;
    readonly quickFormat?: boolean;
    readonly link?: string;
    readonly semiHidden?: boolean;
    readonly uiPriority?: number;
    readonly unhideWhenUsed?: boolean;
    readonly run?: {
        readonly size?: number;
        readonly bold?: boolean;
        readonly italics?: boolean;
        readonly smallCaps?: boolean;
        readonly allCaps?: boolean;
        readonly strike?: boolean;
        readonly doubleStrike?: boolean;
        readonly subScript?: boolean;
        readonly superScript?: boolean;
        readonly underline?: {
            readonly type?: UnderlineType;
            readonly color?: string;
        };
        readonly color?: string;
        readonly font?: string;
        readonly characterSpacing?: number;
        readonly highlight?: string;
        readonly shadow?: {
            readonly type: ShadingType;
            readonly fill: string;
            readonly color: string;
        };
    };
    readonly paragraph?: {
        readonly alignment?: AlignmentType;
        readonly thematicBreak?: boolean;
        readonly rightTabStop?: number;
        readonly leftTabStop?: number;
        readonly indent?: IIndentAttributesProperties;
        readonly spacing?: ISpacingProperties;
        readonly keepNext?: boolean;
        readonly keepLines?: boolean;
        readonly outlineLevel?: number;
    };
}

export interface IParagraphStyleOptions extends IBaseParagraphStyleOptions {
    readonly id: string;
    readonly name?: string;
}
export class ParagraphStyle extends Style {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    constructor(options: IParagraphStyleOptions) {
        super({ type: "paragraph", styleId: options.id }, options.name);
        this.paragraphProperties = new ParagraphProperties({});
        this.runProperties = new RunProperties();
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (options.basedOn) {
            this.root.push(new BasedOn(options.basedOn));
        }

        if (options.next) {
            this.root.push(new Next(options.next));
        }

        if (options.quickFormat) {
            this.root.push(new QuickFormat());
        }

        if (options.link) {
            this.root.push(new Link(options.link));
        }

        if (options.semiHidden) {
            this.root.push(new SemiHidden());
        }

        if (options.uiPriority) {
            this.root.push(new UiPriority(options.uiPriority));
        }

        if (options.unhideWhenUsed) {
            this.root.push(new UnhideWhenUsed());
        }

        if (options.run) {
            if (options.run.size) {
                this.runProperties.push(new formatting.Size(options.run.size));
                this.runProperties.push(new formatting.SizeComplexScript(options.run.size));
            }

            if (options.run.bold) {
                this.runProperties.push(new formatting.Bold());
            }

            if (options.run.italics) {
                this.runProperties.push(new formatting.Italics());
            }

            if (options.run.smallCaps) {
                this.runProperties.push(new formatting.SmallCaps());
            }

            if (options.run.allCaps) {
                this.runProperties.push(new formatting.Caps());
            }

            if (options.run.strike) {
                this.runProperties.push(new formatting.Strike());
            }

            if (options.run.doubleStrike) {
                this.runProperties.push(new formatting.DoubleStrike());
            }

            if (options.run.subScript) {
                this.runProperties.push(new formatting.SubScript());
            }

            if (options.run.superScript) {
                this.runProperties.push(new formatting.SuperScript());
            }

            if (options.run.underline) {
                this.runProperties.push(new formatting.Underline(options.run.underline.type, options.run.underline.color));
            }

            if (options.run.color) {
                this.runProperties.push(new formatting.Color(options.run.color));
            }

            if (options.run.font) {
                this.runProperties.push(new formatting.RunFonts(options.run.font));
            }

            if (options.run.characterSpacing) {
                this.runProperties.push(new formatting.CharacterSpacing(options.run.characterSpacing));
            }

            if (options.run.highlight) {
                this.runProperties.push(new formatting.Highlight(options.run.highlight));
            }

            if (options.run.shadow) {
                this.runProperties.push(new formatting.Shading(options.run.shadow.type, options.run.shadow.fill, options.run.shadow.color));
            }
        }

        if (options.paragraph) {
            if (options.paragraph.alignment) {
                this.paragraphProperties.push(new Alignment(options.paragraph.alignment));
            }

            if (options.paragraph.thematicBreak) {
                this.paragraphProperties.push(new ThematicBreak());
            }

            if (options.paragraph.rightTabStop) {
                this.paragraphProperties.push(new TabStop(TabStopType.RIGHT, options.paragraph.rightTabStop));
            }

            if (options.paragraph.leftTabStop) {
                this.paragraphProperties.push(new TabStop(TabStopType.LEFT, options.paragraph.leftTabStop));
            }

            if (options.paragraph.indent) {
                this.paragraphProperties.push(new Indent(options.paragraph.indent));
            }

            if (options.paragraph.spacing) {
                this.paragraphProperties.push(new Spacing(options.paragraph.spacing));
            }

            if (options.paragraph.keepNext) {
                this.paragraphProperties.push(new KeepNext());
            }

            if (options.paragraph.keepLines) {
                this.paragraphProperties.push(new KeepLines());
            }

            if (options.paragraph.outlineLevel) {
                this.paragraphProperties.push(new OutlineLevel(options.paragraph.outlineLevel));
            }
        }
    }
}
