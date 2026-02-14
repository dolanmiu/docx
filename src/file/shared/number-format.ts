/**
 * Number format module for WordprocessingML documents.
 *
 * This module provides number format constants for page numbers,
 * list numbering, and other numbered elements.
 *
 * Reference: http://officeopenxml.com/WPnumbering-numFmt.php
 *
 * @module
 */

/**
 * Number format types for page numbers and list numbering.
 *
 * Provides international number formats including decimal, Roman numerals,
 * alphabetic, and various Asian numbering systems.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_NumberFormat">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="decimal"/>
 *     <xsd:enumeration value="upperRoman"/>
 *     <xsd:enumeration value="lowerRoman"/>
 *     <xsd:enumeration value="upperLetter"/>
 *     <xsd:enumeration value="lowerLetter"/>
 *     <!-- ... many more formats ... -->
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * // Arabic numerals (1, 2, 3)
 * NumberFormat.DECIMAL;
 *
 * // Roman numerals (I, II, III)
 * NumberFormat.UPPER_ROMAN;
 *
 * // Letters (a, b, c)
 * NumberFormat.LOWER_LETTER;
 * ```
 */
export const NumberFormat = {
    DECIMAL: "decimal",
    UPPER_ROMAN: "upperRoman",
    LOWER_ROMAN: "lowerRoman",
    UPPER_LETTER: "upperLetter",
    LOWER_LETTER: "lowerLetter",
    ORDINAL: "ordinal",
    CARDINAL_TEXT: "cardinalText",
    ORDINAL_TEXT: "ordinalText",
    HEX: "hex",
    CHICAGO: "chicago",
    IDEOGRAPH_DIGITAL: "ideographDigital",
    JAPANESE_COUNTING: "japaneseCounting",
    AIUEO: "aiueo",
    IROHA: "iroha",
    DECIMAL_FULL_WIDTH: "decimalFullWidth",
    DECIMAL_HALF_WIDTH: "decimalHalfWidth",
    JAPANESE_LEGAL: "japaneseLegal",
    JAPANESE_DIGITAL_TEN_THOUSAND: "japaneseDigitalTenThousand",
    DECIMAL_ENCLOSED_CIRCLE: "decimalEnclosedCircle",
    DECIMAL_FULL_WIDTH_2: "decimalFullWidth2",
    AIUEO_FULL_WIDTH: "aiueoFullWidth",
    IROHA_FULL_WIDTH: "irohaFullWidth",
    DECIMAL_ZERO: "decimalZero",
    BULLET: "bullet",
    GANADA: "ganada",
    CHOSUNG: "chosung",
    DECIMAL_ENCLOSED_FULL_STOP: "decimalEnclosedFullstop",
    DECIMAL_ENCLOSED_PAREN: "decimalEnclosedParen",
    DECIMAL_ENCLOSED_CIRCLE_CHINESE: "decimalEnclosedCircleChinese",
    IDEOGRAPH_ENCLOSED_CIRCLE: "ideographEnclosedCircle",
    IDEOGRAPH_TRADITIONAL: "ideographTraditional",
    IDEOGRAPH_ZODIAC: "ideographZodiac",
    IDEOGRAPH_ZODIAC_TRADITIONAL: "ideographZodiacTraditional",
    TAIWANESE_COUNTING: "taiwaneseCounting",
    IDEOGRAPH_LEGAL_TRADITIONAL: "ideographLegalTraditional",
    TAIWANESE_COUNTING_THOUSAND: "taiwaneseCountingThousand",
    TAIWANESE_DIGITAL: "taiwaneseDigital",
    CHINESE_COUNTING: "chineseCounting",
    CHINESE_LEGAL_SIMPLIFIED: "chineseLegalSimplified",
    CHINESE_COUNTING_TEN_THOUSAND: "chineseCountingThousand",
    KOREAN_DIGITAL: "koreanDigital",
    KOREAN_COUNTING: "koreanCounting",
    KOREAN_LEGAL: "koreanLegal",
    KOREAN_DIGITAL_2: "koreanDigital2",
    VIETNAMESE_COUNTING: "vietnameseCounting",
    RUSSIAN_LOWER: "russianLower",
    RUSSIAN_UPPER: "russianUpper",
    NONE: "none",
    NUMBER_IN_DASH: "numberInDash",
    HEBREW_1: "hebrew1",
    HEBREW_2: "hebrew2",
    ARABIC_ALPHA: "arabicAlpha",
    ARABIC_ABJAD: "arabicAbjad",
    HINDI_VOWELS: "hindiVowels",
    HINDI_CONSONANTS: "hindiConsonants",
    HINDI_NUMBERS: "hindiNumbers",
    HINDI_COUNTING: "hindiCounting",
    THAI_LETTERS: "thaiLetters",
    THAI_NUMBERS: "thaiNumbers",
    THAI_COUNTING: "thaiCounting",
    BAHT_TEXT: "bahtText",
    DOLLAR_TEXT: "dollarText",
    //   <xsd:enumeration value="custom"/>
} as const;
