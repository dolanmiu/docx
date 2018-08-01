import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import * as paragraph from "../../paragraph";
import * as formatting from "../../paragraph/run/formatting";
import { RunProperties } from "../../paragraph/run/properties";

import { BasedOn, Link, Name, Next, QuickFormat, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";

export interface IStyleAttributes {
    type?: string;
    styleId?: string;
    default?: boolean;
    customStyle?: string;
}

class StyleAttributes extends XmlAttributeComponent<IStyleAttributes> {
    protected xmlKeys = {
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
    private readonly paragraphProperties: paragraph.ParagraphProperties;
    private readonly runProperties: RunProperties;

    constructor(styleId: string, name?: string) {
        super({ type: "paragraph", styleId: styleId }, name);
        this.paragraphProperties = new paragraph.ParagraphProperties();
        this.runProperties = new RunProperties();
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }

    public addParagraphProperty(property: XmlComponent): void {
        this.paragraphProperties.push(property);
    }

    public addRunProperty(property: XmlComponent): void {
        this.runProperties.push(property);
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
        this.addRunProperty(new formatting.Size(twips));
        this.addRunProperty(new formatting.SizeCs(twips));
        return this;
    }

    public bold(): ParagraphStyle {
        this.addRunProperty(new formatting.Bold());
        return this;
    }

    public italics(): ParagraphStyle {
        this.addRunProperty(new formatting.Italics());
        return this;
    }

    public smallCaps(): ParagraphStyle {
        this.addRunProperty(new formatting.SmallCaps());
        return this;
    }

    public allCaps(): ParagraphStyle {
        this.addRunProperty(new formatting.Caps());
        return this;
    }

    public strike(): ParagraphStyle {
        this.addRunProperty(new formatting.Strike());
        return this;
    }

    public doubleStrike(): ParagraphStyle {
        this.addRunProperty(new formatting.DoubleStrike());
        return this;
    }

    public subScript(): ParagraphStyle {
        this.addRunProperty(new formatting.SubScript());
        return this;
    }

    public superScript(): ParagraphStyle {
        this.addRunProperty(new formatting.SuperScript());
        return this;
    }

    public underline(underlineType?: string, color?: string): ParagraphStyle {
        this.addRunProperty(new formatting.Underline(underlineType, color));
        return this;
    }

    public color(color: string): ParagraphStyle {
        this.addRunProperty(new formatting.Color(color));
        return this;
    }

    public font(fontName: string): ParagraphStyle {
        this.addRunProperty(new formatting.RunFonts(fontName));
        return this;
    }

    // --------------------- Paragraph formatting ------------------------ //

    public center(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Alignment("center"));
        return this;
    }

    public left(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Alignment("left"));
        return this;
    }

    public right(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Alignment("right"));
        return this;
    }

    public justified(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Alignment("both"));
        return this;
    }

    public thematicBreak(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.ThematicBreak());
        return this;
    }

    public maxRightTabStop(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.MaxRightTabStop());
        return this;
    }

    public leftTabStop(position: number): ParagraphStyle {
        this.addParagraphProperty(new paragraph.LeftTabStop(position));
        return this;
    }

    public indent(attrs: object): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Indent(attrs));
        return this;
    }

    public spacing(params: paragraph.ISpacingProperties): ParagraphStyle {
        this.addParagraphProperty(new paragraph.Spacing(params));
        return this;
    }

    public keepNext(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.KeepNext());
        return this;
    }

    public keepLines(): ParagraphStyle {
        this.addParagraphProperty(new paragraph.KeepLines());
        return this;
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

    public addRunProperty(property: XmlComponent): void {
        this.runProperties.push(property);
    }

    public color(color: string): CharacterStyle {
        this.addRunProperty(new formatting.Color(color));
        return this;
    }

    public underline(underlineType?: string, color?: string): CharacterStyle {
        this.addRunProperty(new formatting.Underline(underlineType, color));
        return this;
    }

    public size(twips: number): CharacterStyle {
        this.addRunProperty(new formatting.Size(twips));
        this.addRunProperty(new formatting.SizeCs(twips));
        return this;
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
