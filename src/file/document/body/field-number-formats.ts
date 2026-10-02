/**
 * Numbers as Word writes them in a field's number format (its `\*` switch), such as `\* roman`, for the fields `docx`
 * writes the numbers of: SEQ fields, page references and numbers of pages. What Word writes was read from its PDFs of
 * `scripts/layout-probes/word-seq.ts` and `word-watertight-fields.ts`. Not part of the public API.
 *
 * @module
 */

/** Writes a number in a format, or undefined for a number Word's format isn't known for */
export type NumberWriter = (value: number) => string | undefined;

// The largest number written in roman numerals, as Word's lists write them. Word's fields write 4000 as MMMM
const LARGEST_ROMAN = 32767;
// The largest number written in letters, 30 times through the alphabet. Word writes an error for 781
const LARGEST_LETTERS = 780;

const ROMAN: readonly (readonly [number, string])[] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
];

// Word writes nothing for 0 in roman numerals and letters
const roman = (value: number): string | undefined =>
    value <= LARGEST_ROMAN
        ? ROMAN.reduce(
              ({ rest, text }, [amount, numeral]) => ({ rest: rest % amount, text: text + numeral.repeat(Math.floor(rest / amount)) }),
              { rest: value, text: "" },
          ).text
        : undefined;

// A to Z, then AA to ZZ, then AAA, as Word writes letters
const letters = (value: number): string | undefined =>
    value === 0 ? "" : value <= LARGEST_LETTERS ? String.fromCharCode(65 + ((value - 1) % 26)).repeat(Math.ceil(value / 26)) : undefined;

// Eleventh, twelfth and thirteenth end in "th", as the other numbers in the teens do
const ordinal = (value: number): string =>
    `${value}${value % 100 >= 11 && value % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th")}`;

/**
 * The number formats of a field's `\*` switch that are written as Word writes them, by their names in any capitals.
 * Word writes roman numerals and letters in small letters when the name starts with a small letter, as `roman`, and in
 * capitals otherwise, as `Roman` and `ROMAN`
 */
export const numberWriterOf = (format: string): NumberWriter | undefined => {
    const small = format.charAt(0) !== format.charAt(0).toUpperCase();
    const inCase =
        (write: NumberWriter): NumberWriter =>
        (value) =>
            small ? write(value)?.toLowerCase() : write(value);
    switch (format.toLowerCase()) {
        case "arabic":
            return String;
        case "roman":
            return inCase(roman);
        case "alphabetic":
            return inCase(letters);
        case "ordinal":
            return (value) => (value > 0 ? ordinal(value) : undefined);
        case "arabicdash":
            return (value) => `- ${value} -`;
        default:
            // Such as CardText, OrdText, DollarText and Hex, whose numbers were seen only at 4
            return undefined;
    }
};

// Formatting switches that don't change how a number is written, nor show a hidden one
// cspell:ignore mergeformatinet firstcap
export const PLAIN_FORMATS: ReadonlySet<string> = new Set(["mergeformat", "charformat", "mergeformatinet"]);
// Formats of the capitals of text, which don't change a number in figures
export const CASE_FORMATS: ReadonlySet<string> = new Set(["upper", "lower", "firstcap", "caps"]);

/**
 * Whether Word's text for a picture of a field's `\#` switch is known: one of digits (`0`), digits only where the number
 * has them (`#`) and commas between thousands, as Word wrote `00`, `000`, `0`, `#` and `#,##0` for page numbers
 * (`scripts/layout-probes/word-page-fields.ts` PF5 to PF7)
 */
export const isNumberPicture = (picture: string): boolean => /^[#0,]*[#0][#0,]*$/.test(picture);

/**
 * A number with a picture: with as many digits as it has `0`s at least, which Word fills with 0s (5 is 05 with `00`), and
 * its thousands between commas when it has one (1234 is 1,234 with `#,##0`). Undefined where a `#` has no digit of the
 * number, which Word writes as a space, not yet seen
 */
export const inNumberPicture = (value: number, picture: string): string | undefined => {
    const zeros = [...picture].filter((character) => character === "0").length;
    const places = zeros + [...picture].filter((character) => character === "#").length;
    const digits = String(value).padStart(zeros, "0");
    if (digits.length < places || (zeros === 0 && value === 0)) {
        return undefined;
    }
    return picture.includes(",") ? digits.replace(/\B(?=(\d{3})+$)/g, ",") : digits;
};

/** The capitals a field's `\*` switch writes its text in: all capitals, all small letters, or a capital first */
export type TextCapitals = "upper" | "lower" | "firstcap";

/**
 * Text in the capitals of a field's switch, applied after its number's format, as Word wrote `\* roman \* Upper` as V,
 * `\* Ordinal \* Upper` as 5TH, and "above" with `\* Upper` as ABOVE (`word-page-fields.ts` PF3 and PF5)
 */
export const inCapitals = (text: string, capitals?: TextCapitals): string => {
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
