/**
 * The templates Word's styles of citation share, written in TypeScript: names and their initials, dates, formats such
 * as "Retrieved %1, from %2", lists of fields and their separators, and the order of a bibliography.
 *
 * Each follows its XSL template, including where that doesn't do what it looks like it should, so the styles write what
 * Word writes. Each XSL template's name is in its description.
 *
 * @module
 */
import { type FormattedText, type TextLike, formatted, italic, join, textOf } from "./formatted-text";
import type { DatePatterns, NamePatterns } from "./locals";
import type { WordPerson } from "../word-source";

/** The punctuation a style writes with: Word's own (`LOCALS.General`), or the style's, where it has its own */
export type Punctuation = {
    readonly Dot: string;
    readonly DotInitial: string;
    readonly EndChars: string;
    readonly Hyphens: string;
    readonly ListSeparator: string;
    readonly GroupSeparator: string;
    readonly SimpleAuthor: { readonly F: string; readonly L: string; readonly M: string };
    readonly SimpleDate: { readonly D: string; readonly M: string; readonly Y: string };
};

/** The last character of the text, or "" when it is empty, as `substring($text, string-length($text))` */
export const lastCharOf = (text: string): string => text.slice(-1);

/**
 * Whether a character is one of the characters, as XPath's `contains($characters, $character)`, which is true of ""
 */
export const isOneOf = (character: string, characters: string): boolean => characters.includes(character);

/** The text with each character of `from` replaced by the one at its place in `to`, or removed, as XPath's `translate` */
export const translate = (text: string, from: string, to: string): string =>
    [...text]
        .map((character) => {
            const index = from.indexOf(character);
            return index < 0 ? character : (to[index] ?? "");
        })
        .join("");

/** The parts of a format: %%, a % and the character after it, or the text up to the next % */
const formatPartsOf = (format: string): readonly string[] => format.match(/%%|%[^]?|[^%]+/g) ?? [];

/** The templates Word's styles share that write with their punctuation */
export type XslTemplates = {
    readonly nameInitial: (name: string) => string;
    readonly formatName: (person: WordPerson, patterns: NamePatterns) => string;
    readonly formatDatePrivate: (day: string, month: string, year: string, patterns: DatePatterns) => string;
    readonly stringFormat: (format: string, ...parameters: readonly TextLike[]) => FormattedText;
    readonly stringFormatDot: (format: string, ...parameters: readonly TextLike[]) => FormattedText;
    readonly appendDot: (text: string) => string;
    readonly needDot: (text: string) => string;
    readonly printList: (items: readonly (TextLike | "group")[]) => FormattedText;
};

/**
 * The templates Word's styles share, writing with a style's punctuation.
 *
 * @param punctuation - The punctuation the style writes with
 */
export const xslTemplates = (punctuation: Punctuation): XslTemplates => {
    const dot = punctuation.Dot;
    const endsWithEndChar = (text: string): boolean => isOneOf(lastCharOf(text), punctuation.EndChars);

    /** The initials of a name, such as "J.-P." of "Jean-Paul", or "M." of "Mary Ann" (`formatNameInitial`) */
    const nameInitial = (name: string): string => {
        if (name.length === 0) {
            return "";
        }
        const withoutSpaces = translate(name, " \u00a0", "");
        // Each letter after a hyphen, with the hyphen (handleHyphens)
        let hyphenated = "";
        for (let rest = withoutSpaces; rest.length >= 2;) {
            if (isOneOf(rest[0], punctuation.Hyphens)) {
                hyphenated += rest.slice(0, 2) + punctuation.DotInitial;
                rest = rest.slice(2);
            } else {
                rest = rest.slice(1);
            }
        }
        const first = withoutSpaces.slice(0, 1);
        return (isOneOf(first, punctuation.Hyphens) ? "" : first + punctuation.DotInitial) + hyphenated;
    };

    /** One part of a person's name for a pattern: %F, %M or %L the name, %f, %m or %l its initials (`formatNameOneItem`) */
    const namePart = (person: WordPerson, code: string): string => {
        switch (code) {
            case "F":
                return person.first;
            case "M":
                return person.middle;
            case "L":
                return person.last;
            case "f":
                return nameInitial(person.first);
            case "m":
                return nameInitial(person.middle);
            case "l":
                return nameInitial(person.last);
            default:
                return "";
        }
    };

    /**
     * A person's name, written with the pattern for the names they have (`formatNameCore` and `StringFormatName`). The
     * template's `withDot` and `upperLast` are tested without a `$`, so they never add a dot or capitals
     */
    const formatName = (person: WordPerson, patterns: NamePatterns): string => {
        const { first, middle, last } = person;
        const pattern =
            !first && !middle && !last
                ? ""
                : !first && !middle
                  ? punctuation.SimpleAuthor.L
                  : !first && !last
                    ? punctuation.SimpleAuthor.M
                    : !first
                      ? patterns.ML
                      : !middle && !last
                        ? punctuation.SimpleAuthor.F
                        : !middle
                          ? patterns.FL
                          : !last
                            ? patterns.FM
                            : patterns.FML;
        return pattern.replace(/%(.)|%$/g, (_match, code: string | undefined) => (code === "%" ? "%" : code ? namePart(person, code) : ""));
    };

    /**
     * A date, written with the pattern for the parts it has, or the year alone when it has no month (`formatDateCorePrivate`
     * and `StringFormatDate`). A month and a day with no year, or a month alone, are written as nothing
     */
    const formatDatePrivate = (day: string, month: string, year: string, patterns: DatePatterns): string => {
        const pattern = !year ? "" : !month ? punctuation.SimpleDate.Y : !day ? patterns.MY : patterns.DMY;
        return pattern.replace(/%(.)|%$/g, (_match, code: string | undefined) =>
            code === "%" ? "%" : code === "D" ? day : code === "M" ? month : code === "Y" ? year : "",
        );
    };

    /**
     * A format, such as "Retrieved %1, from %2", with each %1 to %9 replaced by its parameter, with its formatting, and
     * %% by % (`StringFormat`)
     */
    const stringFormat = (format: string, ...parameters: readonly TextLike[]): FormattedText =>
        join(
            ...formatPartsOf(format).map((part) =>
                part === "%%" ? "%" : part.startsWith("%") ? (parameters[Number(part.slice(1)) - 1] ?? "") : part,
            ),
        );

    /**
     * A format with each parameter replaced, as {@link stringFormat}, and a dot after it unless it ends with a character
     * that ends a sentence, such as a dot or a question mark, or with an empty parameter (`StringFormatDot`)
     */
    const stringFormatDot = (format: string, ...parameters: readonly TextLike[]): FormattedText => {
        // The template checks for a dot at the last part of the format: after %%, after a parameter that doesn't end with
        // a character that ends a sentence, or after a character that isn't one. A % at the end isn't checked
        const parts = formatPartsOf(format);
        const last = parts[parts.length - 1] ?? "";
        const needsDot =
            last === "%%"
                ? true
                : last.startsWith("%")
                  ? last.length === 2 && !isOneOf(lastCharOf(textOf(parameters[Number(last.slice(1)) - 1] ?? "")), punctuation.EndChars)
                  : last.length > 0 && !isOneOf(lastCharOf(last), punctuation.EndChars);
        const text = stringFormat(format, ...parameters);
        return needsDot ? join(text, dot) : text;
    };

    /** The text, and a dot after it unless it ends with a character that ends a sentence (`appendField_Dot`) */
    const appendDot = (text: string): string => (text.length === 0 ? "" : endsWithEndChar(text) ? text : text + dot);

    /** A dot, unless the text is empty or ends with a character that ends a sentence (`need_Dot`) */
    const needDot = (text: string): string => (text.length === 0 || endsWithEndChar(text) ? "" : dot);

    /**
     * The items of a list with the list's separator between them, or the group separator after a `group` item, and a dot
     * after the last unless it ends a sentence (`PrintList` and `PrintList2`). A text item is written as text, and a
     * formatted one with its formatting
     */
    const printList = (items: readonly (TextLike | "group")[]): FormattedText => {
        const { parts, lastDisplayed } = items.reduce<{
            readonly parts: readonly TextLike[];
            readonly separator: string;
            readonly lastDisplayed: string;
        }>(
            (list, item) => {
                if (item === "group") {
                    return { ...list, separator: punctuation.GroupSeparator };
                }
                const text = textOf(item);
                if (text.length === 0) {
                    return list;
                }
                const separated = list.lastDisplayed.length > 0;
                return {
                    parts: [...list.parts, ...(separated ? [list.separator] : []), item],
                    separator: separated ? punctuation.ListSeparator : list.separator,
                    lastDisplayed: text,
                };
            },
            { parts: [], separator: punctuation.ListSeparator, lastDisplayed: "" },
        );
        return join(...parts, needDot(lastDisplayed));
    };

    return { nameInitial, formatName, formatDatePrivate, stringFormat, stringFormatDot, appendDot, needDot, printList };
};

/**
 * The text in italics, as a style's `ApplyItalicTitleNS` and `ApplyItalicFieldNS` write it, as English has italics
 * (`NoItalics` is "no")
 */
export const applyItalic = (text: TextLike): FormattedText =>
    textOf(text).length === 0 && formatted(text).length === 0 ? [] : italic(text);

// The letters a name or a title is sorted by when it has an accent or is two letters in one, as Windows sorts them
const SORTED_AS: Readonly<Record<string, string>> = { æ: "ae", œ: "oe", ø: "o", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i" };

/** A sort key's letters, without the accents, hyphens and apostrophes that Word ignores when it sorts, in small letters */
const primaryKeyOf = (key: string): string =>
    key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[-'’­]/g, "")
        .replace(/[æœøßłđðþı]/g, (letter) => SORTED_AS[letter]);

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The items sorted by their sort keys, as a style's `xsl:sort` sorts them in Word: in small letters, without the
 * hyphens and apostrophes in them, then by their accents. Items with the same key keep their order.
 *
 * Word for Windows sorts this way. Word for Mac sorts some letters with accents differently, such as "Müller" before
 * "Mabe", and so writes some bibliographies in another order when it updates them.
 */
export const sortByKey = <T>(items: readonly T[], keyOf: (item: T) => string): readonly T[] =>
    items
        .map((item, index) => ({ item, index, key: keyOf(item) }))
        .sort(
            (a, b) =>
                compareStrings(primaryKeyOf(a.key), primaryKeyOf(b.key)) ||
                compareStrings(a.key.toLowerCase(), b.key.toLowerCase()) ||
                a.index - b.index,
        )
        .map(({ item }) => item);
