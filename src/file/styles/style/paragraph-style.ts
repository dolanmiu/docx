import {
    Alignment,
    AlignmentOptions,
    Indent,
    ISpacingProperties,
    KeepLines,
    KeepNext,
    LeftTabStop,
    MaxRightTabStop,
    OutlineLevel,
    ParagraphProperties,
    Spacing,
    ThematicBreak,
} from "file/paragraph";
import * as formatting from "file/paragraph/run/formatting";
import { RunProperties } from "file/paragraph/run/properties";
import { XmlComponent } from "file/xml-components";
import { BasedOn, Link, Next, QuickFormat, SemiHidden, UiPriority, UnhideWhenUsed } from "./components";
import { Style } from "./style";

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

    public outlineLevel(level: string): ParagraphStyle {
        this.paragraphProperties.push(new OutlineLevel(level));
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

    /*-------------- Style Properties -----------------*/

    public link(link: string): ParagraphStyle {
        this.root.push(new Link(link));
        return this;
    }

    public semiHidden(): ParagraphStyle {
        this.root.push(new SemiHidden());
        return this;
    }

    public uiPriority(priority: string): ParagraphStyle {
        this.root.push(new UiPriority(priority));
        return this;
    }

    public unhideWhenUsed(): ParagraphStyle {
        this.root.push(new UnhideWhenUsed());
        return this;
    }
}
