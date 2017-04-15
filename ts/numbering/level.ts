import * as paragraph from "../docx/paragraph/formatting";
import { ParagraphProperties } from "../docx/paragraph/properties";
import * as formatting from "../docx/run/formatting";
import { RunProperties } from "../docx/run/properties";
import { Attributes, XmlAttributeComponent, XmlComponent } from "../docx/xml-components";

interface ILevelAttributesProperties {
    ilvl?: number;
    tentative?: number;
}

class LevelAttributes extends XmlAttributeComponent<ILevelAttributesProperties> {
    protected xmlKeys = {
        ilvl: "w:ilvl",
        tentative: "w15:tentative",
    };
}

class Start extends XmlComponent {

    constructor(value: number) {
        super("w:start");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class NumberFormat extends XmlComponent {

    constructor(value: string) {
        super("w:numFmt");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class LevelText extends XmlComponent {

    constructor(value: string) {
        super("w:lvlText");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class LevelJc extends XmlComponent {

    constructor(value: string) {
        super("w:lvlJc");
        this.root.push(new Attributes({
            val: value,
        }));
    }
}

class LevelBase extends XmlComponent {
    private paragraphProperties: ParagraphProperties;
    private runProperties: RunProperties;

    constructor(level: number, start?: number, numberFormat?: string, levelText?: string, lvlJc?: string) {
        super("w:lvl");
        this.root.push(new LevelAttributes({
            ilvl: level,
            tentative: 1,
        }));

        if (start !== undefined) {
            this.root.push(new Start(start));
        }
        if (numberFormat !== undefined) {
            this.root.push(new NumberFormat(numberFormat));
        }
        if (levelText !== undefined) {
            this.root.push(new LevelText(levelText));
        }
        if (lvlJc !== undefined) {
            this.root.push(new LevelJc(lvlJc));
        }

        this.paragraphProperties = new ParagraphProperties();
        this.runProperties = new RunProperties();

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }

    public addParagraphProperty(property: XmlComponent): Level {
        this.paragraphProperties.push(property);
        return this;
    }

    public addRunProperty(property: XmlComponent): Level {
        this.runProperties.push(property);
        return this;
    }

    // ----------  Run formatting ---------------------- //

    public size(twips: number): Level {
        this.addRunProperty(new formatting.Size(twips));
        return this;
    }

    public bold(): Level {
        this.addRunProperty(new formatting.Bold());
        return this;
    }

    public italics(): Level {
        this.addRunProperty(new formatting.Italics());
        return this;
    }

    public smallCaps(): Level {
        this.addRunProperty(new formatting.SmallCaps());
        return this;
    }

    public allCaps(): Level {
        this.addRunProperty(new formatting.Caps());
        return this;
    }

    public strike(): Level {
        this.addRunProperty(new formatting.Strike());
        return this;
    }

    public doubleStrike(): Level {
        this.addRunProperty(new formatting.DoubleStrike());
        return this;
    }

    public subScript(): Level {
        this.addRunProperty(new formatting.SubScript());
        return this;
    }

    public superScript(): Level {
        this.addRunProperty(new formatting.SuperScript());
        return this;
    }

    public underline(underlineType?: string, color?: string): Level {
        this.addRunProperty(new formatting.Underline(underlineType, color));
        return this;
    }

    public color(color: string): Level {
        this.addRunProperty(new formatting.Color(color));
        return this;
    }

    public font(fontName: string): Level {
        this.addRunProperty(new formatting.RunFonts(fontName));
        return this;
    }

    // --------------------- Paragraph formatting ------------------------ //

    public center(): Level {
        this.addParagraphProperty(new paragraph.Alignment("center"));
        return this;
    }

    public left(): Level {
        this.addParagraphProperty(new paragraph.Alignment("left"));
        return this;
    }

    public right(): Level {
        this.addParagraphProperty(new paragraph.Alignment("right"));
        return this;
    }

    public justified(): Level {
        this.addParagraphProperty(new paragraph.Alignment("both"));
        return this;
    }

    public thematicBreak(): Level {
        this.addParagraphProperty(new paragraph.ThematicBreak());
        return this;
    }

    public maxRightTabStop(): Level {
        this.addParagraphProperty(new paragraph.MaxRightTabStop());
        return this;
    }

    public leftTabStop(position: number): Level {
        this.addParagraphProperty(new paragraph.LeftTabStop(position));
        return this;
    }

    public indent(left: number, hanging?: number): Level {
        this.addParagraphProperty(new paragraph.Indent(left, hanging));
        return this;
    }

    public spacing(params: paragraph.ISpacingProperties): Level {
        this.addParagraphProperty(new paragraph.Spacing(params));
        return this;
    }

    public keepNext(): Level {
        this.addParagraphProperty(new paragraph.KeepNext());
        return this;
    }

    public keepLines(): Level {
        this.addParagraphProperty(new paragraph.KeepLines());
        return this;
    }
}

export class Level extends LevelBase {
    // This is the level that sits under abstractNum. We make a
    // handful of properties required
    constructor(level: number, numberFormat: string, levelText: string, lvlJc: string) {
        super(level, 1, numberFormat, levelText, lvlJc);
    }
}

export class LevelForOverride extends LevelBase {}
