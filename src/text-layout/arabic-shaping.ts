/**
 * Arabic's letters in the forms Word joins them in: each letter isolated, final, initial or medial as the letters beside it
 * join it, and lam with the alef after it as one ligature, with the widths of {@link ARABIC_WIDTHS}.
 *
 * @module
 */
// cspell:ignore tatweel
import { ARABIC_LETTERS, ARABIC_WIDTHS, LAM_ALEFS } from "./arabic-widths";

/**
 * How a character joins the letters beside it, as Unicode's joining types have it: a letter that joins only the letter
 * before it (`R`), as alef and waw, one that joins both (`D`), one that joins neither (`U`), as hamza and the zero-width
 * non-joiner, the tatweel and the zero-width joiner, which the letters on both sides join (`C`), and marks, which go on the
 * letter before them and leave the letters around them to join each other (`T`).
 */
type Joining = "R" | "D" | "U" | "C" | "T";

// The letters of the widths that join only the letter before them, and hamza, which joins none
// cspell:disable-next-line
const RIGHT_JOINING = new Set([..."آأؤإاةدذرزوژ"]);
const NON_JOINING = new Set(["ء"]);
const TATWEEL = "ـ";
const ZERO_WIDTH_JOINER = "‍";
const ZERO_WIDTH_NON_JOINER = "‌";
const LAM = "ل";

/** How a character joins the letters beside it, where the widths know it, and as a character of another script otherwise */
const joiningOf = (character: string): Joining => {
    if (character === TATWEEL || character === ZERO_WIDTH_JOINER) {
        return "C";
    }
    if (character === ZERO_WIDTH_NON_JOINER || NON_JOINING.has(character)) {
        return "U";
    }
    if (/[\p{Mn}\p{Me}\p{Cf}]/u.test(character)) {
        return "T";
    }
    if (RIGHT_JOINING.has(character)) {
        return "R";
    }
    return ARABIC_LETTERS.includes(character) ? "D" : "U";
};

/** The forms of a letter, in the order of the widths */
const ISOLATED = 0;
const FINAL = 1;
const INITIAL = 2;
const MEDIAL = 3;

// Where the widths of the lam-alef ligatures and the tatweel start among a face's
const LIGATURES = ARABIC_LETTERS.length * 4;
const TATWEEL_WIDTH = LIGATURES + LAM_ALEFS.length * 2;

/** A font's Arabic, plain or bold: its widths, by {@link ARABIC_WIDTHS}' order, and the font Word draws it in, when not its own */
export type ArabicFace = { readonly widths: readonly (number | undefined)[]; readonly drawnIn?: string };

/** The digits the widths are written in */
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const twoDigitsIn = (encoded: string, at: number): number => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);

const decoded = new Map<string, ArabicFace>();

/** Reads a face's widths, in thousandths of an em, as {@link ARABIC_WIDTHS} writes them */
const decodeFace = (encoded: string, drawnIn: string | undefined): ArabicFace => {
    const known = decoded.get(encoded);
    if (known) {
        return known;
    }
    // eslint-disable-next-line functional/prefer-readonly-type
    const widths: (number | undefined)[] = [];
    let last: number | undefined;
    for (let at = 0; at < encoded.length;) {
        if (encoded[at] === "*") {
            // eslint-disable-next-line functional/immutable-data
            widths.push(...new Array<number | undefined>(twoDigitsIn(encoded, at + 1)).fill(last));
            at += 3;
        } else {
            last = encoded[at] === "!" ? undefined : (DIGITS.indexOf(encoded[at]) * 4096 + twoDigitsIn(encoded, at + 1)) / 10;
            // eslint-disable-next-line functional/immutable-data
            widths.push(last);
            at += encoded[at] === "!" ? 1 : 3;
        }
    }
    const face = { widths, ...(drawnIn === undefined ? {} : { drawnIn }) };
    // eslint-disable-next-line functional/immutable-data
    decoded.set(encoded, face);
    return face;
};

/**
 * The widths of Arabic in a font of the tables, by its name there, plain or bold, when Word's PDF has them: not Calibri's,
 * which Word lays out otherwise, nor italic
 */
export const arabicFaceOf = (name: string, bold: boolean, italic: boolean): ArabicFace | undefined => {
    const font = ARABIC_WIDTHS.find((known) => known.name === name);
    return font === undefined || italic ? undefined : decodeFace(bold ? font.bold : font.regular, font.drawnIn);
};

/** Whether a character is one of Arabic's letters the widths have, or the tatweel */
export const isJoinedLetter = (character: string): boolean => character === TATWEEL || ARABIC_LETTERS.includes(character);

/**
 * The widths of the letters of text Word joins, by the index of each among its characters, in thousandths of an em: each
 * letter in the form the letters beside it join it in, in the text, as Word joins those of a word, and lam and an alef
 * after it as a ligature, whose width is lam's, the alef taking none. A letter joins the letter before it when it joins
 * either way, or only that one, and that letter joins the next too, or is a tatweel, and the letter after it when it joins
 * both and that letter joins the one before it; marks between them leave them joined.
 */
export const joinedWidthsOf = (characters: readonly string[], face: ArabicFace): ReadonlyMap<number, number> => {
    const joinings = characters.map(joiningOf);
    /** The next character's index from one, either way, that isn't a mark */
    const nextLetter = (index: number, step: 1 | -1): number => {
        let at = index + step;
        while (joinings[at] === "T") {
            at += step;
        }
        return at;
    };
    const widths = new Map<number, number>();
    for (const [index, character] of characters.entries()) {
        if (!isJoinedLetter(character)) {
            continue;
        }
        if (character === TATWEEL) {
            // eslint-disable-next-line functional/immutable-data
            widths.set(index, face.widths[TATWEEL_WIDTH]!);
            continue;
        }
        const joining = joinings[index];
        const before = joinings[nextLetter(index, -1)];
        const after = nextLetter(index, 1);
        const joinsBefore = (joining === "D" || joining === "R") && (before === "D" || before === "C");
        const next = characters[after];
        const alef = next === undefined ? -1 : LAM_ALEFS.indexOf(next);
        if (character === LAM && alef >= 0) {
            // The alef takes the ligature's place, with no width of its own
            // eslint-disable-next-line functional/immutable-data
            widths.set(index, face.widths[LIGATURES + alef * 2 + (joinsBefore ? FINAL : ISOLATED)]!);
            // eslint-disable-next-line functional/immutable-data
            widths.set(after, 0);
            continue;
        }
        if (widths.has(index)) {
            continue;
        }
        const joinsAfter = joining === "D" && ["D", "R", "C"].includes(joinings[after]);
        const form = joinsBefore ? (joinsAfter ? MEDIAL : FINAL) : joinsAfter ? INITIAL : ISOLATED;
        // eslint-disable-next-line functional/immutable-data
        widths.set(index, face.widths[ARABIC_LETTERS.indexOf(character) * 4 + form]!);
    }
    return widths;
};

/**
 * Whether the last letter of a run's text and the first of the next's are Arabic letters Word joins, whose forms
 * {@link joinedWidthsOf}, measuring each run's text on its own, doesn't know
 */
export const joinsAcross = (before: string, after: string): boolean => {
    const last = [...before].reverse().find((character) => joiningOf(character) !== "T");
    const first = [...after].find((character) => joiningOf(character) !== "T");
    return (
        last !== undefined &&
        first !== undefined &&
        ["D", "C"].includes(joiningOf(last)) &&
        ["D", "R", "C"].includes(joiningOf(first)) &&
        (isJoinedLetter(last) || isJoinedLetter(first))
    );
};
