import { Attributes, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import {
    Alignment,
    AlignmentType,
    Indent,
    KeepLines,
    KeepNext,
    Spacing,
    TabStop,
    TabStopType,
    ThematicBreak,
} from "../paragraph/formatting";
import { ParagraphProperties } from "../paragraph/properties";
import * as formatting from "../paragraph/run/formatting";
import { RunProperties } from "../paragraph/run/properties";
import { IParagraphStyleOptions2, IRunStyleOptions } from "../styles/style-options";

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
        readonly run?: IRunStyleOptions;
        readonly paragraph?: IParagraphStyleOptions2;
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

        this.paragraphProperties = new ParagraphProperties({});
        this.runProperties = new RunProperties();

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (suffix) {
            this.root.push(new Suffix(suffix));
        }

        if (style) {
            if (style.run) {
                if (style.run.size) {
                    this.runProperties.push(new formatting.Size(style.run.size));
                }

                if (style.run.bold) {
                    this.runProperties.push(new formatting.Bold());
                }

                if (style.run.italics) {
                    this.runProperties.push(new formatting.Italics());
                }

                if (style.run.smallCaps) {
                    this.runProperties.push(new formatting.SmallCaps());
                }

                if (style.run.allCaps) {
                    this.runProperties.push(new formatting.Caps());
                }

                if (style.run.strike) {
                    this.runProperties.push(new formatting.Strike());
                }

                if (style.run.doubleStrike) {
                    this.runProperties.push(new formatting.DoubleStrike());
                }

                if (style.run.subScript) {
                    this.runProperties.push(new formatting.SubScript());
                }

                if (style.run.superScript) {
                    this.runProperties.push(new formatting.SuperScript());
                }

                if (style.run.underline) {
                    this.runProperties.push(new formatting.Underline(style.run.underline.type, style.run.underline.color));
                }

                if (style.run.color) {
                    this.runProperties.push(new formatting.Color(style.run.color));
                }

                if (style.run.font) {
                    this.runProperties.push(new formatting.RunFonts(style.run.font));
                }

                if (style.run.highlight) {
                    this.runProperties.push(new formatting.Highlight(style.run.highlight));
                }

                if (style.run.shadow) {
                    this.runProperties.push(new formatting.Shading(style.run.shadow.type, style.run.shadow.fill, style.run.shadow.color));
                }
            }

            if (style.paragraph) {
                if (style.paragraph.alignment) {
                    this.paragraphProperties.push(new Alignment(style.paragraph.alignment));
                }

                if (style.paragraph.thematicBreak) {
                    this.paragraphProperties.push(new ThematicBreak());
                }

                if (style.paragraph.rightTabStop) {
                    this.paragraphProperties.push(new TabStop(TabStopType.RIGHT, style.paragraph.rightTabStop));
                }

                if (style.paragraph.leftTabStop) {
                    this.paragraphProperties.push(new TabStop(TabStopType.LEFT, style.paragraph.leftTabStop));
                }

                if (style.paragraph.indent) {
                    this.paragraphProperties.push(new Indent(style.paragraph.indent));
                }

                if (style.paragraph.spacing) {
                    this.paragraphProperties.push(new Spacing(style.paragraph.spacing));
                }

                if (style.paragraph.keepNext) {
                    this.paragraphProperties.push(new KeepNext());
                }

                if (style.paragraph.keepLines) {
                    this.paragraphProperties.push(new KeepLines());
                }
            }
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
