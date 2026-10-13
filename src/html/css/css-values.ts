/**
 * Reads CSS values: lengths, with `calc()`, and the words of a value.
 *
 * @module
 */
import { splitTopLevel } from "./css-syntax";

/**
 * A length, as it is written: in points, for the absolute units, or relative to the font size, the root's font size
 * or what a percentage is of, which only the element it is on can work out.
 */
export type Length =
    | { readonly unit: "pt"; readonly value: number }
    | { readonly unit: "em"; readonly value: number }
    | { readonly unit: "rem"; readonly value: number }
    | { readonly unit: "%"; readonly value: number };

/** The size of each absolute unit, in points */
const POINTS: Readonly<Record<string, number>> = {
    px: 0.75,
    pt: 1,
    pc: 12,
    in: 72,
    cm: 72 / 2.54,
    mm: 72 / 25.4,
    q: 72 / 101.6,
};

/** The size of these units, relative to the font size: an `ex` and a `ch` are about half a letter's height and width */
const FONT_RELATIVE: Readonly<Record<string, number>> = { em: 1, ex: 0.5, ch: 0.5, cap: 0.7, ic: 1, lh: 1.2 };

const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i;

/** The words of a value, split at the spaces that aren't in brackets or strings, such as `1px solid rgb(0, 0, 0)` */
export const wordsOf = (value: string): readonly string[] => splitTopLevel(value.trim(), " \t\n\r\f").filter((word) => word !== "");

/** The values of a list, such as the fonts of `font-family`, split at the commas that aren't in brackets or strings */
export const listOf = (value: string): readonly string[] => splitTopLevel(value, ",").map((item) => item.trim());

/**
 * Reads a number, such as `1.5` or `-2e3`, or undefined for anything else.
 */
export const parseNumber = (value: string): number | undefined => {
    const match = NUMBER.exec(value.trim());
    return match && match[2] === "" ? Number(match[1]) : undefined;
};

/**
 * Reads a length, such as `12px`, `1.5em`, `50%` or `calc(100% - 2em)` with lengths of one kind, or `0` without a
 * unit. Viewport units are undefined, as a document has no viewport.
 */
export const parseLength = (value: string): Length | undefined => {
    const text = value.trim().toLowerCase();
    const calc = /^calc\(([^]*)\)$/.exec(text);
    if (calc) {
        return calculate(calc[1]);
    }
    const match = NUMBER.exec(text);
    if (!match) {
        return undefined;
    }
    const [, written, unit] = match;
    const amount = Number(written);
    if (unit === "") {
        return amount === 0 ? { unit: "pt", value: 0 } : undefined;
    }
    if (unit === "%") {
        return { unit: "%", value: amount };
    }
    if (unit === "rem") {
        return { unit: "rem", value: amount };
    }
    if (POINTS[unit] !== undefined) {
        return { unit: "pt", value: amount * POINTS[unit] };
    }
    return FONT_RELATIVE[unit] === undefined ? undefined : { unit: "em", value: amount * FONT_RELATIVE[unit] };
};

/**
 * Works out `calc()`: sums and differences of lengths of one kind, and lengths multiplied or divided by numbers, in
 * brackets or not. Lengths of different kinds, such as `100% - 2em`, can't be added up without knowing what they are
 * relative to, and are undefined, as is anything else.
 */
const calculate = (expression: string): Length | undefined => {
    const terms = splitTopLevel(expression.replace(/\s([+-])\s/g, "\u0000$1"), "\u0000");
    let total: Length | undefined;
    for (const term of terms) {
        const [, sign, rest] = /^([+-]?)([^]*)$/.exec(term.trim())!;
        const length = product(rest);
        if (length === undefined || (total !== undefined && total.unit !== length.unit)) {
            return undefined;
        }
        const value = sign === "-" ? -length.value : length.value;
        total = { unit: length.unit, value: (total?.value ?? 0) + value };
    }
    return total;
};

/** A length multiplied or divided by numbers, such as `2 * 3em / 4`, or a length in brackets */
const product = (term: string): Length | undefined => {
    const factors = splitTopLevel(term.replace(/\s*([*/])\s*/g, "\u0000$1"), "\u0000");
    let length: Length | undefined;
    let multiplier = 1;
    for (const factor of factors) {
        const divide = factor.startsWith("/");
        const text = factor.replace(/^[*/]/, "").trim();
        const scalar = parseNumber(text);
        if (scalar !== undefined) {
            multiplier = divide ? multiplier / scalar : multiplier * scalar;
            continue;
        }
        const bracketed = /^\(([^]*)\)$/.exec(text);
        const factorLength = bracketed ? calculate(bracketed[1]) : parseLength(text);
        if (factorLength === undefined || divide || length !== undefined) {
            return undefined;
        }
        length = factorLength;
    }
    return length === undefined || !Number.isFinite(multiplier) ? undefined : { unit: length.unit, value: length.value * multiplier };
};

/**
 * A length in points: an `em` of the font size, a `rem` of the root's font size and a percentage of what it is
 * relative to, or undefined when a percentage has nothing to be relative to.
 */
export const toPoints = (length: Length, fontSize: number, rootFontSize: number, percentOf?: number): number | undefined => {
    switch (length.unit) {
        case "pt":
            return length.value;
        case "em":
            return length.value * fontSize;
        case "rem":
            return length.value * rootFontSize;
        default:
            // A percentage
            return percentOf === undefined ? undefined : (length.value * percentOf) / 100;
    }
};

/** Whether a value is one of CSS's keywords that every property takes */
export const isCssWideKeyword = (value: string): boolean => /^(?:inherit|initial|unset|revert|revert-layer)$/i.test(value.trim());

/** A string's text without its quotes and with its escapes read, or the value as it is when it isn't a string */
export const unquote = (value: string): string => {
    const text = value.trim();
    const quoted = /^(["'])([^]*?)\1?$/.exec(text);
    return quoted ? quoted[2].replace(/\\(.)/g, "$1") : text;
};
