import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import {
    Alignment,
    AlignmentOptions,
    Indent,
    ISpacingProperties,
    KeepLines,
    KeepNext,
    LeftTabStop,
    MaxRightTabStop,
    Spacing,
    ThematicBreak,
} from "../paragraph/formatting";
import { ParagraphProperties } from "../paragraph/properties";
import * as formatting from "../paragraph/run/formatting";
import { RunProperties } from "../paragraph/run/properties";

interface ILevelAttributesProperties {
    readonly ilvl?: number;
    readonly tentative?: number;
}

class LevelAttributes extends XmlAttributeComponent<ILevelAttributesProperties> {
    protected readonly xmlKeys = {
        ilvl: "w:ilvl",
        tentative: "w15:tentative",
    };
}

class Start extends XmlComponent {
    constructor(value: number) {
        super("w:start");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class NumberFormat extends XmlComponent {
    constructor(value: string) {
        super("w:numFmt");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class LevelText extends XmlComponent {
    constructor(value: string) {
        super("w:lvlText");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

class LevelJc extends XmlComponent {
    constructor(value: string) {
        super("w:lvlJc");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

export enum LevelSuffix {
    NOTHING = "nothing",
    SPACE = "space",
    TAB = "tab",
}

class Suffix extends XmlComponent {
    constructor(value: LevelSuffix) {
        super("w:suff");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

export class LevelBase extends XmlComponent {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    constructor(level: number, start?: number, numberFormat?: string, levelText?: string, lvlJc?: string) {
        super("w:lvl");
        this.root.push(
            new LevelAttributes({
                ilvl: level,
                tentative: 1,
            }),
        );

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

    public setSuffix(value: LevelSuffix): LevelBase {
        this.root.push(new Suffix(value));
        return this;
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
        this.addParagraphProperty(new Alignment(AlignmentOptions.CENTER));
        return this;
    }

    public left(): Level {
        this.addParagraphProperty(new Alignment(AlignmentOptions.LEFT));
        return this;
    }

    public right(): Level {
        this.addParagraphProperty(new Alignment(AlignmentOptions.RIGHT));
        return this;
    }

    public justified(): Level {
        this.addParagraphProperty(new Alignment(AlignmentOptions.BOTH));
        return this;
    }

    public thematicBreak(): Level {
        this.addParagraphProperty(new ThematicBreak());
        return this;
    }

    public maxRightTabStop(): Level {
        this.addParagraphProperty(new MaxRightTabStop());
        return this;
    }

    public leftTabStop(position: number): Level {
        this.addParagraphProperty(new LeftTabStop(position));
        return this;
    }

    public indent(attrs: object): Level {
        this.addParagraphProperty(new Indent(attrs));
        return this;
    }

    public spacing(params: ISpacingProperties): Level {
        this.addParagraphProperty(new Spacing(params));
        return this;
    }

    public keepNext(): Level {
        this.addParagraphProperty(new KeepNext());
        return this;
    }

    public keepLines(): Level {
        this.addParagraphProperty(new KeepLines());
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
