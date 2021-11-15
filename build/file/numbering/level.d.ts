import { XmlComponent } from "../../file/xml-components";
import { AlignmentType } from "../paragraph/formatting";
import { ILevelParagraphStylePropertiesOptions } from "../paragraph/properties";
import { IRunStylePropertiesOptions } from "../paragraph/run/properties";
export declare enum LevelFormat {
    BULLET = "bullet",
    CARDINAL_TEXT = "cardinalText",
    CHICAGO = "chicago",
    DECIMAL = "decimal",
    DECIMAL_ENCLOSED_CIRCLE = "decimalEnclosedCircle",
    DECIMAL_ENCLOSED_FULLSTOP = "decimalEnclosedFullstop",
    DECIMAL_ENCLOSED_PARENTHESES = "decimalEnclosedParen",
    DECIMAL_ZERO = "decimalZero",
    LOWER_LETTER = "lowerLetter",
    LOWER_ROMAN = "lowerRoman",
    NONE = "none",
    ORDINAL_TEXT = "ordinalText",
    UPPER_LETTER = "upperLetter",
    UPPER_ROMAN = "upperRoman"
}
export declare enum LevelSuffix {
    NOTHING = "nothing",
    SPACE = "space",
    TAB = "tab"
}
export interface ILevelsOptions {
    readonly level: number;
    readonly format?: LevelFormat;
    readonly text?: string;
    readonly alignment?: AlignmentType;
    readonly start?: number;
    readonly suffix?: LevelSuffix;
    readonly style?: {
        readonly run?: IRunStylePropertiesOptions;
        readonly paragraph?: ILevelParagraphStylePropertiesOptions;
    };
    readonly levelRestart?: number;
}
export declare class LevelBase extends XmlComponent {
    private readonly paragraphProperties;
    private readonly runProperties;
    constructor({ level, format, text, alignment, start, style, suffix, levelRestart }: ILevelsOptions);
}
export declare class Level extends LevelBase {
    constructor(options: ILevelsOptions);
}
export declare class LevelForOverride extends LevelBase {
}
