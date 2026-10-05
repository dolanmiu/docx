/**
 * Writes numbers as Word writes list and page numbers in each of its formats (`ST_NumberFormat`). What Word writes was
 * read from PDFs Word saved of the probes in `scripts/layout-probes/word-page-number-formats*.ts`.
 *
 * @module
 */
// cspell:disable

/**
 * The largest number written in any format but decimal. Word's list numbers start over past it (32768 is "I" in roman
 * numerals), and its page numbers past it haven't been seen
 */
const LARGEST = 32767;

/** Writes a number in a format */
type Writer = (value: number) => string;

const ROMAN: readonly (readonly [number, string])[] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
];

const roman = (value: number): string =>
    ROMAN.reduce(
        ({ rest, text }, [amount, numeral]) => ({
            rest: rest % amount,
            text: text + numeral.repeat(Math.floor(rest / amount)),
        }),
        { rest: value, text: "" },
    ).text;

/**
 * Letters of an alphabet as Word writes them: each letter in turn, then each twice, then three times and so on, as a to
 * z, aa to zz, aaa. Characters of more than one code point, such as the Devanagari vowels with a sign, are strings
 */
const repeated =
    (alphabet: readonly string[]): Writer =>
    (value) =>
        alphabet[(value - 1) % alphabet.length].repeat(Math.ceil(value / alphabet.length));

/** Letters of an alphabet in turn, starting from the first again after the last */
const cycled =
    (alphabet: readonly string[]): Writer =>
    (value) =>
        alphabet[(value - 1) % alphabet.length];

/** Each decimal digit of the number written with the digits given, from 0 to 9 */
const digits =
    (set: readonly string[]): Writer =>
    (value) =>
        [...String(value)].map((digit) => set[Number(digit)]).join("");

/** The first of a run of characters for 1 to the last number given, such as ① to ⑳, and decimal numbers past them */
const enclosed =
    (first: number, last: number): Writer =>
    (value) =>
        value >= 1 && value <= last ? String.fromCodePoint(first + value - 1) : String(value);

/** One of the characters given for 1 to the last of them, and decimal numbers past them */
const listed =
    (set: readonly string[]): Writer =>
    (value) =>
        value >= 1 && value <= set.length ? set[value - 1] : String(value);

// Eleventh, twelfth and thirteenth end in "th", as the other numbers in the teens do
const ordinalSuffix = (value: number): string =>
    value % 100 >= 11 && value % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th");

const ONES = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** A number in English words, as "one hundred one" and "twenty-one", without "and" */
const words = (value: number): string => {
    if (value < 20) {
        return ONES[value];
    }
    if (value < 100) {
        return TENS[Math.floor(value / 10)] + (value % 10 > 0 ? `-${ONES[value % 10]}` : "");
    }
    const [amount, name] = value < 1000 ? [100, "hundred"] : [1000, "thousand"];
    const rest = value % amount;
    return `${words(Math.floor(value / amount))} ${name}${rest > 0 ? ` ${words(rest)}` : ""}`;
};

const ORDINAL_WORDS: Readonly<Record<string, string>> = {
    one: "first",
    two: "second",
    three: "third",
    five: "fifth",
    eight: "eighth",
    nine: "ninth",
    twelve: "twelfth",
};

/** A number in English ordinal words, such as "twenty-first": the last word made ordinal */
const ordinalWords = (value: number): string =>
    words(value).replace(/[a-z]+$/, (last) => ORDINAL_WORDS[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`));

/** How a counting system of China, Japan or Korea writes numbers with characters for tens, hundreds and so on */
type Counting = {
    /** The digits from 0 to 9. The 0 is written for 0, and between digits for those left out when `zero` is set */
    readonly digits: readonly string[];
    /** The characters for ten, a hundred and a thousand */
    readonly units: readonly string[];
    /** The character for ten thousand */
    readonly myriad: string;
    /** Whether a 1 before ten, a hundred or a thousand is left out: everywhere, or only in 10 to 19 */
    readonly omitOne: "always" | "teens" | "never";
    /** Whether a 1 before ten thousand is left out */
    readonly omitOneMyriad?: boolean;
    /** Whether a 0 is written where digits are left out between others, once, as in 一百〇一 for 101 */
    readonly zero?: boolean;
};

/** A group of up to four digits in a counting system. A 1 before ten is left out of a number that starts with 10 to 19 */
const countGroup = (value: number, counting: Counting, startsNumber: boolean): string => {
    const { digits: set, units, omitOne, zero } = counting;
    const places = [3, 2, 1, 0]
        .map((place) => ({ place, digit: Math.floor(value / 10 ** place) % 10 }))
        .filter(({ digit }, index, all) => digit > 0 || all.slice(0, index).some((before) => before.digit > 0));
    return places
        .map(({ place, digit }, index) => {
            if (digit === 0) {
                // One 0 for those left out, before the next digit that isn't 0
                const next = places.slice(index + 1).find((other) => other.digit > 0);
                return zero && next && places[index - 1].digit > 0 ? set[0] : "";
            }
            const leftOut =
                digit === 1 && place > 0 && (omitOne === "always" || (omitOne === "teens" && place === 1 && startsNumber && index === 0));
            return (leftOut ? "" : set[digit]) + (place > 0 ? units[place - 1] : "");
        })
        .join("");
};

const count =
    (counting: Counting): Writer =>
    (value) => {
        if (value === 0) {
            return counting.digits[0];
        }
        const high = Math.floor(value / 10000);
        const low = value % 10000;
        const highText = high === 0 ? "" : (high === 1 && counting.omitOneMyriad ? "" : countGroup(high, counting, true)) + counting.myriad;
        // A 0 between ten thousands and fewer than a thousand, as in 一万〇一 for 10001
        const gap = high > 0 && low > 0 && low < 1000 && counting.zero ? counting.digits[0] : "";
        return highText + gap + (low > 0 ? countGroup(low, counting, high === 0) : "");
    };

const CJK_DIGITS = [..."〇一二三四五六七八九"];
const TAIWANESE_DIGITS = [..."○一二三四五六七八九"];
const JAPANESE_COUNTING: Counting = { digits: CJK_DIGITS, units: [..."十百千"], myriad: "万", omitOne: "always" };
const CHINESE_COUNTING: Counting = { digits: CJK_DIGITS, units: [..."十百千"], myriad: "万", omitOne: "teens", zero: true };
const KOREAN_COUNTING: Counting = {
    digits: [..."영일이삼사오육칠팔구"],
    units: [..."십백천"],
    myriad: "만",
    omitOne: "always",
    omitOneMyriad: true,
};

/** Chinese counting under 100, and digits from 100, as Word writes chineseCounting and taiwaneseCounting */
const countingUnderHundred =
    (set: readonly string[]): Writer =>
    (value) =>
        value < 100 ? count({ ...CHINESE_COUNTING, digits: set })(value) : digits(set)(value);

const KOREAN_ONES = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const KOREAN_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];

/** Korean's own words for 1 to 99, and Sino-Korean numbers from 100 */
const koreanLegal = (value: number): string =>
    value === 0 ? "0" : value < 100 ? KOREAN_TENS[Math.floor(value / 10)] + KOREAN_ONES[value % 10] : count(KOREAN_COUNTING)(value);

const VIETNAMESE = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

/** A number up to 1000 in Vietnamese words */
const vietnamese = (value: number): string => {
    if (value === 1000) {
        return "một ngàn";
    }
    const ones = value % 10;
    const tens = Math.floor(value / 10) % 10;
    if (value >= 100) {
        const rest = value % 100;
        const restText = rest === 0 ? "" : rest < 10 ? ` lẻ ${VIETNAMESE[rest]}` : ` ${vietnamese(rest)}`;
        return `${VIETNAMESE[Math.floor(value / 100)]} trăm${restText}`;
    }
    if (value < 10) {
        return VIETNAMESE[value];
    }
    // After a ten, 5 is "lăm", and after twenty and more, 1 is "mốt"
    const onesText = ones === 0 ? "" : ` ${ones === 5 ? "lăm" : ones === 1 && tens > 1 ? "mốt" : VIETNAMESE[ones]}`;
    return (tens === 1 ? "mười" : `${VIETNAMESE[tens]} mươi`) + onesText;
};

const HEBREW_HUNDREDS = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
const HEBREW_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HEBREW_ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];

/** Hebrew numerals, in which 15 and 16 are written ט״ו and ט״ז, without the marks */
const hebrewNumerals = (value: number): string => {
    const rest = value % 100;
    const tensAndOnes = rest === 15 ? "טו" : rest === 16 ? "טז" : HEBREW_TENS[Math.floor(rest / 10)] + HEBREW_ONES[rest % 10];
    return HEBREW_HUNDREDS[Math.floor(value / 100)] + tensAndOnes;
};

const HEBREW_LETTERS = [..."אבגדהוזחטיכלמנסעפצקרשת"];

/** The Hebrew alphabet, and past its end, a tav for each time through it before the letter */
const hebrewLetters = (value: number): string =>
    "ת".repeat(Math.floor((value - 1) / HEBREW_LETTERS.length)) + HEBREW_LETTERS[(value - 1) % HEBREW_LETTERS.length];

/** Writes nothing for 0, as Word does in the formats of letters and symbols that repeat */
const orNothing =
    (write: Writer): Writer =>
    (value) =>
        value === 0 ? "" : write(value);

/** Writes the decimal 0 for 0, as Word does in the formats of syllables that go round */
const orZero =
    (write: Writer): Writer =>
    (value) =>
        value === 0 ? "0" : write(value);

/** How a format, and the numbers it writes as Word does: from the smallest to the largest */
type Format = readonly [write: Writer, smallest: number, largest: number];

const format = (write: Writer, smallest = 0, largest = LARGEST): Format => [write, smallest, largest];

const LOWER_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"];
const UPPER_LETTERS = LOWER_LETTERS.map((letter) => letter.toUpperCase());
const RUSSIAN = [..."абвгдежзиклмнопрстуфхцчшщыэюя"];
const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Each format's numbers, as Word writes them in lists. 0 is written in each as Word writes it, which is nothing in
 * roman numerals and letters, and the decimal 0 in the formats of letters that go round. Word's lists of letters start
 * over past 30 times through the alphabet (780 is 30 z's, and 1234 is 18 l's), except the Arabic and Hebrew ones, which
 * start over from 784, and the Hindi ones, from 912.
 */
const FORMATS: Readonly<Record<string, Format>> = {
    decimal: format(String, 0, Infinity),
    decimalZero: format((value) => (value < 10 ? `0${value}` : String(value))),
    numberInDash: format((value) => `- ${value} -`),
    ordinal: format((value) => `${value}${ordinalSuffix(value)}`),
    cardinalText: format((value) => capitalized(words(value))),
    ordinalText: format((value) => capitalized(ordinalWords(value))),
    hex: format((value) => value.toString(16).toUpperCase(), 0, 0xffff),
    upperRoman: format((value) => roman(value).toUpperCase()),
    lowerRoman: format(roman),
    upperLetter: format(orNothing(repeated(UPPER_LETTERS)), 0, 780),
    lowerLetter: format(orNothing(repeated(LOWER_LETTERS)), 0, 780),
    russianUpper: format(orNothing(repeated(RUSSIAN.map((letter) => letter.toUpperCase()))), 0, 870),
    russianLower: format(orNothing(repeated(RUSSIAN)), 0, 870),
    // Word writes 1 as أ, with a hamza, in both Arabic alphabets
    arabicAlpha: format(orNothing(repeated([..."أبتثجحخدذرزسشصضطظعغفقكلمنهوي"])), 0, 783),
    arabicAbjad: format(orNothing(repeated([..."أبجدهوزحطيكلمنسعفصقرشتثخذضظغ"])), 0, 783),
    // Word's hindiVowels are the consonants, and its hindiConsonants the vowels
    hindiVowels: format(orNothing(repeated([..."कखगघङचछजझञटठडढणतथदधनऩपफबभमयरऱलळऴवशषसह"])), 0, 911),
    hindiConsonants: format(orNothing(repeated([..."अआइईउऊऋऌऍऎएऐऑऒओऔ", "अं", "अः"])), 0, 911),
    thaiLetters: format(orNothing(repeated([..."กขคงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ"])), 0, 1230),
    hebrew1: format(orNothing(hebrewNumerals), 0, 783),
    hebrew2: format(orNothing(hebrewLetters), 0, 783),
    chicago: format(orNothing(repeated([..."*†‡§"])), 0, 120),
    aiueo: format(orZero(cycled([..."ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ"]))),
    aiueoFullWidth: format(
        orZero(cycled([..."アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"])),
    ),
    // Iroha has two letters with no half-width forms, which Word writes full width
    iroha: format(orZero(cycled([..."ｲﾛﾊﾆﾎﾍﾄﾁﾘﾇﾙｦﾜｶﾖﾀﾚｿﾂﾈﾅﾗﾑｳヰﾉｵｸﾔﾏｹﾌｺｴﾃｱｻｷﾕﾒﾐｼヱﾋﾓｾｽﾝ"]))),
    irohaFullWidth: format(
        orZero(cycled([..."イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセスン"])),
    ),
    ganada: format(orZero(cycled([..."가나다라마바사아자차카타파하"]))),
    chosung: format(orZero(cycled([..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"]))),
    decimalHalfWidth: format(String),
    decimalFullWidth: format(digits([..."０１２３４５６７８９"])),
    decimalFullWidth2: format(digits([..."０１２３４５６７８９"])),
    hindiNumbers: format(digits([..."०१२३४५६७८९"])),
    thaiNumbers: format(digits([..."๐๑๒๓๔๕๖๗๘๙"])),
    ideographDigital: format(digits(CJK_DIGITS)),
    // Word's lists write nothing from 10000
    japaneseDigitalTenThousand: format(digits(CJK_DIGITS), 0, 9999),
    taiwaneseDigital: format(digits(TAIWANESE_DIGITS)),
    koreanDigital: format(digits([..."영일이삼사오육칠팔구"])),
    // Word writes 0 alone as the compatibility character U+F9B2, and the 0 in 10 as U+96F6
    koreanDigital2: format((value) => (value === 0 ? "\uF9B2" : digits([..."零一二三四五六七八九"])(value))),
    japaneseCounting: format(count(JAPANESE_COUNTING)),
    japaneseLegal: format(count({ digits: [..."〇壱弐参四伍六七八九"], units: [..."拾百阡"], myriad: "萬", omitOne: "never" })),
    chineseCountingThousand: format(count(CHINESE_COUNTING)),
    taiwaneseCountingThousand: format(count({ ...CHINESE_COUNTING, digits: [..."零一二三四五六七八九"], myriad: "萬" })),
    ideographLegalTraditional: format(
        count({ digits: [..."零壹貳參肆伍陸柒捌玖"], units: [..."拾佰仟"], myriad: "萬", omitOne: "never", zero: true }),
    ),
    chineseLegalSimplified: format(
        count({ digits: [..."零壹贰叁肆伍陆柒捌玖"], units: [..."拾佰仟"], myriad: "萬", omitOne: "never", zero: true }),
    ),
    chineseCounting: format(countingUnderHundred(TAIWANESE_DIGITS)),
    taiwaneseCounting: format(countingUnderHundred(TAIWANESE_DIGITS)),
    koreanCounting: format(count(KOREAN_COUNTING)),
    koreanLegal: format(koreanLegal),
    // Word writes 1001 and more as other numbers, such as không for 1001, and 234 for 1234 in lists
    vietnameseCounting: format(vietnamese, 0, 1000),
    decimalEnclosedCircle: format(enclosed(0x2460, 20)),
    decimalEnclosedFullstop: format(enclosed(0x2488, 20)),
    decimalEnclosedParen: format(enclosed(0x2474, 20)),
    decimalEnclosedCircleChinese: format(enclosed(0x2460, 10)),
    ideographEnclosedCircle: format(enclosed(0x3220, 10)),
    ideographTraditional: format(listed([..."甲乙丙丁戊己庚辛壬癸"])),
    // Word writes the eleventh branch as 戍, rather than 戌
    ideographZodiac: format(listed([..."子丑寅卯辰巳午未申酉戍亥"])),
    ideographZodiacTraditional: format((value) =>
        value === 0 ? "0" : [..."甲乙丙丁戊己庚辛壬癸"][(value - 1) % 10] + [..."子丑寅卯辰巳午未申酉戍亥"][(value - 1) % 12],
    ),
    bahtText: format(String),
    dollarText: format(String),
    bullet: format(() => ""),
    none: format(() => ""),
};

/**
 * Where Word writes a page number differently from a list number: words without a capital, digits in
 * taiwaneseCountingThousand, decimal numbers for bullets, and fewer numbers in some formats, past which it writes an
 * error ("Error! Number cannot be represented in specified format."), nothing, or other letters, none of which are
 * written here. That is any page number in none, 0 in Chicago's symbols, Hebrew, Arabic, Hindi and Thai digits, and the
 * page numbers in Hebrew and Hindi letters that are more than the most seen in Word: 100 of Hebrew's, 75 of hindiVowels
 * and 37 of hindiConsonants. Its pages in the other formats were the same as its lists.
 */
const PAGE_FORMATS: Readonly<Record<string, Format>> = {
    ...Object.fromEntries(Object.entries(FORMATS).filter(([name]) => name !== "none")),
    cardinalText: format(words),
    ordinalText: format(ordinalWords),
    taiwaneseCountingThousand: format(digits(TAIWANESE_DIGITS)),
    bullet: format(String),
    chicago: format(FORMATS.chicago[0], 1, FORMATS.chicago[2]),
    hebrew1: format(FORMATS.hebrew1[0], 1, 100),
    hebrew2: format(FORMATS.hebrew2[0], 1, 100),
    arabicAlpha: format(FORMATS.arabicAlpha[0], 1, FORMATS.arabicAlpha[2]),
    arabicAbjad: format(FORMATS.arabicAbjad[0], 1, FORMATS.arabicAbjad[2]),
    hindiVowels: format(FORMATS.hindiVowels[0], FORMATS.hindiVowels[1], 75),
    hindiConsonants: format(FORMATS.hindiConsonants[0], FORMATS.hindiConsonants[1], 37),
    hindiNumbers: format(FORMATS.hindiNumbers[0], 1, FORMATS.hindiNumbers[2]),
    thaiNumbers: format(FORMATS.thaiNumbers[0], 1, FORMATS.thaiNumbers[2]),
};

const writeIn = (formats: Readonly<Record<string, Format>>, value: number, name: string): string | undefined => {
    const found: Format | undefined = formats[name];
    if (!found) {
        return undefined;
    }
    const [write, smallest, largest] = found;
    return Number.isInteger(value) && value >= smallest && value <= largest ? write(value) : undefined;
};

/**
 * A number in one of Word's number formats as it writes list numbers and notes, such as `"iv"` for 4 in `lowerRoman`, or
 * undefined for numbers and formats it doesn't write as Word does: those of formats whose text from Word isn't known,
 * and those past where Word's lists start over.
 */
export const formatNumber = (value: number, name = "decimal"): string | undefined => writeIn(FORMATS, value, name);

/**
 * The formats Word has been seen to write list numbers in, past those of notes too: Thai and Hindi words, from 1 to 5
 * (`scripts/layout-probes/stops2/word-stops-numbers.ts` NF6)
 */
const LIST_FORMATS: Readonly<Record<string, Format>> = {
    ...FORMATS,
    // cspell:disable-next-line
    thaiCounting: format(listed(["หนึ่ง", "สอง", "สาม", "สี่", "ห้า"]), 1, 5),
    // cspell:disable-next-line
    hindiCounting: format(listed(["एक", "दो", "तीन", "चार", "पाँच"]), 1, 5),
};

/** A list's number in one of Word's number formats, as {@link formatNumber}, in those Word has been seen to write lists in too */
export const formatListNumber = (value: number, name = "decimal"): string | undefined => writeIn(LIST_FORMATS, value, name);

/**
 * A page number in one of Word's number formats, as it writes it in page numbers and page references, or undefined for
 * those it doesn't write as Word does.
 */
export const formatPageNumber = (value: number, name = "decimal"): string | undefined => writeIn(PAGE_FORMATS, value, name);

// The largest number a field writes in letters, 30 times through the alphabet. Word writes an error for 781
const LARGEST_FIELD_LETTERS = 780;

/**
 * The number formats of a field's `\*` switch, by their names in small letters, as Word writes a SEQ field's number in
 * them (`scripts/layout-probes/word-seq.ts`) and a page reference's and a number of pages' (`word-watertight-fields.ts`
 * FD3), as `field-number-formats.ts` in docx writes them, and whether the capitals of their names say those of the number.
 * Word wrote page 1 as "one", "one and 00/100", "first" and "1" in CardText, DollarText, OrdText and Hex
 * (`scripts/layout-probes/stops2/word-stops-numbers.ts` NF2), in the words it writes page numbers in, without a capital.
 * It writes hexadecimal numbers in capitals ("1CA" for 458, its help says, as its page numbers are), and whether a name
 * in small letters, `hex`, writes them in small letters hasn't been seen
 */
const FIELD_FORMATS: ReadonlyMap<string, { readonly written: Format; readonly inCase: boolean }> = new Map([
    ["arabic", { written: format(String, 0, Infinity), inCase: false }],
    ["roman", { written: format(roman), inCase: true }],
    ["alphabetic", { written: format(orNothing(repeated(LOWER_LETTERS)), 0, LARGEST_FIELD_LETTERS), inCase: true }],
    ["ordinal", { written: format((value) => `${value}${ordinalSuffix(value)}`, 1, Infinity), inCase: false }],
    ["arabicdash", { written: format((value) => `- ${value} -`, 0, Infinity), inCase: false }],
    ["cardtext", { written: PAGE_FORMATS.cardinalText, inCase: false }],
    ["ordtext", { written: PAGE_FORMATS.ordinalText, inCase: false }],
    ["dollartext", { written: format((value) => `${words(value)} and 00/100`), inCase: false }],
    ["hex", { written: PAGE_FORMATS.hex, inCase: false }],
]);

/** Whether a field's `\*` switch is one of the number formats {@link formatFieldNumber} writes, in any capitals */
export const isFieldNumberFormat = (name: string): boolean => FIELD_FORMATS.has(name.toLowerCase());

/**
 * A number as a field writes it with a format of its `\*` switch, such as `"x"` for 10 in `roman`, or undefined for
 * those Word's text isn't known for. Word writes roman numerals and letters in small letters when the format's name
 * starts with a small letter, as `roman`, and in capitals otherwise, as `Roman` and `ROMAN`.
 */
export const formatFieldNumber = (value: number, name: string): string | undefined => {
    const found = FIELD_FORMATS.get(name.toLowerCase());
    if (!found) {
        return undefined;
    }
    const [write, smallest, largest] = found.written;
    const written = Number.isInteger(value) && value >= smallest && value <= largest ? write(value) : undefined;
    const inCapitals = name.charAt(0) === name.charAt(0).toUpperCase();
    if (name.toLowerCase() === "hex") {
        return inCapitals || !/[A-F]/.test(written ?? "") ? written : undefined;
    }
    return found.inCase && inCapitals ? written?.toUpperCase() : written;
};

/** The capitals a field's `\*` switch writes its text in: all capitals, all small letters, or a capital first */
export type FieldCapitals = "upper" | "lower" | "firstcap";

/**
 * How a field writes its result: its number in a format of its `\*` switch (`numberFormat`), such as `roman`, or with a
 * picture of its `\#` switch, such as `00`, and its text in the capitals of a `\*` switch, such as `Upper`
 */
export type FieldFormat = { readonly numberFormat?: string; readonly picture?: string; readonly capitals?: FieldCapitals };

/**
 * A picture of a field's `\#` switch whose text Word is known to write: text in single quotes before and after the
 * number; the number's places, of digits (`0`), digits only where the number has them (`#`), first a place that drops
 * the number's digits before it (`x`), and commas between thousands; and a decimal point, with places of digits after
 * it (`0`). Word wrote `00`, `000`, `0`, `#` and `#,##0` (`scripts/layout-probes/word-page-fields.ts` PF5 to PF7), and
 * `0.00`, `x##` and `'p'00` (`scripts/layout-probes/stops2/word-stops-numbers.ts` NF3)
 */
const PICTURE = /^((?:'[^']*')*)(x[#0,]*|[#0,]*[#0][#0,]*)(?:\.(0+))?((?:'[^']*')*)$/;

/** Whether Word's text for a picture of a field's `\#` switch is known (see {@link PICTURE}) */
export const isFieldPicture = (picture: string): boolean => PICTURE.test(picture);

/**
 * A number with a picture: with as many digits as it has `0`s at least, which Word fills with 0s (5 is 05 with `00`), a
 * space for each `#` or `x` the number has no digit for (1 is three spaces and 1 with `#,##0`, and two spaces and 1 with
 * `x##`), its thousands between commas when it has one (1234 is 1,234 with `#,##0`), 0s after its decimal point (1.00
 * with `0.00`), and the text in quotes before and after it (p01 with `'p'00`), as Word wrote them (NF3). Undefined where
 * `x` would drop digits, and for 0 with no `0` in the picture, which haven't been seen
 */
const inPicture = (value: number, picture: string): string | undefined => {
    const [, before, whole, fraction = "", after] = PICTURE.exec(picture)!;
    const zeros = [...whole].filter((character) => character === "0").length;
    const places = [...whole].filter((character) => character !== ",").length;
    const figures = String(value).padStart(zeros, "0");
    if ((whole.startsWith("x") && figures.length > places) || (zeros === 0 && value === 0)) {
        return undefined;
    }
    const grouped = whole.includes(",") ? figures.replace(/\B(?=(\d{3})+$)/g, ",") : figures;
    const unquoted = (text: string): string => text.replace(/'([^']*)'/g, "$1");
    return `${unquoted(before)}${" ".repeat(Math.max(0, places - figures.length))}${grouped}${fraction === "" ? "" : `.${fraction}`}${unquoted(after)}`;
};

/** Whether a field's format writes its number, rather than only giving its text capitals */
export const writesNumber = ({ numberFormat, picture }: FieldFormat = {}): boolean => numberFormat !== undefined || picture !== undefined;

/**
 * A field's number in its format, which {@link writesNumber} says writes it, with a number format or a picture, or
 * undefined where Word's text for it isn't known
 */
export const writeFieldNumber = (value: number, { numberFormat, picture }: FieldFormat): string | undefined =>
    picture === undefined ? formatFieldNumber(value, numberFormat!) : inPicture(value, picture);

/**
 * A field's text in the capitals of its format, applied after its number's format, as Word wrote `\* roman \* Upper` as V,
 * `\* Ordinal \* Upper` as 5TH, and "above" with `\* Upper` as ABOVE (`word-page-fields.ts` PF3 and PF5)
 */
export const inFieldCapitals = (text: string, capitals?: FieldCapitals): string => {
    switch (capitals) {
        case "upper":
            return text.toUpperCase();
        case "lower":
            return text.toLowerCase();
        case "firstcap":
            return text.charAt(0).toUpperCase() + text.slice(1);
        default:
            return text;
    }
};
