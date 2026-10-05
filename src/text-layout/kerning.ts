/**
 * Kerning and ligatures in the fonts of the width tables, as Word draws them: which letters a font's ligatures join into
 * one glyph, how wide that glyph is, and how much nearer, or further apart, kerning draws each pair of glyphs, from
 * {@link FONT_KERNING}.
 *
 * @module
 */
import { FONT_KERNING, type FaceKerning, type LigatureRule } from "./font-kerning";
import type { Ligatures, TextFont } from "./text-width";

/**
 * A glyph of text: a character, or the glyph a ligature puts in place of characters, with its width in thousandths of an
 * em and its kerning classes, as the first of a pair and as the second.
 */
export type Glyph = {
    /** The characters it is drawn for */
    readonly text: string;
    /** Its width, or undefined for a character, whose width is the width tables' */
    readonly width?: number;
    /** Which of the face's glyphs it is, for a ligature's */
    readonly glyph?: number;
    readonly first?: number;
    readonly second?: number;
};

// The digits the tables write numbers in, two to a number, as the width tables do
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const twoDigits = (encoded: string, at: number): number => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);
// The kerning a pair of classes is written with when Word's PDFs don't show it
const UNKNOWN = 4095;

/** The characters of Windows-1252, whose kerning the tables have: printable ASCII, Latin-1 and 27 more, less the soft hyphen */
export const WINDOWS_1252: string = [
    ...Array.from({ length: 0x7f - 0x20 }, (_, index) => 0x20 + index),
    ...Array.from({ length: 0x100 - 0xa0 }, (_, index) => 0xa0 + index).filter((code) => code !== 0xad),
    ...[0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019],
    ...[0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178],
]
    .sort((one, other) => one - other)
    .map((code) => String.fromCodePoint(code))
    .join("");

/**
 * Whether text joins letters into ligatures: with ligatures on, and no space added between its characters, as Word joins
 * none with a point added or half a point taken away (scripts/layout-probes/word-kerning.ts SP1, SP2)
 */
export const hasLigatures = ({ ligatures, characterSpacing = 0 }: TextFont): boolean =>
    ligatures !== undefined && ligatures !== "none" && characterSpacing === 0;

/**
 * The rules of a setting, by the character each starts with, the longest first, and those that look at the character
 * after them last.
 */
type RuleIndex = ReadonlyMap<string, readonly LigatureRule[]>;

/** A face's kerning and ligatures, read from the tables */
export type FaceShaping = {
    /** The characters whose kerning is known */
    readonly characters: ReadonlySet<string>;
    /** The kerning classes of each of those characters */
    readonly classes: ReadonlyMap<string, { readonly first: number; readonly second: number }>;
    /**
     * The kerning of each pair of classes that is kerned, in thousandths of an em, by first class * 4096 + second class,
     * or NaN where it isn't known
     */
    readonly pairs: ReadonlyMap<number, number>;
    readonly glyphs: FaceKerning["glyphs"];
    /** The rules of each setting Word's PDFs showed */
    readonly ligatures: FaceKerning["ligatures"];
    /** Whether Word leaves the face's text not kerned when it has ligatures */
    readonly notKernedWithLigatures: boolean;
};

/** The first character of text */
const firstOf = (text: string): string => String.fromCodePoint(text.codePointAt(0)!);

/** Indexes rules by their first character, the longest first, and those that look at the next character after the rest */
export const indexRules = (rules: readonly LigatureRule[]): RuleIndex => {
    const order = (one: LigatureRule, other: LigatureRule): number =>
        (one[2] === undefined ? 0 : 1) - (other[2] === undefined ? 0 : 1) || [...other[0]].length - [...one[0]].length;
    const firsts = [...new Set(rules.map(([letters]) => firstOf(letters)))];
    return new Map(firsts.map((first) => [first, rules.filter(([letters]) => firstOf(letters) === first).sort(order)]));
};

// eslint-disable-next-line functional/prefer-readonly-type
const indexes = new Map<FaceShaping, Map<Ligatures, RuleIndex | undefined>>();

/**
 * The rules of a face's ligatures of a setting, or none for a setting Word's PDFs didn't show. A face that joins no
 * letters with all its ligatures joins none with any of them.
 */
export const rulesOf = (shaping: FaceShaping, ligatures: Ligatures): RuleIndex | undefined => {
    const known = indexes.get(shaping) ?? new Map<Ligatures, RuleIndex | undefined>();
    if (!known.has(ligatures)) {
        const rules = shaping.ligatures[ligatures] ?? (shaping.ligatures.all?.length === 0 ? [] : undefined);
        // eslint-disable-next-line functional/immutable-data
        known.set(ligatures, rules === undefined ? undefined : indexRules(rules));
        // eslint-disable-next-line functional/immutable-data
        indexes.set(shaping, known);
    }
    return known.get(ligatures);
};

const decoded = new Map<FaceKerning, FaceShaping>();

/** Reads a face's kerning and ligatures, as {@link FaceKerning} writes them */
export const decodeFace = (face: FaceKerning): FaceShaping => {
    const known = decoded.get(face);
    if (known) {
        return known;
    }
    const characters = [...(face.characters ?? WINDOWS_1252)];
    const classes = new Map(
        characters.map((character, index) => [
            character,
            { first: twoDigits(face.first, index * 2), second: twoDigits(face.second, index * 2) },
        ]),
    );
    const pairs = new Map<number, number>();
    for (let at = 0; at < face.pairs.length; at += 6) {
        const value = twoDigits(face.pairs, at + 4);
        // eslint-disable-next-line functional/immutable-data
        pairs.set(twoDigits(face.pairs, at) * 4096 + twoDigits(face.pairs, at + 2), value === UNKNOWN ? Number.NaN : value - 2048);
    }
    const shaping: FaceShaping = {
        characters: new Set(characters),
        classes,
        pairs,
        glyphs: face.glyphs,
        ligatures: face.ligatures,
        notKernedWithLigatures: face.notKernedWithLigatures === true,
    };
    // eslint-disable-next-line functional/immutable-data
    decoded.set(face, shaping);
    return shaping;
};

/**
 * The glyphs characters are drawn as, with the rules of the ligatures they have: at each character, the first rule that
 * starts there, of those that start with it, the longest first, as Word joins them from the start of the text. A rule
 * that looks at the character after it puts its glyphs in place of its own characters only, and the next starts there.
 */
export const joinLetters = (characters: readonly string[], rules: RuleIndex, glyphs: FaceKerning["glyphs"]): readonly Glyph[] => {
    /** The glyphs of a rule's units: a character as itself, or one of the face's glyphs */
    const glyphsOf = (units: readonly (number | string)[]): readonly Glyph[] =>
        units.map((unit) => {
            if (typeof unit === "string") {
                return { text: unit };
            }
            const [text, width, first, second] = glyphs[unit];
            return { text, width, glyph: unit, first, second };
        });
    /** The rule that starts at a character, if any */
    const ruleAt = (start: number): LigatureRule | undefined =>
        rules.get(characters[start])?.find(([letters, , next]) => {
            const { length } = [...letters];
            return (
                characters.slice(start, start + length).join("") === letters && (next === undefined || characters[start + length] === next)
            );
        });
    // eslint-disable-next-line functional/prefer-readonly-type
    const joined: Glyph[] = [];
    let at = 0;
    while (at < characters.length) {
        const rule = ruleAt(at);
        // eslint-disable-next-line functional/immutable-data
        joined.push(...(rule === undefined ? [{ text: characters[at] }] : glyphsOf(rule[1])));
        at += rule === undefined ? 1 : [...rule[0]].length;
    }
    return joined;
};

/**
 * The font's kerning and ligatures in the tables, by its name and face, when they have them. An italic face a font
 * doesn't have, which Word slants from the upright one, is kerned and joined as the upright one, as Word kerns Trebuchet
 * MS's bold italic, which it draws as its bold (scripts/layout-probes/stops2/word-stops-font-kerning.ts K18). A bold
 * face it doesn't have, which Word makes itself, such as Calibri Light's, isn't known
 */
export const shapingOf = (font: string, bold: boolean, italic: boolean): FaceShaping | undefined => {
    const faces = FONT_KERNING.find(({ name }) => name === font);
    const face = bold
        ? italic
            ? (faces?.boldItalic ?? faces?.bold)
            : faces?.bold
        : italic
          ? (faces?.italic ?? faces?.regular)
          : faces?.regular;
    return face === undefined ? undefined : decodeFace(face);
};

/** A glyph's kerning classes: a ligature's own, or a character's */
const classesOf = (shaping: FaceShaping, glyph: Glyph): { readonly first?: number; readonly second?: number } =>
    glyph.width === undefined ? (shaping.classes.get(glyph.text) ?? {}) : glyph;

/**
 * The kerning between a glyph and the next, in thousandths of an em, which is added to the first's width: negative when
 * it draws them nearer. NaN when it isn't known, but in a face that kerns no pair at all.
 */
export const kerningBetween = (shaping: FaceShaping, before: Glyph, after: Glyph): number => {
    // A face Word kerns no pair of, such as Courier New, kerns none
    if (shaping.pairs.size === 0) {
        return 0;
    }
    const { first } = classesOf(shaping, before);
    const { second } = classesOf(shaping, after);
    return first === undefined || second === undefined ? Number.NaN : (shaping.pairs.get(first * 4096 + second) ?? 0);
};
