/**
 * Numbering level definitions module for WordprocessingML documents.
 *
 * This module defines the formatting and behavior of individual levels within
 * a numbered or bulleted list hierarchy.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @module
 */
import { Attributes, NumberValueElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

import { AlignmentType } from "../paragraph/formatting";
import { type ILevelParagraphStylePropertiesOptions, ParagraphProperties } from "../paragraph/properties";
import { type IRunStylePropertiesOptions, RunProperties } from "../paragraph/run/properties";

/**
 * Number format types for list levels.
 *
 * Defines the various numbering formats available for list levels, including
 * decimal, roman numerals, letters, and various international formats.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @example
 * ```typescript
 * // Use decimal numbering (1, 2, 3...)
 * format: LevelFormat.DECIMAL
 *
 * // Use lowercase roman numerals (i, ii, iii...)
 * format: LevelFormat.LOWER_ROMAN
 *
 * // Use bullet points
 * format: LevelFormat.BULLET
 * ```
 *
 * @publicApi
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const LevelFormat = {
    /** Decimal numbering (1, 2, 3...). */
    DECIMAL: "decimal",
    /** Uppercase roman numerals (I, II, III...). */
    UPPER_ROMAN: "upperRoman",
    /** Lowercase roman numerals (i, ii, iii...). */
    LOWER_ROMAN: "lowerRoman",
    /** Uppercase letters (A, B, C...). */
    UPPER_LETTER: "upperLetter",
    /** Lowercase letters (a, b, c...). */
    LOWER_LETTER: "lowerLetter",
    /** Ordinal numbers (1st, 2nd, 3rd...). */
    ORDINAL: "ordinal",
    /** Cardinal text (one, two, three...). */
    CARDINAL_TEXT: "cardinalText",
    /** Ordinal text (first, second, third...). */
    ORDINAL_TEXT: "ordinalText",
    /** Hexadecimal numbering. */
    HEX: "hex",
    /** Chicago Manual of Style numbering. */
    CHICAGO: "chicago",
    /** Ideograph digital numbering. */
    IDEOGRAPH__DIGITAL: "ideographDigital",
    /** Japanese counting system. */
    JAPANESE_COUNTING: "japaneseCounting",
    /** Japanese aiueo ordering. */
    AIUEO: "aiueo",
    /** Japanese iroha ordering. */
    IROHA: "iroha",
    /** Full-width decimal numbering. */
    DECIMAL_FULL_WIDTH: "decimalFullWidth",
    /** Half-width decimal numbering. */
    DECIMAL_HALF_WIDTH: "decimalHalfWidth",
    /** Japanese legal numbering. */
    JAPANESE_LEGAL: "japaneseLegal",
    /** Japanese digital ten thousand numbering. */
    JAPANESE_DIGITAL_TEN_THOUSAND: "japaneseDigitalTenThousand",
    /** Decimal numbers enclosed in circles. */
    DECIMAL_ENCLOSED_CIRCLE: "decimalEnclosedCircle",
    /** Full-width decimal numbering variant 2. */
    DECIMAL_FULL_WIDTH2: "decimalFullWidth2",
    /** Full-width aiueo ordering. */
    AIUEO_FULL_WIDTH: "aiueoFullWidth",
    /** Full-width iroha ordering. */
    IROHA_FULL_WIDTH: "irohaFullWidth",
    /** Decimal with leading zeros. */
    DECIMAL_ZERO: "decimalZero",
    /** Bullet points. */
    BULLET: "bullet",
    /** Korean ganada ordering. */
    GANADA: "ganada",
    /** Korean chosung ordering. */
    CHOSUNG: "chosung",
    /** Decimal enclosed with fullstop. */
    DECIMAL_ENCLOSED_FULLSTOP: "decimalEnclosedFullstop",
    /** Decimal enclosed in parentheses. */
    DECIMAL_ENCLOSED_PARENTHESES: "decimalEnclosedParen",
    /** Decimal enclosed in circles (Chinese). */
    DECIMAL_ENCLOSED_CIRCLE_CHINESE: "decimalEnclosedCircleChinese",
    /** Ideograph enclosed in circles. */
    IDEOGRAPH_ENCLOSED_CIRCLE: "ideographEnclosedCircle",
    /** Traditional ideograph numbering. */
    IDEOGRAPH_TRADITIONAL: "ideographTraditional",
    /** Ideograph zodiac numbering. */
    IDEOGRAPH_ZODIAC: "ideographZodiac",
    /** Traditional ideograph zodiac numbering. */
    IDEOGRAPH_ZODIAC_TRADITIONAL: "ideographZodiacTraditional",
    /** Taiwanese counting system. */
    TAIWANESE_COUNTING: "taiwaneseCounting",
    /** Traditional ideograph legal numbering. */
    IDEOGRAPH_LEGAL_TRADITIONAL: "ideographLegalTraditional",
    /** Taiwanese counting thousand system. */
    TAIWANESE_COUNTING_THOUSAND: "taiwaneseCountingThousand",
    /** Taiwanese digital numbering. */
    TAIWANESE_DIGITAL: "taiwaneseDigital",
    /** Chinese counting system. */
    CHINESE_COUNTING: "chineseCounting",
    /** Simplified Chinese legal numbering. */
    CHINESE_LEGAL_SIMPLIFIED: "chineseLegalSimplified",
    /** Chinese counting thousand system. */
    CHINESE_COUNTING_THOUSAND: "chineseCountingThousand",
    /** Korean digital numbering. */
    KOREAN_DIGITAL: "koreanDigital",
    /** Korean counting system. */
    KOREAN_COUNTING: "koreanCounting",
    /** Korean legal numbering. */
    KOREAN_LEGAL: "koreanLegal",
    /** Korean digital numbering variant 2. */
    KOREAN_DIGITAL2: "koreanDigital2",
    /** Vietnamese counting system. */
    VIETNAMESE_COUNTING: "vietnameseCounting",
    /** Russian lowercase numbering. */
    RUSSIAN_LOWER: "russianLower",
    /** Russian uppercase numbering. */
    RUSSIAN_UPPER: "russianUpper",
    /** No numbering. */
    NONE: "none",
    /** Number enclosed in dashes. */
    NUMBER_IN_DASH: "numberInDash",
    /** Hebrew numbering variant 1. */
    HEBREW1: "hebrew1",
    /** Hebrew numbering variant 2. */
    HEBREW2: "hebrew2",
    /** Arabic alpha numbering. */
    ARABIC_ALPHA: "arabicAlpha",
    /** Arabic abjad numbering. */
    ARABIC_ABJAD: "arabicAbjad",
    /** Hindi vowels. */
    HINDI_VOWELS: "hindiVowels",
    /** Hindi consonants. */
    HINDI_CONSONANTS: "hindiConsonants",
    /** Hindi numbers. */
    HINDI_NUMBERS: "hindiNumbers",
    /** Hindi counting system. */
    HINDI_COUNTING: "hindiCounting",
    /** Thai letters. */
    THAI_LETTERS: "thaiLetters",
    /** Thai numbers. */
    THAI_NUMBERS: "thaiNumbers",
    /** Thai counting system. */
    THAI_COUNTING: "thaiCounting",
    /** Thai Baht text. */
    BAHT_TEXT: "bahtText",
    /** Dollar text. */
    DOLLAR_TEXT: "dollarText",
    /** Custom numbering format. */
    CUSTOM: "custom",
} as const;

/* eslint-enable */

/**
 * Attributes for numbering levels.
 */
class LevelAttributes extends XmlAttributeComponent<{
    /** The level index (0-8). */
    readonly ilvl?: number;
    /** Whether this level is tentative. */
    readonly tentative?: number;
}> {
    protected readonly xmlKeys = {
        ilvl: "w:ilvl",
        tentative: "w15:tentative",
    };
}

/**
 * Number format specification for a level.
 *
 * Specifies the numbering format to use (decimal, roman, letter, etc.).
 */
class NumberFormat extends XmlComponent {
    public constructor(value: string) {
        super("w:numFmt");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

/**
 * Level text template for displaying the numbering.
 *
 * The text can include placeholders like %1, %2, etc. to reference
 * numbering from different levels.
 */
class LevelText extends XmlComponent {
    public constructor(value: string) {
        super("w:lvlText");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

/**
 * Alignment specification for level numbering.
 */
class LevelJc extends XmlComponent {
    public constructor(value: (typeof AlignmentType)[keyof typeof AlignmentType]) {
        super("w:lvlJc");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

/**
 * Suffix types for list levels.
 *
 * Defines what follows the numbering text (tab, space, or nothing).
 *
 * @example
 * ```typescript
 * // Add a tab after the numbering
 * suffix: LevelSuffix.TAB
 *
 * // Add a space after the numbering
 * suffix: LevelSuffix.SPACE
 *
 * // No separator after the numbering
 * suffix: LevelSuffix.NOTHING
 * ```
 *
 * @publicApi
 */
export const LevelSuffix = {
    /** No separator after the numbering. */
    NOTHING: "nothing",
    /** Space character after the numbering. */
    SPACE: "space",
    /** Tab character after the numbering. */
    TAB: "tab",
} as const;

/**
 * Options for configuring a numbering level.
 *
 * @property level - Level index (0-8)
 * @property format - Number format type (decimal, roman, letter, etc.)
 * @property text - Level text template with placeholders like %1, %2
 * @property alignment - Text alignment for the numbering
 * @property start - Starting number for this level
 * @property suffix - Character(s) following the numbering (tab, space, nothing)
 * @property isLegalNumberingStyle - Use legal numbering style
 * @property style - Run and paragraph style properties
 */
export type ILevelsOptions = {
    /** Level index (0-8). */
    readonly level: number;
    /** Number format type (decimal, roman, letter, bullet, etc.). */
    readonly format?: (typeof LevelFormat)[keyof typeof LevelFormat];
    /** Level text template with placeholders like %1, %2. */
    readonly text?: string;
    /** Text alignment for the numbering. */
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    /** Starting number for this level. */
    readonly start?: number;
    /** Character(s) following the numbering. */
    readonly suffix?: (typeof LevelSuffix)[keyof typeof LevelSuffix];
    /** Use legal numbering style (e.g., 1.1.1). */
    readonly isLegalNumberingStyle?: boolean;
    /** Run and paragraph style properties. */
    readonly style?: {
        /** Run style properties for the numbering text. */
        readonly run?: IRunStylePropertiesOptions;
        /** Paragraph style properties for the level. */
        readonly paragraph?: ILevelParagraphStylePropertiesOptions;
    };
};

/**
 * Suffix specification for a level.
 *
 * Defines what character(s) follow the numbering text.
 */
class Suffix extends XmlComponent {
    public constructor(value: (typeof LevelSuffix)[keyof typeof LevelSuffix]) {
        super("w:suff");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

/**
 * Legal numbering style flag.
 *
 * When enabled, creates multi-level legal numbering like 1.1.1.
 *
 * Reference: http://officeopenxml.com/WPnumbering-isLgl.php
 */
class IsLegalNumberingStyle extends XmlComponent {
    public constructor() {
        super("w:isLgl");
    }
}

/**
 * Base class for numbering level definitions.
 *
 * Defines the formatting and behavior of a single level in a multi-level
 * numbering scheme. Each level can have its own numbering format, text template,
 * alignment, and styling.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Lvl">
 *   <xsd:sequence>
 *     <xsd:element name="start" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="numFmt" type="CT_NumFmt" minOccurs="0"/>
 *     <xsd:element name="lvlRestart" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="pStyle" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="isLgl" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="suff" type="CT_LevelSuffix" minOccurs="0"/>
 *     <xsd:element name="lvlText" type="CT_LevelText" minOccurs="0"/>
 *     <xsd:element name="lvlPicBulletId" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="legacy" type="CT_LvlLegacy" minOccurs="0"/>
 *     <xsd:element name="lvlJc" type="CT_Jc" minOccurs="0"/>
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
 *   <xsd:attribute name="tplc" type="ST_LongHexNumber" use="optional"/>
 *   <xsd:attribute name="tentative" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export class LevelBase extends XmlComponent {
    private readonly paragraphProperties: ParagraphProperties;
    private readonly runProperties: RunProperties;

    /**
     * Creates a new numbering level.
     *
     * @param options - Level configuration options
     * @throws Error if level is greater than 9 (Word limitation)
     */
    public constructor({
        level,
        format,
        text,
        alignment = AlignmentType.START,
        start = 1,
        style,
        suffix,
        isLegalNumberingStyle,
    }: ILevelsOptions) {
        super("w:lvl");

        this.root.push(new NumberValueElement("w:start", decimalNumber(start)));

        if (format) {
            this.root.push(new NumberFormat(format));
        }

        if (suffix) {
            this.root.push(new Suffix(suffix));
        }

        if (isLegalNumberingStyle) {
            this.root.push(new IsLegalNumberingStyle());
        }

        if (text) {
            this.root.push(new LevelText(text));
        }

        this.root.push(new LevelJc(alignment));

        this.paragraphProperties = new ParagraphProperties(style && style.paragraph);
        this.runProperties = new RunProperties(style && style.run);

        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);

        if (level > 9) {
            throw new Error(
                "Level cannot be greater than 9. Read more here: https://answers.microsoft.com/en-us/msoffice/forum/all/does-word-support-more-than-9-list-levels/d130fdcd-1781-446d-8c84-c6c79124e4d7",
            );
        }

        this.root.push(
            new LevelAttributes({
                ilvl: decimalNumber(level),
                tentative: 1,
            }),
        );
    }
}

/**
 * Represents a numbering level within an abstract numbering definition.
 *
 * This is the standard level definition used in abstract numbering definitions.
 * Each abstract numbering definition can contain up to 9 levels (0-8).
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @example
 * ```typescript
 * // Create a decimal numbered level
 * const level = new Level({
 *   level: 0,
 *   format: LevelFormat.DECIMAL,
 *   text: "%1.",
 *   alignment: AlignmentType.LEFT,
 *   start: 1,
 * });
 *
 * // Create a bullet level with custom styling
 * const bulletLevel = new Level({
 *   level: 0,
 *   format: LevelFormat.BULLET,
 *   text: "\u2022",
 *   alignment: AlignmentType.LEFT,
 *   style: {
 *     paragraph: {
 *       indent: { left: 720, hanging: 360 },
 *     },
 *   },
 * });
 * ```
 */
export class Level extends LevelBase {
    // This is the level that sits under abstractNum
}

/**
 * Represents a numbering level used in level overrides.
 *
 * This level type is used when overriding specific levels within a
 * concrete numbering instance.
 */
export class LevelForOverride extends LevelBase {}
