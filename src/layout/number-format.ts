/**
 * Writes numbers as Word writes page and list numbers in each of its formats (`ST_NumberFormat`).
 *
 * @module
 */

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

/** Letters as Word writes them: a to z, then aa to zz, then aaa and so on */
const letters = (value: number): string => String.fromCharCode(97 + ((value - 1) % 26)).repeat(Math.ceil(value / 26));

// Eleventh, twelfth and thirteenth end in "th", as the other numbers in the teens do
const ordinalSuffix = (value: number): string =>
    value % 100 >= 11 && value % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th");

/**
 * A number in one of Word's number formats, such as `"iv"` for 4 in `lowerRoman`, or undefined for formats it doesn't
 * write, such as those of other languages' scripts. Word writes numbers that are zero or less in the letter and roman
 * formats as decimal numbers.
 */
export const formatNumber = (value: number, format = "decimal"): string | undefined => {
    const positive = value > 0;
    switch (format) {
        case "decimal":
            return String(value);
        case "decimalZero":
            return value >= 0 && value < 10 ? `0${value}` : String(value);
        case "numberInDash":
            return `- ${value} -`;
        case "ordinal":
            return positive ? `${value}${ordinalSuffix(value)}` : String(value);
        case "lowerRoman":
            return positive ? roman(value) : String(value);
        case "upperRoman":
            return positive ? roman(value).toUpperCase() : String(value);
        case "lowerLetter":
            return positive ? letters(value) : String(value);
        case "upperLetter":
            return positive ? letters(value).toUpperCase() : String(value);
        case "none":
            return "";
        default:
            return undefined;
    }
};
