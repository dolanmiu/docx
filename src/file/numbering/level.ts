import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { AlignmentType } from "../paragraph/formatting";
import { IParagraphStylePropertiesOptions, ParagraphProperties } from "../paragraph/properties";
import { IRunStylePropertiesOptions, RunProperties } from "../paragraph/run/properties";

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
    constructor(value: AlignmentType) {
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

export interface ILevelsOptions {
    readonly level: number;
    readonly format?: string;
    readonly text?: string;
    readonly alignment?: AlignmentType;
    readonly start?: number;
    readonly suffix?: LevelSuffix;
    readonly style?: {
        readonly run?: IRunStylePropertiesOptions;
        readonly paragraph?: IParagraphStylePropertiesOptions;
    };
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

    constructor({ level, format, text, alignment = AlignmentType.START, start = 1, style, suffix }: ILevelsOptions) {
        super("w:lvl");
        this.root.push(
            new LevelAttributes({
                ilvl: level,
                tentative: 1,
            }),
        );

        this.root.push(new Start(start));
        this.root.push(new LevelJc(alignment));

        if (format) {
            this.root.push(new NumberFormat(format));
        }

        if (text) {
            this.root.push(new LevelText(text));
        }

        this.paragraphProperties = new ParagraphProperties(style && style.paragraph);
        this.runProperties = new RunProperties(style && style.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (suffix) {
            this.root.push(new Suffix(suffix));
        }
    }
}

export class Level extends LevelBase {
    // This is the level that sits under abstractNum. We make a
    // handful of properties required
    constructor(options: ILevelsOptions) {
        super(options);
    }
}

export class LevelForOverride extends LevelBase {}
