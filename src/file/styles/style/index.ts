import {
    Alignment,
    AlignmentOptions,
    Indent,
    ISpacingProperties,
    KeepLines,
    KeepNext,
    LeftTabStop,
    MaxRightTabStop,
    ParagraphProperties,
    Spacing,
    ThematicBreak,
} from "file/paragraph";
import * as formatting from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { BasedOn, Link, Name, Next, QuickFormat, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";

export interface IStyleAttributes {
    readonly type?: string;
    readonly styleId?: string;
    readonly default?: boolean;
    readonly customStyle?: string;
}

class StyleAttributes extends XmlAttributeComponent<IStyleAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        styleId: "w:styleId",
        default: "w:default",
        customStyle: "w:customStyle",
    };
}

export class Style extends XmlComponent {
    constructor(attributes: IStyleAttributes, name?: string) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (name) {
            this.root.push(new Name(name));
        }
    }

    public push(styleSegment: XmlComponent): void {
        this.root.push(styleSegment);
    }
}

export class ParagraphStyle extends Style {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    constructor(styleId: string, name?: string) {
        super({ type: "paragraph", styleId: styleId }, name);
        this.paragraphProperties = new ParagraphProperties();
        this.runProperties = new RunProperties();
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }

    public addParagraphProperty(property: XmlComponent): ParagraphStyle {
        this.paragraphProperties.push(property);
        return this;
    }

    public addRunProperty(property: XmlComponent): ParagraphStyle {
        this.runProperties.push(property);
        return this;
    }

    public basedOn(parentId: string): ParagraphStyle {
        this.root.push(new BasedOn(parentId));
        return this;
    }

    public quickFormat(): ParagraphStyle {
        this.root.push(new QuickFormat());
        return this;
    }

    public next(nextId: string): ParagraphStyle {
        this.root.push(new Next(nextId));
        return this;
    }

    // ----------  Run formatting ---------------------- //

    public size(twips: number): ParagraphStyle {
        return this.addRunProperty(new formatting.Size(twips)).addRunProperty(new formatting.SizeComplexScript(twips));
    }

    public bold(): ParagraphStyle {
        return this.addRunProperty(new formatting.Bold());
    }

    public italics(): ParagraphStyle {
        return this.addRunProperty(new formatting.Italics());
    }

    public smallCaps(): ParagraphStyle {
        return this.addRunProperty(new formatting.SmallCaps());
    }

    public allCaps(): ParagraphStyle {
        return this.addRunProperty(new formatting.Caps());
    }

    public strike(): ParagraphStyle {
        return this.addRunProperty(new formatting.Strike());
    }

    public doubleStrike(): ParagraphStyle {
        return this.addRunProperty(new formatting.DoubleStrike());
    }

    public subScript(): ParagraphStyle {
        return this.addRunProperty(new formatting.SubScript());
    }

    public superScript(): ParagraphStyle {
        return this.addRunProperty(new formatting.SuperScript());
    }

    public underline(underlineType?: string, color?: string): ParagraphStyle {
        return this.addRunProperty(new formatting.Underline(underlineType, color));
    }

    public color(color: string): ParagraphStyle {
        return this.addRunProperty(new formatting.Color(color));
    }

    public font(fontName: string): ParagraphStyle {
        return this.addRunProperty(new formatting.RunFonts(fontName));
    }

    public characterSpacing(value: number): ParagraphStyle {
        return this.addRunProperty(new formatting.CharacterSpacing(value));
    }

    // --------------------- Paragraph formatting ------------------------ //

    public center(): ParagraphStyle {
        return this.addParagraphProperty(new Alignment(AlignmentOptions.CENTER));
    }

    public left(): ParagraphStyle {
        return this.addParagraphProperty(new Alignment(AlignmentOptions.LEFT));
    }

    public right(): ParagraphStyle {
        return this.addParagraphProperty(new Alignment(AlignmentOptions.RIGHT));
    }

    public justified(): ParagraphStyle {
        return this.addParagraphProperty(new Alignment(AlignmentOptions.BOTH));
    }

    public thematicBreak(): ParagraphStyle {
        return this.addParagraphProperty(new ThematicBreak());
    }

    public maxRightTabStop(): ParagraphStyle {
        return this.addParagraphProperty(new MaxRightTabStop());
    }

    public leftTabStop(position: number): ParagraphStyle {
        return this.addParagraphProperty(new LeftTabStop(position));
    }

    public indent(attrs: object): ParagraphStyle {
        return this.addParagraphProperty(new Indent(attrs));
    }

    public spacing(params: ISpacingProperties): ParagraphStyle {
        return this.addParagraphProperty(new Spacing(params));
    }

    public keepNext(): ParagraphStyle {
        return this.addParagraphProperty(new KeepNext());
    }

    public keepLines(): ParagraphStyle {
        return this.addParagraphProperty(new KeepLines());
    }
}

export class HeadingStyle extends ParagraphStyle {
    constructor(styleId: string, name: string) {
        super(styleId, name);
        this.basedOn("Normal");
        this.next("Normal");
        this.quickFormat();
    }
}

export class TitleStyle extends HeadingStyle {
    constructor() {
        super("Title", "Title");
    }
}

export class Heading1Style extends HeadingStyle {
    constructor() {
        super("Heading1", "Heading 1");
    }
}

export class Heading2Style extends HeadingStyle {
    constructor() {
        super("Heading2", "Heading 2");
    }
}

export class Heading3Style extends HeadingStyle {
    constructor() {
        super("Heading3", "Heading 3");
    }
}

export class Heading4Style extends HeadingStyle {
    constructor() {
        super("Heading4", "Heading 4");
    }
}

export class Heading5Style extends HeadingStyle {
    constructor() {
        super("Heading5", "Heading 5");
    }
}

export class Heading6Style extends HeadingStyle {
    constructor() {
        super("Heading6", "Heading 6");
    }
}

export class ListParagraph extends ParagraphStyle {
    constructor() {
        super("ListParagraph");
        this.root.push(new Name("List Paragraph"));
        this.root.push(new BasedOn("Normal"));
        this.root.push(new QuickFormat());
    }
}

export class CharacterStyle extends Style {
    private readonly runProperties: RunProperties;

    constructor(styleId: string, name?: string) {
        super({ type: "character", styleId: styleId }, name);
        this.runProperties = new RunProperties();
        this.root.push(this.runProperties);
        this.root.push(new UiPriority("99"));
        this.root.push(new UnhideWhenUsed());
    }

    public basedOn(parentId: string): CharacterStyle {
        this.root.push(new BasedOn(parentId));
        return this;
    }

    public addRunProperty(property: XmlComponent): CharacterStyle {
        this.runProperties.push(property);
        return this;
    }

    public color(color: string): CharacterStyle {
        return this.addRunProperty(new formatting.Color(color));
    }

    public underline(underlineType?: string, color?: string): CharacterStyle {
        return this.addRunProperty(new formatting.Underline(underlineType, color));
    }

    public size(twips: number): CharacterStyle {
        return this.addRunProperty(new formatting.Size(twips)).addRunProperty(new formatting.SizeComplexScript(twips));
    }
}

export class HyperlinkStyle extends CharacterStyle {
    constructor() {
        super("Hyperlink", "Hyperlink");
        this.basedOn("DefaultParagraphFont")
            .color("0563C1")
            .underline("single");
    }
}

export class FootnoteReferenceStyle extends Style {
    private readonly runProperties: RunProperties;

    constructor() {
        super({ type: "character", styleId: "FootnoteReference" });
        this.root.push(new Name("footnote reference"));
        this.root.push(new BasedOn("DefaultParagraphFont"));
        this.root.push(new UiPriority("99"));
        this.root.push(new SemiHidden());
        this.root.push(new UnhideWhenUsed());

        this.runProperties = new RunProperties();
        this.runProperties.addChildElement(new formatting.SuperScript());
        this.root.push(this.runProperties);
    }
}

export class FootnoteText extends ParagraphStyle {
    constructor() {
        super("FootnoteText");
        this.root.push(new Name("footnote text"));
        this.root.push(new BasedOn("Normal"));
        this.root.push(new Link("FootnoteTextChar"));
        this.root.push(new UiPriority("99"));
        this.root.push(new SemiHidden());
        this.root.push(new UnhideWhenUsed());
        this.spacing({
            after: 0,
            line: 240,
            lineRule: "auto",
        });
        this.size(20);
    }
}

export class FootnoteTextChar extends CharacterStyle {
    constructor() {
        super("FootnoteTextChar", "Footnote Text Char");
        this.basedOn("DefaultParagraphFont");
        this.root.push(new Link("FootnoteText"));
        this.root.push(new UiPriority("99"));
        this.root.push(new SemiHidden());
        this.size(20);
    }
}
