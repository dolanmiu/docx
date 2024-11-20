// <xsd:simpleType name="ST_NumberFormat">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="decimal"/>
//   <xsd:enumeration value="upperRoman"/>
//   <xsd:enumeration value="lowerRoman"/>
//   <xsd:enumeration value="upperLetter"/>
//   <xsd:enumeration value="lowerLetter"/>
//   <xsd:enumeration value="ordinal"/>
//   <xsd:enumeration value="cardinalText"/>
//   <xsd:enumeration value="ordinalText"/>
//   <xsd:enumeration value="hex"/>
//   <xsd:enumeration value="chicago"/>
//   <xsd:enumeration value="ideographDigital"/>
//   <xsd:enumeration value="japaneseCounting"/>
//   <xsd:enumeration value="aiueo"/>
//   <xsd:enumeration value="iroha"/>
//   <xsd:enumeration value="decimalFullWidth"/>
//   <xsd:enumeration value="decimalHalfWidth"/>
//   <xsd:enumeration value="japaneseLegal"/>
//   <xsd:enumeration value="japaneseDigitalTenThousand"/>
//   <xsd:enumeration value="decimalEnclosedCircle"/>
//   <xsd:enumeration value="decimalFullWidth2"/>
//   <xsd:enumeration value="aiueoFullWidth"/>
//   <xsd:enumeration value="irohaFullWidth"/>
//   <xsd:enumeration value="decimalZero"/>
//   <xsd:enumeration value="bullet"/>
//   <xsd:enumeration value="ganada"/>
//   <xsd:enumeration value="chosung"/>
//   <xsd:enumeration value="decimalEnclosedFullstop"/>
//   <xsd:enumeration value="decimalEnclosedParen"/>
//   <xsd:enumeration value="decimalEnclosedCircleChinese"/>
//   <xsd:enumeration value="ideographEnclosedCircle"/>
//   <xsd:enumeration value="ideographTraditional"/>
//   <xsd:enumeration value="ideographZodiac"/>
//   <xsd:enumeration value="ideographZodiacTraditional"/>
//   <xsd:enumeration value="taiwaneseCounting"/>
//   <xsd:enumeration value="ideographLegalTraditional"/>
//   <xsd:enumeration value="taiwaneseCountingThousand"/>
//   <xsd:enumeration value="taiwaneseDigital"/>
//   <xsd:enumeration value="chineseCounting"/>
//   <xsd:enumeration value="chineseLegalSimplified"/>
//   <xsd:enumeration value="chineseCountingThousand"/>
//   <xsd:enumeration value="koreanDigital"/>
//   <xsd:enumeration value="koreanCounting"/>
//   <xsd:enumeration value="koreanLegal"/>
//   <xsd:enumeration value="koreanDigital2"/>
//   <xsd:enumeration value="vietnameseCounting"/>
//   <xsd:enumeration value="russianLower"/>
//   <xsd:enumeration value="russianUpper"/>
//   <xsd:enumeration value="none"/>
//   <xsd:enumeration value="numberInDash"/>
//   <xsd:enumeration value="hebrew1"/>
//   <xsd:enumeration value="hebrew2"/>
//   <xsd:enumeration value="arabicAlpha"/>
//   <xsd:enumeration value="arabicAbjad"/>
//   <xsd:enumeration value="hindiVowels"/>
//   <xsd:enumeration value="hindiConsonants"/>
//   <xsd:enumeration value="hindiNumbers"/>
//   <xsd:enumeration value="hindiCounting"/>
//   <xsd:enumeration value="thaiLetters"/>
//   <xsd:enumeration value="thaiNumbers"/>
//   <xsd:enumeration value="thaiCounting"/>
//   <xsd:enumeration value="bahtText"/>
//   <xsd:enumeration value="dollarText"/>
//   <xsd:enumeration value="custom"/>
// </xsd:restriction>
// </xsd:simpleType>

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
