/**
 * Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
 * which bookmarks start on it.
 *
 * Lines break at spaces, and at en, em, four-per-em and ideographic spaces, after hyphens, between Chinese, Japanese and
 * Korean characters, and between the words of Thai and the other scripts without spaces, as {@link findLineBreaks} finds,
 * and at soft hyphens, with a hyphen drawn at the end of the line. Tabs move to the paragraph's tab stops, or to the
 * document's default ones. Each line is as tall as its text's tallest ascent and deepest descent, with its pictures
 * standing on the baseline, and the paragraph's line spacing.
 *
 * @module
 */
// cspell:ignore Aptos
import { hasLigatures } from "./kerning";
import { type LineBreakRules, extendsCharacter, findLineBreaks, joinsNext } from "./line-break-rules";
import {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    type LineSpacing,
    type ParagraphFormat,
    type TextBorder,
    type TextFont,
    isEastAsianFont,
    isGridCharacter,
    isKerned,
    measureDescent,
    measureLineHeight,
    measureTextWidthAsDrawn,
    takesNoRoom,
    unknownCharacter,
    unknownFont,
    unknownShaping,
} from "./text-width";

/**
 * Measures text. The default measures it with the widths of the fonts in {@link FONT_WIDTHS}.
 */
export type TextMeasurer = {
    /** How wide text is, in points. The text has no tabs or line breaks */
    readonly measureWidth: (text: string, font: TextFont) => number;
    /** How tall a line of single-spaced text is, in points */
    readonly measureLineHeight: (font: TextFont) => number;
    /** How far a line of single-spaced text goes below its baseline, in points */
    readonly measureDescent: (font: TextFont) => number;
    /**
     * The first character of text whose width this measurer doesn't know as Word lays it out, so a layout stops there
     * rather than guessing. A measurer that measures with the fonts themselves leaves it out
     */
    readonly unknownCharacter?: (text: string, font: TextFont) => string | undefined;
    /**
     * Whether this measurer measures text in a font as another font, as it doesn't know the font's own widths, so a layout
     * stops there rather than guessing. Without text, whether it knows the height and descent of the font's lines. A
     * measurer without it measures every font as best it can
     */
    readonly unknownFont?: (font: TextFont, text?: string) => boolean;
    /**
     * Why this measurer doesn't know how Word kerns text in a font, or joins its letters into ligatures, when it doesn't,
     * so a layout stops there rather than guessing. A measurer without it measures them as best it can
     */
    readonly unknownShaping?: (text: string, font: TextFont) => string | undefined;
};

/**
 * Measures text with the widths of the fonts in {@link FONT_WIDTHS}, and text in other fonts with those of the most
 * similar font in them, such as Aptos as Arial: a best guess, for a layout asked to lay out past what it can't follow.
 */
export const SIMILAR_FONT_MEASURER: TextMeasurer = {
    measureWidth: (text, font) => measureTextWidthAsDrawn(text, font),
    measureLineHeight,
    measureDescent,
    unknownCharacter,
};

/**
 * Measures text with the widths of the fonts in {@link FONT_WIDTHS}, and says which fonts it doesn't have, which it
 * measures as {@link SIMILAR_FONT_MEASURER} does, and the kerning and ligatures it doesn't know, so a layout stops at them.
 */
export const DEFAULT_MEASURER: TextMeasurer = {
    // Written out, rather than spread from SIMILAR_FONT_MEASURER, which a bundle would keep, and the kerning tables with
    // it, in an entry that doesn't use it, such as docx/shapes
    measureWidth: (text, font) => measureTextWidthAsDrawn(text, font),
    measureLineHeight,
    measureDescent,
    unknownCharacter,
    unknownFont,
    unknownShaping,
};

/**
 * A piece of a paragraph's content, in the order it is written.
 */
export type InlineItem =
    /**
     * Text, with the East Asian language of its run, which decides which characters can't start or end a line, and whether
     * its run is East Asian, whose words break anywhere with word wrap off
     */
    | {
          readonly type: "text";
          readonly text: string;
          readonly font: TextFont;
          readonly language?: string;
          readonly eastAsian?: boolean;
          /**
           * How Word may hyphenate its words when the document hyphenates: not at all (`"none"`), as text not checked for
           * spelling (`w:noProof`) or in no language (`zxx`) is, or by the dictionary of a language Word hasn't been seen
           * hyphenating (`"unknown"`). Without it, by Word's English dictionary, as for text in English or in no language
           * given, which Word hyphenates in its own
           */
          readonly hyphenation?: "none" | "unknown";
      }
    | { readonly type: "tab"; readonly font: TextFont }
    /**
     * A soft hyphen (`w:softHyphen`), where a word may break, with a hyphen in its font drawn at the end of the line. It
     * takes no room in a line that doesn't break there (scripts/layout-probes/word-watertight-text.ts TX10a, TX10d)
     */
    | { readonly type: "softHyphen"; readonly font: TextFont }
    /** A line break, or a page or column break, which ends the line and starts the rest on a new page or column */
    | { readonly type: "break"; readonly kind: "line" | "page" | "column"; readonly font: TextFont }
    /**
     * A picture or other drawing in the line, in points, with the font of its run, whose line the picture's is at least as
     * tall as. One that takes room in its line as text does, such as an equation, goes `descent` below the baseline, and
     * its height is the room it takes above it, with the line gap, rather than standing on the baseline as a picture does.
     * Where Word may break one in a way not yet followed when it doesn't fit in the room left on its line, the layout stops
     * there, for why (`unbroken`)
     */
    | {
          readonly type: "box";
          readonly width: number;
          readonly height: number;
          readonly font?: TextFont;
          readonly descent?: number;
          readonly unbroken?: string;
      }
    /**
     * Where a bookmark starts, which is on the line of the word, picture or tab after it, or, for one that goes with the text
     * before it (`after`), such as a drawing's anchor, on the line of the word or picture right before it
     */
    | { readonly type: "marker"; readonly name: string; readonly after?: boolean };

/**
 * A tab stop, in points from the left edge of the text.
 */
export type TabStop = {
    readonly position: number;
    /**
     * How the text after the tab lines up with the stop. A decimal stop lines up the full stop of a number, or its end when
     * it has none, as a right stop does
     */
    readonly alignment: "left" | "right" | "center" | "decimal";
};

/**
 * Word's automatic hyphenation of a document's words (`w:autoHyphenation`), with the document's settings for it. Word
 * hyphenates by its own dictionary for each language, which the layout can't have, so a line is laid out only where Word
 * certainly leaves the word after it whole, and says why it can't be anywhere else.
 */
export type Hyphenation = {
    /** Whether words in capitals are left whole (`w:doNotHyphenateCaps`) */
    readonly capitalsWhole?: boolean;
};

/**
 * How a section's document grid (`w:docGrid`) lays out a paragraph's lines. Lengths are in points.
 */
export type TextGrid = {
    /**
     * How far apart the grid's lines are, when the paragraph's lines are on them: each line takes as many of them as it
     * needs, or as its line spacing gives it, with its text in the middle
     */
    readonly linePitch?: number;
    /** What a grid of lines and characters adds after each character of text on it (`w:charSpace`, over 4096) */
    readonly characterSpace?: number;
    /** How wide each cell of a grid that snaps to characters is */
    readonly characterPitch?: number;
    /**
     * How wide a cell of a grid that snaps to characters is at the least, in a section of columns of different widths, each
     * of which has cells of its own: as many as there is room for, as wide as fills the column
     */
    readonly characterRoom?: number;
};

/**
 * How a paragraph's lines are laid out.
 */
export type LineLayoutOptions = {
    /**
     * The width of the text, in points: the page's, a column's, or a table cell's, less their margins. Or the width of
     * each line, from its index in the paragraph, for lines of different widths, such as those of a paragraph that goes on
     * into a column of another width, or the room of a line of its own, such as one beside a drawing that text flows
     * around
     */
    readonly width: number | ((line: number) => number | LineRoom);
    readonly format?: ParagraphFormat;
    readonly tabStops?: readonly TabStop[];
    /** The distance between the document's default tab stops, in points. Default is half an inch */
    readonly defaultTabStop?: number;
    /** The font of the paragraph's mark, which sets the height of a line with no text on it, such as an empty paragraph's */
    readonly markFont?: TextFont;
    readonly measurer?: TextMeasurer;
    /** The document's rules for where lines break. The paragraph's `kinsoku` takes the place of the rules' */
    readonly breakRules?: LineBreakRules;
    /**
     * How the list number the paragraph starts with, its first item, lines up at the start of its first line
     * (`w:lvlJc`), when not to the left: right-aligned it ends there, with the space after it when one follows it, and
     * centred its middle is there. The text after it goes on from its end, to the next tab stop, or the left indent
     * (`word-watertight-text.docx` TX21, `word-lists.docx` LJ1 to LJ9)
     */
    readonly numberAlignment?: "center" | "right";
    /** The document's automatic hyphenation, when it has it on. A paragraph that suppresses it is laid out without */
    readonly hyphenation?: Hyphenation;
    /** The document grid of the paragraph's section, when it has one */
    readonly grid?: TextGrid;
    /**
     * The version of Word whose layout the document asks for, when it is in compatibility mode: Word 2010 (14), 2007 (12)
     * or 2003 (11). None for Word 2013 and later
     */
    readonly compatibilityMode?: number;
};

/**
 * The room of a line of its own, in points from where the paragraph's lines start without indents: where its text starts
 * and where it ends, which the paragraph's indents don't move, as they are in them. A line in a room of its own is beside
 * a drawing, and is left empty when its first word doesn't fit in it.
 */
export type LineRoom = { readonly start: number; readonly end: number };

/**
 * A line of a paragraph.
 */
export type LaidOutLine = {
    /** In points, with the paragraph's line spacing */
    readonly height: number;
    /** The names of the bookmarks that start on the line */
    readonly markers: readonly string[];
    /** Whether the line ends with a page or column break */
    readonly breakAfter?: "page" | "column";
    /**
     * The text on the line, with the spaces where it wraps and a tab as `\t`. A picture, a break or the hyphen drawn where it
     * breaks at a soft hyphen adds nothing to it, so the texts of a paragraph's lines, one after the other, are its text
     */
    readonly text: string;
    /** How far its text goes from where the line starts, in points, without the spaces at its end */
    readonly textWidth: number;
    /**
     * The space multiple line spacing adds below the line's text, in points, which Word lets go below the bottom of a page:
     * 20 lines of 699.37 twips go on a page of 13958, the last without its 40.28
     * (scripts/layout-probes/word-watertight-text.ts TX8c), and 26 of 544.09, the last without its 268.55
     * (word-mixed-heights.ts MH1c)
     */
    readonly spacingBelow?: number;
    /** Why Word's breaking of the line, or how tall it is, isn't known, when it isn't */
    readonly unsupported?: string;
};

type Piece = { readonly text: string; readonly font: TextFont; readonly hyphenation?: TextItem["hyphenation"] };

/** A soft hyphen in a word: how many characters of the word are before it, and the font its hyphen is drawn in */
type Hyphen = { readonly at: number; readonly font: TextFont };

/** A part of a line that is placed as a whole: a word, the spaces after it, a tab, a picture or a bookmark */
type Token =
    /** A word, with the soft hyphens it may break at */
    | { readonly type: "word"; readonly pieces: readonly Piece[]; readonly hyphens?: readonly Hyphen[] }
    | { readonly type: "space"; readonly pieces: readonly Piece[] }
    | { readonly type: "tab"; readonly font: TextFont }
    | Extract<InlineItem, { readonly type: "box" }>
    | { readonly type: "marker"; readonly name: string; readonly after?: boolean };

/** A part of a paragraph up to a break */
type Segment = {
    readonly tokens: readonly Token[];
    /** The break that ends it, unless it is the paragraph's last */
    readonly end?: Extract<InlineItem, { readonly type: "break" }>;
};

// Word's default tab stops are half an inch apart
const DEFAULT_TAB_STOP = 36;
// How far past its end a line may go before it wraps, for the rounding of the widths
const TOLERANCE = 0.01;
// Word breaks a word at a soft hyphen when its hyphen ends 19.9 twips before the end of the line, and doesn't when it ends
// 2.7 twips or less before it, or past it: of Calibri 11's hyphen of 67.3 twips, after a part that ends 90 twips short of the
// end, and not 70, 50, 30 or 10 (scripts/layout-probes/word-breaks-and-tabs.ts SH2), and with the hyphen 19.9 to 129.4 twips
// short of the end (scripts/layout-probes/stops2/word-stops-tabs.ts SH13a to SH13h). A little less than 19.9 allows for the
// rounding of the widths
const HYPHEN_ROOM = 19.8 / 20;
const NO_HYPHEN_ROOM = 2.7 / 20;
// Why the layout stops at a paragraph that ends with a page break in a document in compatibility mode
const OLDER_PAGE_BREAK = "a page break at the end of a paragraph in a document in compatibility mode";

// Word squeezes one more word onto a justified line when its spaces would otherwise stretch by a share of their width
// more than twice as large as the share they're squeezed by: 2.022 times as large, and not 2.008 (`word-justify.docx` J01
// to J09, and `word-justify2.docx` K08 and K09, where a line justified for Thai or with a low kashida was squeezed at
// 2.022). A distributed line's spaces and letters are weighed by the same share: squeezed at 2.034, and not 2.005 (K07,
// and scripts/layout-probes/stops2/word-stops-tabs.ts JU3a12 and JU3a13, on the line after the first)
const STRETCH_TO_SQUEEZE = 2.015;
// and never squeezes them by more than a quarter of their width: by 24.9%, and not 25.4% (J03 and J05 to J07), even on a
// line whose other words have no spaces between them to stretch (`word-justify2.docx` K10, K11)
const MOST_SQUEEZE = 0.25;
// Why a line Word may end with part of a word and a hyphen isn't known
const MAY_HYPHENATE = "a word Word may hyphenate, whose parts the layout can't know";
// Word's English dictionary breaks no word of fewer than five letters, and leaves at least two letters before the hyphen:
// "into", "upon", "also", "after" and "never" stay whole with room for "in-", "up-", "al-", "af-" and "nev-", "under" is
// broken as "un-", and "unbelievably" and "abandonment" stay whole with room for "u-" and "a-" but not "un-" and "ab-"
// (scripts/layout-probes/word-hyphenation.ts HY5, HY3a, HY3f). A dictionary Word hasn't been seen using might break any
// word of two letters or more after its first
const ENGLISH_DICTIONARY = { letters: 5, part: 2 };
const ANY_DICTIONARY = { letters: 2, part: 1 };

/**
 * The fewest letters a word Word may hyphenate has, and the fewest characters it leaves before the hyphen, by the
 * dictionary of its text, or none when Word leaves it whole: when it is in text Word doesn't hyphenate (HY7), has too few
 * letters, as numbers have none (HY6), or is in capitals and the document leaves those whole, typed so or shown so with
 * `w:caps` (HY10a, HY10b), but not when only its first letter is a capital (HY10c). Small capitals, and superscript and
 * subscript, which are smaller, Word hasn't been seen leaving whole. Nor has it been seen with a word only part of which
 * is in text it doesn't hyphenate, which is taken as one it may break anywhere, from its first characters on.
 */
const dictionaryOf = (
    pieces: readonly Piece[],
    { capitalsWhole }: Hyphenation,
): { readonly letters: number; readonly part: number } | undefined => {
    const hyphenated = pieces.filter(({ hyphenation }) => hyphenation !== "none");
    const letters = [...textOf(pieces)].filter((character) => /\p{L}/u.test(character));
    const dictionary = hyphenated.some(({ hyphenation }) => hyphenation === "unknown") ? ANY_DICTIONARY : ENGLISH_DICTIONARY;
    const capitals =
        capitalsWhole === true &&
        letters.every((letter) => /\p{Lu}/u.test(letter)) &&
        pieces.every(({ font }) => font.lineSize === undefined);
    return hyphenated.length === 0 || letters.length < dictionary.letters || capitals ? undefined : dictionary;
};
// A distributed line can spread its letters as well as its spaces, so Word squeezes a word onto it less often. It weighs
// how far the line would stretch without the word as if each space took this many times what each letter does: between
// 7.02 and 7.3 times puts every one of Word's lines of K01 to K07, K12 and JU3a where Word put them
const SPACE_TO_LETTER = 7.2;

type TextItem = Extract<InlineItem, { readonly type: "text" }>;
type SoftHyphenItem = Extract<InlineItem, { readonly type: "softHyphen" }>;

// The spaces lines break after, which go past the end of a line as U+0020 does: the en, em and four-per-em spaces, which
// Word has as spaces of its own, and the ideographic space. Word joins the words around the other spaces, such as the thin
// space (word-character-widths B and H, and word-watertight-text TX19g)
const SPACES: ReadonlySet<string> = new Set([" ", "\u2002", "\u2003", "\u2005", "\u3000"]);

/** How many characters pieces have */
const lengthOf = (pieces: readonly Piece[]): number => pieces.reduce((total, { text }) => total + [...text].length, 0);

/**
 * Turns text next to each other into words and the spaces between them. Pieces of words next to each other in different
 * fonts are one word, unless the line can break between them. A soft hyphen in a word is where it may break.
 */
const tokenizeText = (items: readonly (TextItem | SoftHyphenItem)[], rules: LineBreakRules): readonly Token[] => {
    const breaks = findLineBreaks(
        items.filter((item): item is TextItem => item.type === "text"),
        rules,
    );
    // eslint-disable-next-line functional/prefer-readonly-type
    const tokens: { readonly type: "word" | "space"; readonly pieces: Piece[]; hyphens?: Hyphen[] }[] = [];
    let index = 0;
    for (const item of items) {
        if (item.type === "softHyphen") {
            // One after a space, or at the start, is where the line can break anyway
            const word = tokens[tokens.length - 1];
            if (word?.type === "word") {
                // eslint-disable-next-line functional/immutable-data
                word.hyphens = [...(word.hyphens ?? []), { at: lengthOf(word.pieces), font: item.font }];
            }
            continue;
        }
        const { text, font, hyphenation } = item;
        const own = hyphenation === undefined ? {} : { hyphenation };
        for (const character of text) {
            const type = SPACES.has(character) ? "space" : "word";
            const last = tokens[tokens.length - 1];
            if (last?.type !== type || (type === "word" && breaks.has(index))) {
                // eslint-disable-next-line functional/immutable-data
                tokens.push({ type, pieces: [{ text: character, font, ...own }] });
            } else {
                const piece = last.pieces[last.pieces.length - 1];
                const same = piece.font === font && piece.hyphenation === hyphenation;
                // eslint-disable-next-line functional/immutable-data
                last.pieces[last.pieces.length - 1 + (same ? 0 : 1)] = { text: same ? piece.text + character : character, font, ...own };
            }
            index++;
        }
    }
    return tokens;
};

/**
 * Turns a part of a paragraph into tokens.
 */
const tokenize = (items: readonly InlineItem[], rules: LineBreakRules): readonly Token[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const tokens: Token[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    let text: (TextItem | SoftHyphenItem)[] = [];
    for (const item of items) {
        if (item.type === "text" || item.type === "softHyphen") {
            // eslint-disable-next-line functional/immutable-data
            text.push(item);
        } else {
            // eslint-disable-next-line functional/immutable-data
            tokens.push(...tokenizeText(text, rules), item as Exclude<InlineItem, { readonly type: "text" | "softHyphen" | "break" }>);
            text = [];
        }
    }
    return [...tokens, ...tokenizeText(text, rules)];
};

/**
 * Splits a paragraph's content at its breaks.
 */
const segmentsOf = (items: readonly InlineItem[], rules: LineBreakRules): readonly Segment[] => {
    const breaks = items.flatMap((item, index) => (item.type === "break" ? [index] : []));
    const starts = [0, ...breaks.map((index) => index + 1)];
    return starts.map((start, index) => {
        const end = breaks[index];
        return {
            tokens: tokenize(items.slice(start, end), rules),
            end: end === undefined ? undefined : (items[end] as Segment["end"]),
        };
    });
};

/**
 * A word's characters, each with the marks on it and anything a zero-width joiner joins to it, which a line never breaks
 * between, in the pieces of the fonts they are in.
 */
const charactersOf = (pieces: readonly Piece[]): readonly (readonly Piece[])[] =>
    pieces.reduce<readonly (readonly Piece[])[]>(
        (all, { text, font }) =>
            [...text].reduce((characters, character) => {
                const last = characters[characters.length - 1];
                const lastPiece = last?.[last.length - 1];
                if (!lastPiece || !(extendsCharacter(character) || joinsNext([...lastPiece.text].pop()!))) {
                    return [...characters, [{ text: character, font }]];
                }
                const joined =
                    lastPiece.font === font
                        ? [...last.slice(0, -1), { text: `${lastPiece.text}${character}`, font }]
                        : [...last, { text: character, font }];
                return [...characters.slice(0, -1), joined];
            }, all),
        [],
    );

/** The en, em, four-per-em and ideographic spaces of pieces of spaces, without the others */
const othersOf = (pieces: readonly Piece[]): readonly Piece[] =>
    pieces.map(({ text, font }) => ({ text: text.replace(/ /g, ""), font })).filter(({ text }) => text.length > 0);

/**
 * A font's formatting with Word's defaults where it gives none, so formatting written as the default is the same as none,
 * its name in small letters, as the measurers find a font by its name in any case, and whether it is kerned, rather than
 * from what size
 */
const withDefaults = (font: TextFont): Readonly<Record<string, unknown>> => ({
    size: DEFAULT_FONT_SIZE,
    bold: false,
    italic: false,
    characterSpacing: 0,
    scale: 100,
    ...Object.fromEntries(Object.entries(font).filter(([, value]) => value !== undefined)),
    font: (font.font ?? DEFAULT_FONT).toLowerCase(),
    kerning: isKerned(font),
});

/** Whether two pieces of text are in the same font, with the same formatting */
const sameFont = (one: TextFont, other: TextFont): boolean => {
    const [first, second] = [withDefaults(one), withDefaults(other)];
    return Object.keys(first).length === Object.keys(second).length && Object.entries(first).every(([key, value]) => second[key] === value);
};

/**
 * The room borders take between text in one and text in another: the end of the one's box and the start of the other's.
 * Text next to text with the same border is in one box with it, with no room between: two runs with the same border are
 * as wide as one, and two with borders of other widths or colours are each in a box of their own
 * (scripts/layout-probes/word-run-formatting.ts RF7i, RF7k, word-run-formatting2.ts RF12)
 */
const roomBetween = (before: TextBorder | undefined, after: TextBorder | undefined): number =>
    before?.key === after?.key ? 0 : (before?.room ?? 0) + (after?.room ?? 0);

/** The border of the start or end of pieces of text */
const firstBorder = (pieces: readonly Piece[]): TextBorder | undefined => pieces[0].font.border;
const lastBorder = (pieces: readonly Piece[]): TextBorder | undefined => pieces[pieces.length - 1].font.border;

/** Whether pieces of text in the same font are measured together: when they are kerned, or join letters */
const shaped = (font: TextFont): boolean => isKerned(font) || hasLigatures(font);

/**
 * How wide pieces of text are, with the room of the borders between them. Pieces next to each other in the same font, and
 * kerned or with ligatures, are measured together, so the pairs of characters across them are kerned, as Word kerns them
 * across runs (word-fonts.docx F4), and their letters joined. Others are measured apart, as a measurer may measure a
 * piece, such as a page number, differently on its own.
 */
const widthOf = (pieces: readonly Piece[], measurer: TextMeasurer): number => {
    if (pieces.length === 0) {
        return 0;
    }
    let total = 0;
    let [{ text, font }] = pieces;
    for (const piece of pieces.slice(1)) {
        total += roomBetween(font.border, piece.font.border);
        if (shaped(font) && sameFont(font, piece.font)) {
            text += piece.text;
            continue;
        }
        total += measurer.measureWidth(text, font);
        ({ text, font } = piece);
    }
    return total + measurer.measureWidth(text, font);
};

/**
 * A paragraph's text in the pieces it is measured in: text next to text in the same font, kerned or with ligatures, as one,
 * across bookmarks and soft hyphens between them, as its pairs of characters are kerned and its letters joined across
 * runs, and other text on its own. So kerning and ligatures a measurer doesn't know are found across runs too. Text
 * beside a soft hyphen, which Word hasn't been seen with, is marked: text kerned or joined across one, and kerned text
 * before one in its font, with whose last letter the hyphen Word draws at the end of a line may be kerned.
 */
export const textMeasuredTogether = (items: readonly InlineItem[]): readonly (Piece & { readonly besideSoftHyphen?: boolean })[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const pieces: (Piece & { readonly besideSoftHyphen?: boolean })[] = [];
    let joins = false;
    // Whether a soft hyphen is between the text before and the next
    let hyphen = false;
    for (const item of items) {
        if (item.type === "marker") {
            continue;
        }
        const last = pieces[pieces.length - 1];
        if (item.type === "softHyphen") {
            // Text before it with a letter to kern or join with, which a field's result left empty doesn't have
            const before = joins && last.text.length > 0;
            hyphen = before;
            if (before && isKerned(item.font) && sameFont(last.font, item.font)) {
                // eslint-disable-next-line functional/immutable-data
                pieces[pieces.length - 1] = { ...last, besideSoftHyphen: true };
            }
            continue;
        }
        if (item.type !== "text") {
            joins = false;
        } else if (joins && shaped(last.font) && sameFont(last.font, item.font)) {
            // eslint-disable-next-line functional/immutable-data
            pieces[pieces.length - 1] = {
                text: last.text + item.text,
                font: last.font,
                ...(hyphen || last.besideSoftHyphen === true ? { besideSoftHyphen: true } : {}),
            };
        } else {
            // eslint-disable-next-line functional/immutable-data
            pieces.push({ text: item.text, font: item.font });
            joins = true;
        }
        hyphen = false;
    }
    return pieces;
};

/** The text of the pieces at the start or end of a token in the same font as the first or last, which are measured together */
const edgeOf = (pieces: readonly Piece[], end: boolean): Piece => {
    const ordered = end ? [...pieces].reverse() : pieces;
    const [{ font }] = ordered;
    const different = ordered.findIndex((piece) => !sameFont(piece.font, font));
    const same = different === -1 ? ordered : ordered.slice(0, different);
    return { text: (end ? [...same].reverse() : same).map((piece) => piece.text).join(""), font };
};

/**
 * The kerning between each word or space and the text before it on its line, in points: between the last character of a
 * word and the space after it, and between the space and the next word, which Word kerns when they are in the same font
 * and kerned (scripts/layout-probes/word-kerning.ts K: Arial and Times New Roman kern A, L, P, T, V, W and Y with the
 * space). It is how much narrower the two are measured together than apart. Nothing for a token after a tab, a picture or
 * nothing.
 */
const kerningBefore = (tokens: readonly Token[], measurer: TextMeasurer): readonly number[] => {
    // Most paragraphs aren't kerned
    if (!tokens.some((token) => (token.type === "word" || token.type === "space") && token.pieces.some(({ font }) => isKerned(font)))) {
        return tokens.map(() => 0);
    }
    let previous: Piece | undefined;
    return tokens.map((token) => {
        if (token.type === "marker") {
            return 0;
        }
        if (token.type !== "word" && token.type !== "space") {
            previous = undefined;
            return 0;
        }
        const before = previous;
        const after = edgeOf(token.pieces, false);
        previous = edgeOf(token.pieces, true);
        return before === undefined || !isKerned(after.font) || !sameFont(before.font, after.font)
            ? 0
            : measurer.measureWidth(before.text + after.text, after.font) -
                  measurer.measureWidth(before.text, before.font) -
                  measurer.measureWidth(after.text, after.font);
    });
};

// Most words are in one font, so their text needn't be joined
const textOf = (pieces: readonly Piece[]): string => (pieces.length === 1 ? pieces[0].text : pieces.map(({ text }) => text).join(""));

/** How tall what is on a line is, in points */
type Heights = {
    /** The tallest ascent of its text, with the line gap of the text's font, which Word puts above the text */
    readonly ascent: number;
    /** The deepest descent of its text */
    readonly descent: number;
    /** The tallest line of the fonts of its text and of its pictures' runs, each on its own */
    readonly tallest: number;
    /** The tallest picture, which stands on the baseline */
    readonly picture: number;
    /** Whether it has text with emphasis marks over it, or under it */
    readonly marks?: { readonly above?: boolean; readonly below?: boolean };
    /** Those of its list number, as it would be were it text, when it has one */
    readonly listNumber?: Pick<Heights, "ascent" | "descent" | "tallest">;
};

const NOTHING: Heights = { ascent: 0, descent: 0, tallest: 0, picture: 0 };

/** The heights of a line, with text in this font on it too */
const withFont = (heights: Heights, font: TextFont, measurer: TextMeasurer): Heights => {
    // A list's number takes up only the room above the baseline, and what follows it, a space or tab, none: a 20-point
    // number beside Calibri 11 makes the line its ascent and Calibri's descent, 443.6 twips, and one in Courier New 11
    // leaves it 268.55 (scripts/layout-probes/word-lists.ts LF1, LF2). Word draws what follows it in Arial, which in a
    // line of Times New Roman 12 would add a twip, and doesn't (tables-lists-and-pictures)
    if (font.listNumber === "separator") {
        return heights;
    }
    if (font.listNumber === "number") {
        const own = withFont({ ...NOTHING, ...heights.listNumber }, { ...font, listNumber: undefined }, measurer);
        return { ...heights, listNumber: { ascent: own.ascent, descent: own.descent, tallest: own.tallest } };
    }
    const line = measurer.measureLineHeight(font);
    const descent = measurer.measureDescent(font);
    // Raised text raises its ascent and descent with it, its line gap too: Courier New 11 raised 2 points beside Calibri 11
    // is 282.2 twips, Courier New's ascent and 40 above Calibri's descent, and Times New Roman 10 raised 6 points is 365.8
    // (scripts/layout-probes/word-run-formatting.ts RF5b, RF5e). Text smaller than its line can be raised as far as its
    // line's ascent without making it taller: 7 points raised 3 in a line of Calibri 11 is 268.55 (RF5a). A border adds its
    // room above and below the text, and to its own line, which multiple spacing adds its share of: a single border of half
    // a point 4 points away makes a line of Calibri 11 448.55, and 672.8 at 1.5 lines (RF7a, RF7g)
    // Its box goes round the text as it is raised, down to the baseline at least: Calibri 11 raised 6 points with the same
    // border is its ascent, the raise and the room above, and the room below the baseline, 509.5 (word-run-formatting2.ts
    // RF13a)
    const { raise = 0, border, emphasis } = font;
    const room = border?.room ?? 0;
    return {
        ...heights,
        ascent: Math.max(heights.ascent, Math.max(0, line - descent + raise) + room),
        descent: Math.max(heights.descent, Math.max(0, descent - raise) + room),
        tallest: Math.max(heights.tallest, line + 2 * room),
        ...(emphasis === undefined ? {} : { marks: { ...heights.marks, [emphasis]: true } }),
    };
};

/**
 * How tall a line with emphasis marks is: a quarter of the line more, over its text or under it, whatever the font and
 * the size of the text they are on: 67.14 twips in a line of Calibri 11 and 122 of Calibri 20, 57.5 of Times New Roman 10
 * and 63.25 of Arial 11, and 67.14 still for marks on a word of 7 points, or on a space, in a line of Calibri 11
 * (scripts/layout-probes/word-run-formatting.ts RF6, word-watertight-text.ts TX15). A line taller than its fonts' own
 * lines takes a quarter of itself: 616.95 for marks on Courier New 20 in a line of Times New Roman 20, 485.69 for a line
 * with a word raised 6 points (word-run-formatting2.ts RF10), and 114.77 over a picture of 20 points in a line of Calibri 11
 * (scripts/layout-probes/stops2/word-stops-text.ts RF21). Marks over the text and under it on one line take a quarter of it
 * over the text and another under it (RF20a, RF20b).
 *
 * Multiple and at-least spacing's room holds the marks when it is as much as theirs, and adds to it when it is less: at
 * 1.08, 1.15 and 1.2 lines, and at least 14 and 16 points, over Calibri 11, the marks add their 67.14 twips, and at 1.25,
 * 1.3, 1.5 and 2 lines and at least 18 points they don't (word-run-formatting.ts RF6k, word-run-formatting2.ts RF9,
 * word-stops-text.ts RF22c to RF22e, RF22g); at 1.15 lines over a word raised 6 points the marks' 97.14 add to the
 * spacing's 40.28 (RF22h). Below single spacing, the line and its marks' room are both that share of themselves: 268.55
 * twips at 0.8 lines, and 302.12 at 0.9 (RF22a, RF22b).
 */
const markedHeightOf = (
    { tallest, picture, marks }: Heights,
    natural: number,
    spacing: LineSpacing | undefined,
): Pick<LaidOutLine, "height" | "spacingBelow" | "unsupported"> => {
    const room = natural / 4;
    const both = marks!.above && marks!.below;
    const marked = natural + (both ? 2 * room : room);
    if (spacing === undefined || (spacing.rule === "multiple" && spacing.multiple === 1)) {
        return { height: marked };
    }
    if (spacing.rule === "exact") {
        return { height: spacing.height };
    }
    if (both || picture > 0) {
        return {
            height: marked,
            unsupported: both
                ? "emphasis marks over and under text on one line with line spacing"
                : "emphasis marks on a line with a picture and line spacing",
        };
    }
    const single = Math.abs(natural - tallest) <= TOLERANCE;
    if (spacing.rule === "multiple" && spacing.multiple < 1) {
        return single
            ? { height: marked * spacing.multiple }
            : { height: marked, unsupported: "emphasis marks on a line whose line spacing Word hasn't shown with them" };
    }
    const extra = spacing.rule === "multiple" ? (spacing.multiple - 1) * tallest : Math.max(0, spacing.height - natural);
    // Word's probes had at-least spacing over a line as tall as its fonts' own
    if (spacing.rule === "atLeast" && extra > 0 && !single) {
        return { height: marked, unsupported: "emphasis marks on a line whose line spacing Word hasn't shown with them" };
    }
    // Multiple spacing's room is below the text, and at-least spacing's above it, where the marks over it go
    const holds = extra >= room - TOLERANCE;
    const below = spacing.rule === "multiple" ? (holds ? extra - room : extra) : 0;
    return {
        height: natural + extra + (holds ? 0 : room),
        ...(below > TOLERANCE ? { spacingBelow: below } : {}),
    };
};

/**
 * How tall a line is, with the paragraph's line spacing, and how much of that multiple spacing adds below its text. Word
 * doesn't round it: Calibri 11 is 268.55 twips, and 289.82 at 259 twips' multiple spacing, where LibreOffice rounds them
 * to whole twips, 269 and 290.
 */
const heightOf = (given: Heights, spacing: LineSpacing | undefined): Pick<LaidOutLine, "height" | "spacingBelow" | "unsupported"> => {
    const heights = withNumber(given);
    const { ascent, descent, tallest, picture, marks } = heights;
    // How much multiple spacing adds to a line whose list number is taller than its text isn't known
    if (
        given.listNumber !== undefined &&
        !onlyNumber(given) &&
        heights.ascent > given.ascent + TOLERANCE &&
        spacing?.rule === "multiple" &&
        spacing.multiple !== 1
    ) {
        return { height: 0, unsupported: "a list number taller than its line's text, with multiple line spacing" };
    }
    // The line is its text's tallest ascent and deepest descent, as Word makes a line of two fonts: Calibri 11 with Courier
    // New 11 is 275.53 twips, Calibri's ascent and Courier New's descent, where each alone is 268.55 and 249.2
    // (scripts/layout-probes/word-watertight-text.ts TX9a). A picture stands on the baseline, so with text it is the
    // picture and the text's descent: 600 twips and Calibri 11's 59.08, or Times New Roman 10's 43.26 (TX8b, TX8g). The
    // line is at least as tall as each font's own, and a picture's run counts its font's: a 6-point picture alone in its
    // line, in a run of Calibri 11, is 268.55, and a 30-point one 600 (word-mixed-heights.ts MH7, MH3e)
    const natural = Math.max(Math.max(picture, ascent) + descent, tallest);
    if (marks !== undefined) {
        return markedHeightOf(heights, natural, spacing);
    }
    if (spacing === undefined) {
        return { height: natural };
    }
    if (spacing.rule !== "multiple") {
        // At least a height over a picture is the picture's line when that is taller: 659.08 at least 12 points (TX8e)
        return { height: spacing.rule === "exact" ? spacing.height : Math.max(natural, spacing.height) };
    }
    // Multiple spacing adds its share of the tallest font's own line, below the text, rather than of the line: Calibri 11
    // with Courier New 11 at 1.5 lines is 275.53 and half of Calibri's 268.55, and with a picture, 659.08 and 0.15 of 268.55
    // at 1.15 lines, also beside Calibri 8 in the picture's run of Calibri 11 (MH1b, TX8c, MH4e)
    const spacingBelow = (spacing.multiple - 1) * tallest;
    return { height: natural + spacingBelow, ...(spacingBelow > 0 ? { spacingBelow } : {}) };
};

/**
 * How tall a line on a document grid's lines is: as many of them as its own height needs, from the first fraction of a
 * twip more, and with multiple line spacing as many times one of them as the spacing says, when that is taller. So 18
 * lines of 360 twips, and at least 18 points, hold a line of Times New Roman of up to 15.5 points, and from 16 points it
 * takes 2, and 1.08 lines are 388.8 twips (scripts/layout-probes/word-grid.ts G1, G3, G4). At least a height is that
 * height, when it is taller, and exact spacing is as it is without the grid. Its text is in the middle of the room,
 * and at least a height's in the middle of the grid's lines it takes, so the room below the text can go below the bottom
 * of the page, as multiple spacing's can: a line of Times New Roman 8 that ends 82 twips below it is on the page, and one
 * of Times New Roman 12 that would end there isn't (G1, G14a). Emphasis marks take their room in the line before it is
 * put on the grid (G11d), and with multiple line spacing too: lines of MS Mincho 10.5 with marks at 1.5 lines are 540
 * twips on a grid of 360 (stops2/word-stops-east-asian.ts GR3). With at least a height, they haven't been seen
 */
const gridHeightOf = (
    given: Heights,
    spacing: LineSpacing | undefined,
    pitch: number,
): Pick<LaidOutLine, "height" | "spacingBelow" | "unsupported"> => {
    if (spacing?.rule === "exact") {
        return heightOf(given, spacing);
    }
    const own = heightOf(given, undefined);
    const unsupported =
        given.marks !== undefined && spacing?.rule === "atLeast"
            ? "emphasis marks on a line with at least a height of line spacing on a document grid"
            : (own.unsupported ?? heightOf(given, spacing).unsupported);
    const gridded = Math.max(1, Math.ceil(own.height / pitch - GRID_ROUNDING)) * pitch;
    const height =
        spacing === undefined ? gridded : Math.max(spacing.rule === "multiple" ? spacing.multiple * pitch : spacing.height, gridded);
    const below = ((spacing?.rule === "atLeast" ? gridded : height) - own.height) / 2;
    return { height, ...(below > 0 ? { spacingBelow: below } : {}), ...(unsupported === undefined ? {} : { unsupported }) };
};

// How far short of a whole number of a grid's lines a line's height can be and take only that many, for the rounding of
// its sum
const GRID_ROUNDING = 1e-9;

/** Whether a line has nothing on it but a list number and what follows it */
const onlyNumber = ({ ascent, descent, tallest, picture, listNumber }: Heights): boolean =>
    listNumber !== undefined && ascent === 0 && descent === 0 && tallest === 0 && picture === 0;

/**
 * A line's heights with its list number's: the number's ascent beside text, or all of it as text when nothing else is on
 * the line.
 */
const withNumber = (heights: Heights): Heights => {
    const { listNumber } = heights;
    if (listNumber === undefined) {
        return heights;
    }
    return onlyNumber(heights) ? { ...heights, ...listNumber } : { ...heights, ascent: Math.max(heights.ascent, listNumber.ascent) };
};

/** A line being laid out */
type LineState = {
    /** Where the next token starts, in points from the left edge of the text */
    readonly position: number;
    /** Where the line starts, and where the last of its words, pictures or tabs ends */
    readonly start: number;
    readonly end: number;
    readonly text: string;
    /** How tall its text and pictures are */
    readonly heights: Heights;
    /**
     * How wide its spaces are after its first word or its last tab, which Word squeezes in a justified line, in points.
     * Those at the start of the line, and before a tab, aren't squeezed (`word-justify.docx` J15, J18), nor are no-break
     * spaces, which are in the words (J16)
     */
    readonly spaces: number;
    /** How many spaces those are, and how many of them are before its last word */
    readonly spaceCount: number;
    readonly between: number;
    /** How many characters its words have after its last tab, and pictures it has */
    readonly letters: number;
    /**
     * How wide the en, em, four-per-em and ideographic spaces among its spaces are, which Word neither squeezes nor
     * stretches (scripts/layout-probes/stops2/word-stops-tabs.ts JU1a to JU1c), and whether a word past its end could be
     * squeezed in beside them, so Word's breaking of it isn't known
     */
    readonly otherSpaces: number;
    readonly unknown?: boolean;
    /** The border of the text placed last, whose box is open there */
    readonly border?: TextBorder;
    readonly markers: readonly string[];
    /** The bookmarks that start with the next word, picture or tab, which may wrap onto the next line */
    readonly pending: readonly string[];
    /** Whether it has a word, a picture or a tab on it yet */
    readonly started: boolean;
    /** Whether it is the first line of the paragraph, which starts at its first line indent */
    readonly first: boolean;
    /** Whether it has a tab to one of the paragraph's stops past its right indent, after which it ends at the margin */
    readonly pastIndent?: boolean;
    /**
     * On a grid that snaps to characters, where the text that isn't Chinese, Japanese or Korean at the end of the line
     * started, and how wide it is, which takes as many of the grid's cells as it needs
     */
    readonly latin?: { readonly start: number; readonly width: number };
    /** Why where its text goes isn't known, when it isn't */
    readonly unsupported?: string;
};

/**
 * Where a tab moves to: the next of the paragraph's tab stops, or the next default one past the last of them. On the
 * first line of a paragraph with a hanging indent, the indent is a stop too. Undefined when the next stop is past the
 * end of the line.
 */
const nextStop = (
    position: number,
    stops: readonly TabStop[],
    defaultStop: number,
    limit: number,
): { readonly position: number; readonly alignment: TabStop["alignment"] } | undefined => {
    const stop = stops.find((given) => given.position > position + TOLERANCE) ?? {
        position: (Math.floor((position + TOLERANCE) / defaultStop) + 1) * defaultStop,
        alignment: "left" as const,
    };
    return stop.position > limit + TOLERANCE ? undefined : stop;
};

/**
 * How wide tokens are, one after the other, with the room of the borders between them and the kerning before each, after
 * the box of a border that is `open` before them, if one is
 */
const widthOfTokens = (tokens: readonly Token[], measurer: TextMeasurer, open?: TextBorder): number => {
    const kerning = kerningBefore(tokens, measurer);
    return tokens.reduce(
        ({ total, border }, token, index) => {
            if (token.type === "box") {
                return { total: total + roomBetween(border, undefined) + token.width, border: undefined };
            }
            return token.type === "word" || token.type === "space"
                ? {
                      total: total + roomBetween(border, firstBorder(token.pieces)) + kerning[index] + widthOf(token.pieces, measurer),
                      border: lastBorder(token.pieces),
                  }
                : { total, border };
        },
        { total: 0, border: open },
    ).total;
};

/**
 * The width of the text after a tab, up to the next tab or the end of the part: what lines up with a right or centered
 * stop. Spaces at its end aren't counted.
 */
const widthAfterTab = (tokens: readonly Token[], measurer: TextMeasurer, border?: TextBorder): number => {
    const text = textAfterTab(tokens);
    const lastWord = text.findLastIndex((token) => token.type !== "space" && token.type !== "marker");
    return widthOfTokens(text.slice(0, lastWord + 1), measurer, border);
};

/** Pieces of text split after this many characters */
const splitPieces = (pieces: readonly Piece[], at: number): readonly [readonly Piece[], readonly Piece[]] => {
    let count = 0;
    const parts = pieces.map(({ text, font }) => {
        const characters = [...text];
        const taken = Math.max(0, Math.min(characters.length, at - count));
        count += characters.length;
        return [
            { text: characters.slice(0, taken).join(""), font },
            { text: characters.slice(taken).join(""), font },
        ] as const;
    });
    const written = (piece: Piece): boolean => piece.text.length > 0;
    return [parts.map(([before]) => before).filter(written), parts.map(([, after]) => after).filter(written)];
};

/**
 * Where text after a decimal stop lines up with it, as the number of its characters before the stop: at its first full
 * stop, unless a number, of digits and commas, comes first and ends without one, which lines up its end. Word lined up
 * "$1,234.50", "12.5%", "(3.25)", "x 1.5", "1.5 x", "Total 12.50" and ".75" at their full stop, "a.b", "1.2.3" and "e.g. 7"
 * at their first, the end of "abc", "1,5", "7" and "-", "1 234.5" at the end of its "1" (scripts/layout-probes/word-breaks-and-tabs.ts
 * DT1 to DT15, word-watertight-text.ts TX12a), "12%" at the end of its "12" and "12, 34" at the end of its "12,"
 * (scripts/layout-probes/stops2/word-stops-tabs.ts TA6f, TA6j)
 */
const decimalPointOf = (text: string): number => {
    const characters = [...text];
    const point = characters.indexOf(".");
    const digit = characters.findIndex((character) => /[0-9]/.test(character));
    if (digit === -1 || (point !== -1 && point < digit)) {
        return point === -1 ? characters.length : point;
    }
    const end = characters.findIndex((character, index) => index > digit && !/[0-9,]/.test(character));
    return end === -1 ? characters.length : end;
};

/**
 * How far the text after a tab goes before a decimal stop: up to where it lines up with it (see {@link decimalPointOf}).
 * Undefined where a picture comes before it, as where Word lines that up hasn't been seen.
 */
const widthBeforeDecimal = (tokens: readonly Token[], measurer: TextMeasurer, border?: TextBorder): number | undefined => {
    const text = textAfterTab(tokens).filter((token) => token.type !== "marker");
    const written = text
        .map((token) => (token.type === "word" || token.type === "space" ? textOf(token.pieces) : "\uFFFC"))
        .join("")
        .trimEnd();
    const point = decimalPointOf(written);
    if ([...written].slice(0, point).includes("\uFFFC")) {
        return undefined;
    }
    // The text before it, and the part of the word or spaces it is in
    let count = 0;
    const before = text.flatMap((token): readonly Token[] => {
        const length = token.type === "word" || token.type === "space" ? lengthOf(token.pieces) : 1;
        const from = count;
        count += length;
        if (from + length <= point) {
            return [token];
        }
        // It lines up at a full stop, at a space or at the end, so never in spaces
        return from < point && token.type === "word" ? [{ type: "word", pieces: splitPieces(token.pieces, point - from)[0] }] : [];
    });
    return widthOfTokens(before, measurer, border);
};

/**
 * How far before its stop the text after a tab starts: none for a left stop, half its width for a centred one, all of it
 * for a right one, and up to where it lines up for a decimal one. Text in a border lines up with its box's room before and
 * after it: a right stop with the end of the box, a centred one with its middle, and a decimal one with its text
 * (scripts/layout-probes/stops2/word-stops-tabs.ts TA7b to TA7d). Undefined for text at a decimal stop that lines up where
 * Word hasn't been seen to line it up.
 */
const shiftAt = (
    alignment: TabStop["alignment"],
    tokens: readonly Token[],
    measurer: TextMeasurer,
    border?: TextBorder,
): number | undefined => {
    if (alignment === "left") {
        return 0;
    }
    if (alignment === "decimal") {
        return widthBeforeDecimal(tokens, measurer, border);
    }
    const text = textAfterTab(tokens);
    // The box of text that ends it ends after it, where a picture after the text has closed it already
    const last = text.findLast((token) => token.type === "word" || token.type === "space" || token.type === "box");
    const after =
        widthAfterTab(tokens, measurer, border) + (last === undefined || last.type === "box" ? 0 : (lastBorder(last.pieces)?.room ?? 0));
    return alignment === "center" ? after / 2 : after;
};

/** The tokens after a tab, up to the next tab or the end of the part */
const textAfterTab = (tokens: readonly Token[]): readonly Token[] => {
    const next = tokens.findIndex((token) => token.type === "tab");
    return next === -1 ? tokens : tokens.slice(0, next);
};

/**
 * A paragraph's tab stops in order, and those of its first line, where a hanging indent is a stop too.
 */
const stopsOf = (
    tabStops: readonly TabStop[],
    { indentLeft = 0, firstLineIndent = 0 }: ParagraphFormat,
): { readonly stops: readonly TabStop[]; readonly firstLineStops: readonly TabStop[] } => {
    const stops = [...tabStops].sort((a, b) => a.position - b.position);
    const firstLineStops =
        firstLineIndent < 0
            ? [...stops, { position: indentLeft, alignment: "left" as const }].sort((a, b) => a.position - b.position)
            : stops;
    return { stops, firstLineStops };
};

/**
 * How far before the start of its first line a paragraph's list number starts, when it isn't left-aligned: half its
 * width when it is centred, and all of it when it is right-aligned, with the space after it, when one follows it, so the
 * text after the space starts there (`word-lists.docx` LJ4).
 */
const numberShift = (items: readonly InlineItem[], alignment: LineLayoutOptions["numberAlignment"], measurer: TextMeasurer): number => {
    const [listNumber, separator] = items;
    if (alignment === undefined || listNumber?.type !== "text") {
        return 0;
    }
    const width = widthOf([listNumber], measurer);
    if (alignment === "center") {
        return width / 2;
    }
    return width + (separator?.type === "text" && separator.font.listNumber === "separator" ? widthOf([separator], measurer) : 0);
};

/**
 * Where the tab after a right-aligned list number moves to, from the number's end at the start of the first line. Word
 * moves it to the first stop at or after the number's end: the hanging indent's (`word-lists.docx` LJ1, LJ7, LJ9), or,
 * without one, the left indent, when it is on a default stop too (LJ6). It says why when Word may move it to the next
 * stop instead, which it hasn't shown: where the number ends at another stop, or at a left indent that isn't one.
 */
const numberTabStop = (
    position: number,
    stops: readonly TabStop[],
    { indentLeft = 0, firstLineIndent = 0 }: ParagraphFormat,
    defaultStop: number,
    limit: number,
): { readonly stop?: TabStop; readonly unsupported?: string } => {
    const stop = nextStop(position - 2 * TOLERANCE, stops, defaultStop, limit);
    // Moved on past the number's end, but to the left indent without a hanging indent
    const past =
        firstLineIndent !== 0
            ? nextStop(position, stops, defaultStop, limit)
            : indentLeft <= limit + TOLERANCE
              ? { position: indentLeft, alignment: "left" as const }
              : undefined;
    const agree = stop === undefined || past === undefined ? stop === past : Math.abs(stop.position - past.position) <= TOLERANCE;
    return agree ? { stop } : { stop, unsupported: "a tab after a list number aligned right, which Word hasn't been seen to move" };
};

/** The rules for where a paragraph's lines break: the document's, with the paragraph's own */
const rulesOf = ({ kinsoku, wordWrap }: ParagraphFormat, rules: LineBreakRules = {}): LineBreakRules => ({
    ...rules,
    ...(kinsoku === undefined ? {} : { kinsoku }),
    ...(wordWrap === undefined ? {} : { wordWrap }),
});

/** How wide a paragraph is, in points, with its indents */
export type ContentWidths = {
    /** The narrowest it can be: its widest word or picture, which a line can't break */
    readonly min: number;
    /** On lines as long as it needs: its widest line, broken only where it has breaks */
    readonly max: number;
    /**
     * Whether Word may hyphenate a word as wide as the narrowest it can be, so it can be narrower by a part of the word the
     * layout can't know, as Word sizes the columns of a table to the parts of its words it hyphenates
     * (`word-hyphenation.docx` HY11)
     */
    readonly hyphenated?: boolean;
};

/**
 * Measures how narrow and how wide a paragraph can be, which Word sizes the columns of tables whose cells have no widths
 * by. Spaces at the end of a line take no room, as they don't when it wraps.
 *
 * @param items - The paragraph's content, in order
 */
export const measureContentWidths = (
    items: readonly InlineItem[],
    {
        format = {},
        tabStops = [],
        defaultTabStop = DEFAULT_TAB_STOP,
        measurer = DEFAULT_MEASURER,
        breakRules,
        numberAlignment,
        hyphenation,
    }: Omit<LineLayoutOptions, "width" | "markFont">,
): ContentWidths => {
    const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = format;
    const { stops, firstLineStops } = stopsOf(tabStops, format);
    const beforeStart = numberShift(items, numberAlignment, measurer);
    const numberTab = numberAlignment === "right" && items[1]?.type === "tab";
    const hyphenating = hyphenation !== undefined && format.suppressAutoHyphens !== true ? hyphenation : undefined;
    // The narrowest it can be, and as narrow as its words and pictures Word doesn't hyphenate let it be
    const { min, max, whole } = segmentsOf(items, rulesOf(format, breakRules)).reduce(
        (widths, { tokens }, segmentIndex) => {
            const first = segmentIndex === 0;
            const lineStart = first ? indentLeft + firstLineIndent - beforeStart : indentLeft;
            let position = lineStart;
            let end = position;
            let { min: narrowest, whole: wholeWords } = widths;
            // The border of the text before, whose box is open, and of the last word, picture or tab
            let border: TextBorder | undefined;
            let endBorder: TextBorder | undefined;
            const kerning = kerningBefore(tokens, measurer);
            for (const [index, token] of tokens.entries()) {
                if (token.type === "marker") {
                    continue;
                }
                if (token.type === "space") {
                    position += roomBetween(border, firstBorder(token.pieces)) + kerning[index] + widthOf(token.pieces, measurer);
                    border = lastBorder(token.pieces);
                    continue;
                }
                // A tab with the border of the text before it keeps its box open, as when laid out
                const keepsBox = token.type === "tab" && token.font.border !== undefined && token.font.border.key === border?.key;
                const lead =
                    token.type === "word" ? roomBetween(border, firstBorder(token.pieces)) : keepsBox ? 0 : roomBetween(border, undefined);
                border = token.type === "word" ? lastBorder(token.pieces) : keepsBox ? border : undefined;
                endBorder = border;
                if (token.type === "tab") {
                    const stop =
                        (first && numberTab && tokens.findIndex((other) => other.type === "tab") === index
                            ? numberTabStop(position + lead, firstLineStops, format, defaultTabStop, Infinity).stop
                            : undefined) ?? nextStop(position + lead, first ? firstLineStops : stops, defaultTabStop, Infinity)!;
                    const rest = tokens.slice(index + 1);
                    const shift = shiftAt(stop.alignment, rest, measurer, border) ?? widthAfterTab(rest, measurer, border);
                    position = Math.max(position + lead, stop.position - shift);
                    end = position;
                    continue;
                }
                const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
                // The first word of a line starts where it is, and any other can wrap to the start of a line, where a word in
                // a border starts its box again. A box ends on its line with the border's room after it
                const close = border?.room ?? 0;
                const start =
                    end === lineStart ? position + lead : indentLeft + (token.type === "word" ? (firstBorder(token.pieces)?.room ?? 0) : 0);
                narrowest = Math.max(narrowest, start + tokenWidth + close + indentRight);
                if (token.type === "box" || !hyphenating || !dictionaryOf(token.pieces, hyphenating)) {
                    wholeWords = Math.max(wholeWords, start + tokenWidth + close + indentRight);
                }
                position += lead + kerning[index] + tokenWidth;
                end = position;
            }
            return { min: narrowest, whole: wholeWords, max: Math.max(widths.max, narrowest, end + (endBorder?.room ?? 0) + indentRight) };
        },
        { min: 0, max: 0, whole: 0 },
    );
    return { min, max, ...(min > whole + TOLERANCE ? { hyphenated: true } : {}) };
};

/** What a character is next to another for the space a grid of lines and characters puts between them */
const kindOnGrid = (character: string): "grid" | "letter" | "space" | "other" | undefined =>
    isGridCharacter(character)
        ? "grid"
        : takesNoRoom(character)
          ? undefined
          : /\p{L}/u.test(character)
            ? "letter"
            : /\s/u.test(character)
              ? "space"
              : "other";

/**
 * A paragraph's content on a grid of lines and characters, which adds its space after each character of the text on it,
 * Chinese, Japanese and Korean or not, and half-width ones too: 39 ideographs of MS Mincho 10.5 on a line of 9026 twips,
 * 230 apart, rather than 42, and 10 i's of Times New Roman 10.5 763 twips from the first to the end of the last, rather
 * than 583. Between a Chinese, Japanese or Korean character and a Latin letter in an East Asian font, either way, it adds
 * a quarter of the first's size and that space more: 57 twips at 10.5 points and a point more, and 50 at a third of a
 * point less, but nothing next to a space or a note's number (scripts/layout-probes/word-grid.ts CA1 to CA4, CA9, CB1 to
 * CB4, word-grid3.ts H4, H5). Next to text in another font it adds nothing: digits of Calibri 10.5 between ideographs of
 * MS Mincho 10.5 are as far from them as from each other, and so are Latin words of Calibri 16 (stops2/word-stops-east-asian.ts
 * GR4a, GR4c). A run's own space after each character adds to it (H9), and text in a run that doesn't snap to the grid is as
 * it is without it (CA5, CB5). Where Word puts a space between those characters and numbers or punctuation in an East Asian
 * font, or its letters of another size, isn't known
 */
const spacedOnGrid = (
    items: readonly InlineItem[],
    space: number,
): { readonly items: readonly InlineItem[]; readonly unsupported?: string } => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const spaced: InlineItem[] = [];
    let unsupported: string | undefined;
    // The last character, its item in what is laid out, its kind and size, and whether it is in an East Asian font
    let last:
        | {
              readonly index: number;
              readonly kind: "grid" | "letter" | "space" | "other";
              readonly size: number;
              readonly eastAsian: boolean;
          }
        | undefined;
    for (const item of items) {
        if (item.type !== "text" || item.font.snapToGrid === false) {
            // eslint-disable-next-line functional/immutable-data
            spaced.push(item);
            last = item.type === "marker" ? last : undefined;
            continue;
        }
        const size = item.font.size ?? DEFAULT_FONT_SIZE;
        const font = { ...item.font, characterSpacing: (item.font.characterSpacing ?? 0) + space };
        for (const character of item.text) {
            // Text drawn smaller than its line, such as a note's number in superscript, has no space before it either: the
            // reference after "H5 body" and 10 ideographs is where they end (word-grid3.ts H5)
            const kind = item.font.lineSize === undefined ? kindOnGrid(character) : "space";
            const eastAsian = isEastAsianFont(item.font.font);
            const boundary =
                kind !== undefined &&
                kind !== "space" &&
                last !== undefined &&
                last.kind !== "space" &&
                (last.kind === "grid") !== (kind === "grid") &&
                // The side that isn't Chinese, Japanese or Korean is in an East Asian font
                (kind === "grid" ? last.eastAsian : eastAsian);
            if (boundary && (last!.kind === "other" || kind === "other" || last!.size !== size)) {
                unsupported ??=
                    "a number, punctuation or text of another size in an East Asian font next to an East Asian character on a grid of characters";
            }
            if (boundary) {
                // The space goes after the character before, the last of its item, which it is split from
                const before = spaced[last!.index] as Extract<InlineItem, { readonly type: "text" }>;
                const characters = [...before.text];
                const eastAsianSize = last!.kind === "grid" ? last!.size : size;
                // eslint-disable-next-line functional/immutable-data
                spaced.splice(
                    last!.index,
                    1,
                    { ...before, text: characters.slice(0, -1).join("") },
                    {
                        ...before,
                        text: characters[characters.length - 1],
                        font: { ...before.font, characterSpacing: before.font.characterSpacing! + (eastAsianSize + space) / 4 },
                    },
                );
            }
            const current = spaced[spaced.length - 1];
            if (!boundary && current?.type === "text" && current.font === font) {
                // eslint-disable-next-line functional/immutable-data
                spaced[spaced.length - 1] = { ...current, text: current.text + character };
            } else {
                // eslint-disable-next-line functional/immutable-data
                spaced.push({ ...item, text: character, font });
            }
            last = kind === undefined ? last && { ...last, index: spaced.length - 1 } : { index: spaced.length - 1, kind, size, eastAsian };
        }
    }
    return {
        items: spaced.filter((item) => item.type !== "text" || item.text.length > 0),
        ...(unsupported === undefined ? {} : { unsupported }),
    };
};

// Why a tab on a grid that snaps to characters can't be laid out as Word does, where it can't
const GRID_TAB = "a tab on a grid that snaps to characters, but for a left one before Chinese, Japanese or Korean text";

/** Whether the text after a tab starts with a Chinese, Japanese or Korean character, which a grid that snaps to characters puts in its cells */
const startsWithGridCharacter = (tokens: readonly Token[]): boolean => {
    const next = tokens.find((token) => token.type !== "marker");
    const first = next?.type === "word" ? [...textOf(next.pieces)][0] : undefined;
    return first !== undefined && isGridCharacter(first);
};

/**
 * Breaks a paragraph into lines, as Word breaks it.
 *
 * @param items - The paragraph's content, in order
 */
export const layoutLines = (
    items: readonly InlineItem[],
    {
        width,
        format = {},
        tabStops = [],
        defaultTabStop = DEFAULT_TAB_STOP,
        markFont = {},
        measurer = DEFAULT_MEASURER,
        breakRules,
        numberAlignment,
        hyphenation,
        grid = {},
        compatibilityMode,
    }: LineLayoutOptions,
): readonly LaidOutLine[] => {
    const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing, alignment } = format;
    const { linePitch, characterSpace, characterPitch, characterRoom } = grid;
    /**
     * The width of the cells of a grid that snaps to characters on a line, from its index, when the paragraph is on one: the
     * section's, or in columns of different widths the column's, as many as there is room for in it, as wide as fill it: 9
     * of 222.2 twips in a column of 2000, and 29 of 225 in one of 6526, for cells of at least 221
     * (stops2/word-stops-east-asian.ts GR12)
     */
    const cellOn = (line: number): number | undefined => {
        if (characterRoom === undefined) {
            return characterPitch;
        }
        const given = typeof width === "number" ? width : width(line);
        const column = typeof given === "number" ? given : given.end;
        return column / Math.max(1, Math.floor(column / characterRoom + GRID_ROUNDING));
    };
    // The cells of the line being filled
    let cell = cellOn(0);
    // A grid of lines and characters adds its space after each character of the text on it, Chinese, Japanese and Korean
    // or not, and half-width ones too: 39 ideographs of MS Mincho 10.5 on a line of 9026 twips, 230 apart, rather than 42,
    // and 10 i's of Times New Roman 10.5 763 twips from the first to the end of the last, rather than 583. Text in a run
    // that doesn't snap to the grid is as it is without it (scripts/layout-probes/word-grid.ts CA1 to CA5, CA9, CB1 to
    // CB5)
    const spaced = characterSpace === undefined ? undefined : spacedOnGrid(items, characterSpace);
    const content = spaced?.items ?? items;
    /** The width of the cells a width of text takes on a grid that snaps to characters */
    const cellsOf = (textWidth: number): number => (textWidth <= 0 ? 0 : Math.max(1, Math.ceil(textWidth / cell! - GRID_ROUNDING)) * cell!);
    /**
     * Where a line goes on to after pieces of text, on a grid that snaps to characters, with what of it isn't Chinese,
     * Japanese or Korean. Each of those characters takes as many of the grid's cells as it is wide, and the other text
     * between them on a line as many as it needs, together: 19 ideographs of MS Mincho 12 to a line of 39 cells of 231.44
     * twips, and "abc de" between ideographs 3 cells (scripts/layout-probes/word-grid.ts CC1 to CC4, CD1 to CD4). Text in a
     * run that doesn't snap to the grid is as wide as it is (CC5)
     */
    const snapped = (state: Pick<LineState, "position" | "latin">, pieces: readonly Piece[]): Pick<LineState, "position" | "latin"> => {
        let { position, latin } = state;
        for (const { text, font } of pieces) {
            for (const character of text) {
                const characterWidth = measurer.measureWidth(character, font);
                if (font.snapToGrid === false) {
                    position += characterWidth;
                    latin = undefined;
                } else if (isGridCharacter(character)) {
                    position = (latin ? latin.start + cellsOf(latin.width) : position) + cellsOf(characterWidth);
                    latin = undefined;
                } else {
                    latin = { start: latin?.start ?? position, width: (latin?.width ?? 0) + characterWidth };
                    position = latin.start + cellsOf(latin.width);
                }
            }
        }
        return { position, latin };
    };
    // Where each line starts is on the grid's cells, with indents of a whole number of them
    const firstCell = cell;
    const offCells =
        firstCell !== undefined &&
        [indentLeft, indentLeft + firstLineIndent].some(
            (start) => Math.abs(start / firstCell - Math.round(start / firstCell)) > TOLERANCE / firstCell,
        );
    // Word kerns text on a grid of lines and characters, and adds the grid's space after each character as well: "AVATAR
    // Toyota WAVE" and the like in Calibri 11, kerned from a point, on a grid adding 1 twip, are 4172 twips, as wide as
    // kerned and 44 twips more (stops2/word-stops-east-asian.ts GR5). Whether it kerns on a grid that snaps to characters,
    // which measures the other text a cell at a time, and whether it joins letters into ligatures on either, hasn't been
    // seen
    const shapedOnGrid = items.some(
        (item) =>
            item.type === "text" &&
            item.font.snapToGrid !== false &&
            ((cell !== undefined && shaped(item.font)) || (characterSpace !== undefined && hasLigatures(item.font))),
    )
        ? "ligatures on a document grid of characters, or kerning on one that snaps to characters"
        : undefined;
    const unknownOnGrid = offCells
        ? "an indent of part of a character on a grid that snaps to characters"
        : (spaced?.unsupported ?? shapedOnGrid);
    // How tall a line as tall as the paragraph's mark is, measured only where it counts, as a layout stops at a mark in a
    // font the measurer doesn't know
    let markHeight: number | undefined;
    const markLineHeight = (): number => (markHeight ??= measurer.measureLineHeight(markFont));
    // A line with no text on it is as tall as the mark, and a border on the mark takes no room
    // (scripts/layout-probes/word-run-formatting.ts RF8d)
    const emptyLineFont: TextFont = { ...markFont, border: undefined };
    /**
     * Whether a line of only pictures, with multiple line spacing, is in a paragraph whose mark has a taller line than the
     * pictures' runs, so that how tall the line is depends on whether the mark counts. With single spacing it doesn't: a
     * picture of 10 points in a run of 11 points makes a line of 13.45 points, as the run does, in a paragraph whose mark
     * is 20 points (scripts/layout-probes/stops2/word-stops-text.ts PB8), and beside text it doesn't count either. With
     * multiple spacing Word's probes had the pictures' runs as large as the mark or larger (scripts/layout-probes/word-mixed-heights.ts
     * MH3d, MH7)
     */
    const markMatters = ({ ascent, tallest, picture }: Heights): boolean =>
        picture > 0 &&
        ascent === 0 &&
        markLineHeight() > tallest + TOLERANCE &&
        lineSpacing?.rule === "multiple" &&
        lineSpacing.multiple !== 1;
    /**
     * Whether a line of only a list number is as tall as the number, or as the paragraph's mark, where they differ, which
     * Word hasn't shown. The number is in the mark's formatting, but for what its list's level gives it
     */
    const unlikeMark = (heights: Heights): boolean => {
        if (!onlyNumber(heights)) {
            return false;
        }
        const mark = withFont(NOTHING, { ...markFont, border: undefined }, measurer);
        return (["ascent", "descent", "tallest"] as const).some((part) => Math.abs(mark[part] - heights.listNumber![part]) > TOLERANCE);
    };
    /** The heights of a line with the text of the token on it too */
    const withToken = (heights: Heights, token: Exclude<Token, { readonly type: "marker" }>): Heights => {
        if (token.type === "box") {
            const tallest = token.font ? Math.max(heights.tallest, measurer.measureLineHeight(token.font)) : heights.tallest;
            // One that takes room as text does has an ascent and descent of its own
            return token.descent === undefined
                ? { ...heights, picture: Math.max(heights.picture, token.height), tallest }
                : {
                      ...heights,
                      ascent: Math.max(heights.ascent, token.height),
                      descent: Math.max(heights.descent, token.descent),
                      tallest: Math.max(tallest, token.height + token.descent),
                  };
        }
        return token.type === "tab"
            ? withFont(heights, token.font, measurer)
            : token.pieces.reduce((all, { font }) => withFont(all, font, measurer), heights);
    };
    // Word squeezes the spaces of a justified line to fit one more word on it, so it has more words to a line than a
    // left-aligned one (`word-watertight-text.docx` TX20). Word 2010 and before don't: in their compatibility modes, Word
    // breaks a justified line where it breaks one aligned left (`word-stops-compat-14.docx` CM1, CM9, CM10, CM14)
    const squeezes =
        alignment === "justified" || alignment === "distributed" || alignment === "thaiDistributed" || alignment === "lowKashida";
    const older = compatibilityMode !== undefined;
    const { stops, firstLineStops } = stopsOf(tabStops, format);
    const parts = segmentsOf(content, rulesOf(format, breakRules));
    // A page break at the end of a paragraph has the paragraph's mark on its line, as Word lays it out from Word 2013,
    // rather than on a line of its own on the next page. A column break's mark is on a line at the top of the next column,
    // in Word and LibreOffice
    const [previous, last] = parts.slice(-2);
    const endsWithBreak = parts.length > 1 && previous.end!.kind === "page" && last.tokens.every((token) => token.type === "marker");
    const segments = endsWithBreak ? [...parts.slice(0, -2), { tokens: [...previous.tokens, ...last.tokens], end: previous.end }] : parts;

    // eslint-disable-next-line functional/prefer-readonly-type
    const lines: LaidOutLine[] = [];
    /** The room of a line of its own, from its index, when it has one */
    const roomOf = (line: number): LineRoom | undefined => {
        const given = typeof width === "number" ? width : width(line);
        return typeof given === "number" ? undefined : given;
    };
    /** Where a line ends, from its index: where the line being filled ends, unless another is given */
    const limitOf = (line = lines.length): number => marginOf(line) - (roomOf(line) === undefined ? indentRight : 0);
    /**
     * Where the room for a line ends, from its index, before the paragraph's right indent, or the end of its own room, which
     * is in the indents
     */
    const marginOf = (line = lines.length): number => {
        const given = typeof width === "number" ? width : width(line);
        return typeof given === "number" ? given : given.end;
    };
    /**
     * Where a line starts, from its index, and whether it is the paragraph's first. On a grid that snaps to characters, a
     * line beside a drawing starts at the next of the grid's cells: right of a picture that ends 2880 twips across, on a
     * grid of cells of 225.65, at 2933.5, the 13th (stops2/word-stops-east-asian.ts GR7b)
     */
    const startOf = (line: number, isFirst: boolean): number => {
        const room = roomOf(line);
        if (room === undefined) {
            return indentLeft + (isFirst ? firstLineIndent : 0);
        }
        return cell === undefined ? room.start : Math.ceil(room.start / cell - GRID_ROUNDING) * cell;
    };
    /**
     * Where the line being filled ends: the margin after a tab to one of the paragraph's stops past its right indent, which
     * Word lines text up with on the line (scripts/layout-probes/word-breaks-and-tabs.ts TP6, TP9)
     */
    const endOf = (state: LineState): number => (state.pastIndent ? marginOf() : limitOf());
    /**
     * Whether Word squeezes a word or picture this wide onto a justified or distributed line it goes past the end of,
     * rather than move it to the next line. It squeezes the line's spaces in proportion to their widths, and does when that
     * takes less of their width than a quarter, and than half of what the spaces between the words already on it would
     * stretch by with it on the next line, or, on a distributed line, the spaces and letters. That is so on a paragraph's
     * last line, and one that ends with a line break, too (J10 to J12). Latin text justified for Thai or with a low kashida
     * is squeezed as justified text is (K08, K09). A line whose only spaces are en, em or ideographic spaces, which Word
     * doesn't squeeze, takes no more (JU1a to JU1c)
     */
    const squeezesIn = (state: LineState, tokenWidth: number): boolean => {
        if (!squeezes || older || state.spaces - state.otherSpaces <= TOLERANCE) {
            return false;
        }
        const over = state.position + tokenWidth - limitOf();
        const slack = limitOf() - state.end;
        if (over / state.spaces > MOST_SQUEEZE) {
            return false;
        }
        if (alignment === "distributed") {
            // How far each space would stretch, and be squeezed, in points
            const stretch = (slack * SPACE_TO_LETTER) / (SPACE_TO_LETTER * state.between + state.letters);
            return stretch >= STRETCH_TO_SQUEEZE * (over / state.spaceCount);
        }
        const between = state.spaces - (state.position - state.end);
        return between <= 0 || slack / between >= STRETCH_TO_SQUEEZE * (over / state.spaces);
    };
    // Word's automatic hyphenation, unless the paragraph suppresses it (HY2)
    const hyphenating = hyphenation !== undefined && format.suppressAutoHyphens !== true ? hyphenation : undefined;
    /**
     * Whether Word may hyphenate a word that goes past the end of a line, putting a part of it and a hyphen on the line.
     * Which parts Word can break a word into is in its dictionary for the word's language, which the layout doesn't have,
     * so a word Word may hyphenate stops the layout. Word certainly leaves it whole when its dictionary breaks no word like
     * it, or the shortest part it can leave before the hyphen doesn't fit in the room the line has left. It hyphenates
     * whenever a part fits, however little room is left: in compatibility mode 15 it has no hyphenation zone, so a zone of
     * an inch hyphenates as the default quarter of an inch does, and "un-" fits in 16 points (word-hyphenation-zone.docx
     * HY1 to HY13, HY3b). It doesn't squeeze a justified line's spaces to fit a part, as it does to fit a word (HY4a)
     */
    const mayHyphenate = (state: LineState, token: Extract<Token, { readonly type: "word" }>, lead: number): boolean => {
        const dictionary = hyphenating && dictionaryOf(token.pieces, hyphenating);
        if (!dictionary) {
            return false;
        }
        const part = charactersOf(token.pieces).slice(0, dictionary.part).flat();
        const hyphen = { text: "-", font: part[part.length - 1].font };
        return state.position + lead + widthOf([...part, hyphen], measurer) <= limitOf() + TOLERANCE;
    };
    /**
     * Whether a word or picture past the end of a justified line could be squeezed in, were the spaces Word doesn't
     * squeeze among its spaces squeezed as the others are, beside ordinary spaces it does, or at a four-per-em space,
     * which Word hasn't been seen with
     */
    const unsure = (state: LineState, tokenWidth: number): boolean =>
        squeezes &&
        !older &&
        state.otherSpaces > 0 &&
        (state.spaces - state.otherSpaces > TOLERANCE || state.text.includes("\u2005")) &&
        state.position + tokenWidth - limitOf() <= MOST_SQUEEZE * state.spaces;
    /**
     * Why where Word puts the text after a tab to one of the paragraph's own stops past the end of the line isn't known,
     * when it isn't: its probes had no right indent past the margin, indents, first line and hanging ones too
     * (scripts/layout-probes/stops2/word-stops-tabs.ts TA1a, TA1b), only with a left stop after text, a left indent with a
     * right stop at the start of a line (TA3d), a right indent only with a right stop after text, and centred and decimal
     * stops in a paragraph without indents, after text and at the start of a line (TA3a to TA3c)
     */
    const pastEndUnknown = ({ alignment: kind }: TabStop, started: boolean): string | undefined => {
        if (indentRight < 0 || (firstLineIndent !== 0 && (kind !== "left" || !started))) {
            return "a tab stop past the end of the line in a paragraph with a first line or hanging indent, or indented past the margin";
        }
        if (kind === "left") {
            return !started && (indentLeft !== 0 || indentRight !== 0)
                ? "a left tab stop past the end of the line at the start of a line in an indented paragraph"
                : undefined;
        }
        const known = (indentLeft === 0 && indentRight === 0) || (kind === "right" && (started ? indentLeft === 0 : indentRight === 0));
        return known ? undefined : "a right, centred or decimal tab stop past the end of the line in an indented paragraph";
    };
    // A list number that isn't left-aligned starts before its line does, which its text is measured from
    const beforeStart = numberShift(content, numberAlignment, measurer);
    // Whether the next tab is the one after a right-aligned list number
    let numberTab = numberAlignment === "right" && content[1]?.type === "tab";
    let first = true;
    for (const [segmentIndex, { tokens, end }] of segments.entries()) {
        const isLast = segmentIndex === segments.length - 1;
        cell = cellOn(lines.length);
        const start = startOf(lines.length, first);
        let line: LineState = {
            position: first ? start - beforeStart : start,
            start,
            end: start,
            text: "",
            heights: NOTHING,
            spaces: 0,
            spaceCount: 0,
            between: 0,
            letters: 0,
            otherSpaces: 0,
            markers: [],
            pending: [],
            started: false,
            first,
            ...(unknownOnGrid === undefined ? {} : { unsupported: unknownOnGrid }),
        };
        const finish = (state: LineState, breakAfter?: LaidOutLine["breakAfter"]): void => {
            // Spaces add nothing to the height of a line with no text on it, which is as tall as its mark, as Word and
            // LibreOffice lay it out
            const heights = state.started ? state.heights : withFont(NOTHING, emptyLineFont, measurer);
            const { unsupported: unknownHeight, ...height } =
                linePitch === undefined ? heightOf(heights, lineSpacing) : gridHeightOf(heights, lineSpacing, linePitch);
            const unsupported = state.unknown
                ? "a justified line that only fits squeezed at a four-per-em space, or at an en, em or ideographic space beside ordinary spaces"
                : (state.unsupported ??
                  (markMatters(withNumber(heights))
                      ? "a picture alone in a line of a paragraph whose mark is larger, with multiple line spacing"
                      : unlikeMark(heights)
                        ? "a line of only a list number of another size or font than its paragraph's mark"
                        : unknownHeight));
            // eslint-disable-next-line functional/immutable-data
            lines.push({
                ...height,
                markers: [...state.markers, ...state.pending],
                ...(breakAfter ? { breakAfter } : {}),
                text: state.text,
                textWidth: Math.max(0, state.end - state.start),
                ...(unsupported === undefined ? {} : { unsupported }),
            });
        };
        const wrap = (state: LineState): LineState => {
            finish({ ...state, pending: [] });
            cell = cellOn(lines.length);
            const next = startOf(lines.length, false);
            return {
                position: next,
                start: next,
                end: next,
                text: "",
                heights: NOTHING,
                spaces: 0,
                spaceCount: 0,
                between: 0,
                letters: 0,
                otherSpaces: 0,
                markers: [],
                pending: state.pending,
                started: false,
                first: false,
            };
        };
        /** Puts the bookmarks waiting for the next word, picture or tab on the line it is on */
        const place = (state: LineState): LineState => ({ ...state, markers: [...state.markers, ...state.pending], pending: [] });
        const kerning = kerningBefore(tokens, measurer);

        /**
         * Leaves a line with room of its own, beside a drawing, that the next word or picture doesn't fit in empty, and the
         * next too, until one it fits in, as Word leaves it however narrow the room is: "of", 183 twips wide, goes in a room
         * of 360, and not of 180 (`word-floats.docx` F13, F14). Whether Word puts the part of a word before a soft hyphen in
         * it hasn't been seen. Whether it left a line, so the word starts the next
         */
        const skipRooms = (needs: number, hyphenated: boolean): boolean => {
            let skipped = false;
            while (!line.started && roomOf(lines.length) !== undefined && line.position + needs > limitOf() + TOLERANCE) {
                if (hyphenated) {
                    line = { ...line, unsupported: line.unsupported ?? "a word with a soft hyphen beside a drawing it doesn't fit beside" };
                    return skipped;
                }
                line = wrap(line);
                skipped = true;
            }
            return skipped;
        };

        /**
         * Puts a word or picture on the line, or on the next, or breaks it across lines. A word is kerned with the text
         * before it on the line by `kern`, unless it starts the next line
         */
        const placeWord = (token: Extract<Token, { readonly type: "word" | "box" }>, kern = 0): void => {
            /** How wide the token is on the line, which on a grid that snaps to characters depends on the text before it */
            const widthOn = (state: LineState): number =>
                token.type === "box"
                    ? cell === undefined
                        ? token.width
                        : cellsOf(token.width)
                    : cell === undefined
                      ? widthOf(token.pieces, measurer)
                      : snapped(state, token.pieces).position - state.position;
            let tokenWidth = widthOn(line);
            // A word in a border starts its box, unless it goes on from the text before it, and on the next line it starts
            // it again: a bordered run that goes on to the next line starts it 90 twips in, for a border of half a point 4
            // points away (scripts/layout-probes/word-run-formatting.ts RF7n). A line has room for its box to end after its
            // last word, whether the box goes on to the next line or not: such a word 70 twips short of the end of the line
            // goes on to the next, and one 110 short stays (word-run-formatting2.ts RF11)
            const leadOf = (state: LineState, wrapped = false): number =>
                (token.type === "word" ? roomBetween(state.border, firstBorder(token.pieces)) : 0) + (wrapped ? 0 : kern);
            const boxEnd = token.type === "word" ? (lastBorder(token.pieces)?.room ?? 0) : 0;
            const needs = leadOf(line) + tokenWidth + boxEnd;
            const hyphens = token.type === "word" ? (token.hyphens ?? []).filter(({ at }) => at > 0 && at < lengthOf(token.pieces)) : [];
            const skipped = skipRooms(needs, hyphens.length > 0);
            // A justified line Word can squeeze the word onto takes it whole, as it does a word without soft hyphens: at its
            // spaces 3% to 20% narrower (scripts/layout-probes/word-breaks-and-tabs.ts SH1a to SH1e)
            const squeezedIn = squeezes && line.started && squeezesIn(line, needs);
            if (token.type === "word" && hyphens.length > 0 && !squeezedIn && line.position + needs > endOf(line) + TOLERANCE) {
                // Where Word breaks a word at a soft hyphen on a grid that snaps to characters hasn't been seen. One that fits its
                // line it leaves whole there, as elsewhere (stops2/word-stops-east-asian.ts GR7a)
                if (cell !== undefined) {
                    line = {
                        ...line,
                        unsupported: line.unsupported ?? "a soft hyphen at the end of a line on a grid that snaps to characters",
                    };
                }
                // With automatic hyphenation, Word breaks the word where its dictionary does too, after its last soft hyphen
                // that fits or before its first (scripts/layout-probes/word-hyphenation.ts HY8a, HY8b)
                if (line.started && mayHyphenate(line, token, leadOf(line))) {
                    line = { ...line, unsupported: line.unsupported ?? MAY_HYPHENATE };
                }
                const rest = breakAtHyphen(token, hyphens, kern);
                if (rest !== undefined) {
                    placeWord(rest);
                    return;
                }
                if (line.started) {
                    // No part of it fits with a hyphen: it goes on to the next line, where it may break again
                    line = wrap(line);
                    placeWord(token);
                    return;
                }
                // Not even its first part fits on a line of its own: Word breaks it after the last character that fits, as it
                // does a word longer than its line, and the rest of it as any other word (scripts/layout-probes/stops2/word-stops-tabs.ts
                // SH12: its part of 12000 twips broken across two lines, and the rest of it, with the part after its soft
                // hyphen, whole on the second)
            }
            const overflows = line.started && line.position + needs > endOf(line) + TOLERANCE;
            if (token.type === "box" && token.unbroken !== undefined && line.position + needs > endOf(line) + TOLERANCE) {
                line = { ...line, unsupported: line.unsupported ?? token.unbroken };
            }
            // On a grid that snaps to characters Word doesn't squeeze a justified line, nor stretch its spaces: "was" ends the
            // first line of a justified paragraph of Latin words, with its spaces as wide as they are, and "made", which
            // fits squeezed, starts the next (stops2/word-stops-east-asian.ts GR8). A distributed line there hasn't been
            // seen
            const unsqueezed = cell !== undefined && alignment === "justified";
            if (overflows && !unsqueezed && unsure(line, needs)) {
                line = { ...line, unknown: true };
            }
            // Word squeezes a line with text in a border on it as it does any other (scripts/layout-probes/stops2/word-stops-tabs.ts
            // JU2)
            const squeezable = overflows && !line.unknown && !unsqueezed && squeezesIn(line, needs);
            if (squeezable && cell !== undefined) {
                line = { ...line, unsupported: "a distributed line on a grid that snaps to characters that only fits squeezed" };
            }
            const squeezed = squeezable && cell === undefined;
            // Word squeezes a word onto a justified line rather than hyphenate it (HY4b), but hasn't been seen choosing between
            // them on a distributed line, whose letters it spreads too
            if (overflows && (!squeezed || alignment !== "justified") && token.type === "word" && mayHyphenate(line, token, leadOf(line))) {
                line = { ...line, unsupported: line.unsupported ?? MAY_HYPHENATE };
            }
            if (overflows && !squeezed) {
                line = wrap(line);
                skipRooms(needs, hyphens.length > 0);
                tokenWidth = widthOn(line);
            }
            line = { ...place(line), position: line.position + leadOf(line, skipped || (overflows && !squeezed)) };
            if (
                token.type === "word" &&
                !squeezed &&
                line.position + tokenWidth > endOf(line) + TOLERANCE &&
                limitOf() - startOf(lines.length, false) > 0
            ) {
                // A word wider than a line is broken across as many lines as it needs, after the last character that fits
                // on each, and never between a character and the marks on it or what a zero-width joiner joins to it. In a
                // border, each line has room for the box to end after its last character, and the next starts the box again
                // (scripts/layout-probes/stops2/word-stops-text.ts RF23). On a grid that snaps to characters too, where the part
                // of it on the last of its lines takes as many cells as it needs, with the text after it: a line of 98 letters of
                // Calibri 10.5 ends 3 twips before the end of a line of 40 cells, and the 30 letters after them, with a space,
                // take 13 cells before the next ideograph (stops2/word-stops-east-asian.ts GR9)
                let placed = false;
                let partStart = line.position;
                // Word may hyphenate it instead
                if (mayHyphenate(line, token, 0)) {
                    line = { ...line, unsupported: line.unsupported ?? MAY_HYPHENATE };
                }
                // Its characters on each line are measured together, kerned as Word kerns them, so more of them fit on a line
                // than measured each on its own: 76 letters of "AV" again and again in Calibri 11 kerned from 1 point (scripts/layout-probes/stops2/word-stops-kerning.ts
                // KE6a). Where Word breaks one whose letters it joins into ligatures, which may be inside a ligature, hasn't
                // been seen
                if (token.pieces.some(({ font }) => hasLigatures(font))) {
                    line = { ...line, unsupported: line.unsupported ?? "a word longer than its line with ligatures" };
                }
                // eslint-disable-next-line functional/prefer-readonly-type
                let onLine: Piece[] = [];
                let from = line.position;
                for (const character of charactersOf(token.pieces)) {
                    const room = lastBorder(character)?.room ?? 0;
                    // Each line is as long as it is, for lines of different widths, and one with no room takes the rest
                    if (
                        placed &&
                        from + widthOf([...onLine, ...character], measurer) + room > endOf(line) + TOLERANCE &&
                        limitOf(lines.length + 1) - startOf(lines.length + 1, false) > 0
                    ) {
                        line = wrap({ ...line, heights: withToken(line.heights, token), started: true });
                        partStart = line.position;
                        line = { ...line, position: line.position + room };
                        onLine = [];
                        from = line.position;
                    }
                    onLine = [...onLine, ...character];
                    const reached = from + widthOf(onLine, measurer);
                    line = {
                        ...line,
                        position: reached,
                        end: reached,
                        text: line.text + textOf(character),
                        letters: line.letters + lengthOf(character),
                    };
                    placed = true;
                }
                if (cell !== undefined) {
                    const latin = { start: partStart, width: line.position - partStart };
                    line = { ...line, latin, position: latin.start + cellsOf(latin.width), end: latin.start + cellsOf(latin.width) };
                }
            } else {
                const text = token.type === "word" ? textOf(token.pieces) : "";
                line = {
                    ...line,
                    ...(cell !== undefined && token.type === "word" ? { latin: snapped(line, token.pieces).latin } : {}),
                    position: line.position + tokenWidth,
                    end: line.position + tokenWidth,
                    text: line.text + text,
                    letters: line.letters + (token.type === "box" ? 1 : lengthOf(token.pieces)),
                };
            }
            line = {
                ...line,
                end: line.position,
                between: line.spaceCount,
                heights: withToken(line.heights, token),
                started: true,
                border: token.type === "word" ? lastBorder(token.pieces) : undefined,
            };
        };
        /**
         * Breaks a word at the last of its soft hyphens that leaves its part before it, and a hyphen in the soft hyphen's
         * font, on the line, as Word breaks it (scripts/layout-probes/word-watertight-text.ts TX10a: 12 lines, 8 of them
         * ending in a hyphen, each where docx/layout's widths of Calibri end them), and a word longer than its line again on
         * each line (word-breaks-and-tabs.ts SH4), after the text before it on the line, which it is kerned with by `kern`.
         * The rest of the word, which goes on to the next line, or undefined when no part of it fits
         */
        const breakAtHyphen = (
            word: Extract<Token, { readonly type: "word" }>,
            hyphens: readonly Hyphen[],
            kern: number,
        ): Extract<Token, { readonly type: "word" }> | undefined => {
            const lead = roomBetween(line.border, firstBorder(word.pieces)) + kern;
            const splits = [...hyphens].reverse().map((hyphen) => {
                const [before, after] = splitPieces(word.pieces, hyphen.at);
                const partEnd = line.position + lead + widthOf(before, measurer);
                const withHyphen = partEnd + measurer.measureWidth("-", hyphen.font);
                return { hyphen, before, after, withHyphen, room: endOf(line) - withHyphen };
            });
            for (const [index, { hyphen, before, after, withHyphen, room }] of splits.entries()) {
                // On a justified line, a part whose hyphen goes past the end of the line ends it when Word can squeeze it on, as
                // it would a word: the line's spaces squeezed by 17% to fit "Donau-" (scripts/layout-probes/stops2/word-stops-tabs.ts
                // SH10d). Where a shorter part fits without squeezing, which of the two Word takes hasn't been seen
                const squeezed = room <= 0 && line.started && squeezesIn(line, withHyphen - line.position);
                if (squeezed && splits.slice(index + 1).some((shorter) => shorter.room >= HYPHEN_ROOM)) {
                    line = {
                        ...line,
                        unsupported:
                            line.unsupported ?? "a justified line that fits a soft hyphen's part squeezed, and a shorter one as it is",
                    };
                }
                if (room >= HYPHEN_ROOM || squeezed) {
                    const placed = place(line);
                    line = wrap({
                        ...placed,
                        position: withHyphen,
                        end: withHyphen,
                        text: placed.text + textOf(before),
                        letters: placed.letters + lengthOf(before),
                        between: placed.spaceCount,
                        heights: withFont(withToken(placed.heights, { type: "word", pieces: before }), hyphen.font, measurer),
                        started: true,
                    });
                    return {
                        type: "word",
                        pieces: after,
                        hyphens: hyphens.filter(({ at }) => at > hyphen.at).map((later) => ({ ...later, at: later.at - hyphen.at })),
                    };
                }
                if (room > NO_HYPHEN_ROOM || (squeezes && room > 0)) {
                    // Where between the two Word turns from one to the other hasn't been seen, nor whether it squeezes a
                    // justified line to fit a hyphen that ends too close to the end of the line for a line it doesn't
                    line = {
                        ...line,
                        unsupported: line.unsupported ?? "a soft hyphen whose hyphen ends this close to the end of the line",
                    };
                }
            }
            return undefined;
        };

        for (const [index, token] of tokens.entries()) {
            if (token.type === "marker") {
                const before = tokens[index - 1]?.type;
                line =
                    token.after === true && (before === "word" || before === "box")
                        ? { ...line, markers: [...line.markers, token.name] }
                        : { ...line, pending: [...line.pending, token.name] };
                continue;
            }
            if (token.type === "space") {
                const spaces = widthOf(token.pieces, measurer);
                line = {
                    ...line,
                    ...(cell === undefined
                        ? { position: line.position + roomBetween(line.border, firstBorder(token.pieces)) + kerning[index] + spaces }
                        : snapped(line, token.pieces)),
                    text: line.text + textOf(token.pieces),
                    spaces: line.started ? line.spaces + spaces : 0,
                    spaceCount: line.started ? line.spaceCount + lengthOf(token.pieces) : 0,
                    otherSpaces: line.started ? line.otherSpaces + widthOf(othersOf(token.pieces), measurer) : 0,
                    heights: withToken(line.heights, token),
                    border: lastBorder(token.pieces),
                };
                continue;
            }
            // A tab or picture after text with a border closes its box, but for a tab with the same border, which the box goes
            // on round, as text after it in the box starts at its stop (scripts/layout-probes/stops2/word-stops-tabs.ts TA7a)
            line =
                token.type === "word" ||
                (token.type === "tab" && token.font.border !== undefined && token.font.border.key === line.border?.key)
                    ? line
                    : { ...line, position: line.position + roomBetween(line.border, undefined), border: undefined };
            // On a grid that snaps to characters, a picture in the line after Chinese, Japanese or Korean text, or at the start
            // of a line, takes as many of the grid's cells as it needs: one 300 twips wide takes 2 of 225.65 (see
            // `placeWord`). One after other text, whose cells it may share, and an equation, haven't been seen
            if (cell !== undefined && token.type === "box" && (line.latin !== undefined || token.descent !== undefined)) {
                line = {
                    ...line,
                    unsupported:
                        line.unsupported ??
                        "an equation, or a picture after text other than Chinese, Japanese or Korean, on a grid that snaps to characters",
                };
            }
            if (cell !== undefined && token.type !== "word") {
                line = { ...line, latin: undefined };
            }
            if (token.type === "tab") {
                const numbered = numberTab ? numberTabStop(line.position, firstLineStops, format, defaultTabStop, limitOf()) : undefined;
                numberTab = false;
                if (numbered?.unsupported !== undefined) {
                    line = { ...line, unsupported: numbered.unsupported };
                }
                const given = line.first ? firstLineStops : stops;
                const next = nextStop(line.position, given, defaultTabStop, Infinity)!;
                const rest = tokens.slice(index + 1);
                const own = !numbered && given.includes(next);
                // One of the paragraph's own stops between its right indent and the margin: Word lines the text after it up
                // with it on the line, past the indent, as far as the margin, at a left or right stop (scripts/layout-probes/word-breaks-and-tabs.ts
                // TP6, TP9) and at a centred or decimal one (scripts/layout-probes/stops2/word-stops-tabs.ts TA4a, TA4b)
                const pastIndent =
                    own && indentRight > 0 && next.position > limitOf() + TOLERANCE && next.position <= marginOf() + TOLERANCE;
                // One past the end of the line: the text after a right, centred or decimal one lines up with the end of the line,
                // or of the next when it doesn't fit (word-watertight-text.ts TX12c, word-breaks-and-tabs.ts TP1, TP2, TP5, TP7),
                // at the start of a line too (word-stops-tabs.ts TA3a to TA3d); a left one takes a line of its own, below the text
                // before it, and the text after it goes on to the start of the next (TX12d, TP3, TP4, word-stops-tabs.docx TA8a to
                // TA8g), with a first line or hanging indent too (TA1a, TA1b). Past the last of the default stops before the end of
                // the line, the tab goes on to the next line, as below (TX12b)
                const pastEnd = own && next.position > Math.max(limitOf(), marginOf()) + TOLERANCE ? next : undefined;
                // A left one past the margin in a paragraph indented past it, with text after it that doesn't fit: Word put the
                // tab on the next line, at its stop, and broke the text after it there as a word longer than its line
                // (word-stops-tabs.ts TA1c), which a word after a tab elsewhere isn't
                const pastMargin =
                    own &&
                    indentRight < 0 &&
                    next.alignment === "left" &&
                    next.position > marginOf() + TOLERANCE &&
                    next.position + widthAfterTab(rest, measurer) > limitOf() + TOLERANCE;
                const unknown =
                    pastIndent && squeezes
                        ? "a tab stop past the paragraph's right indent in a justified line"
                        : pastIndent && next.alignment === "left" && next.position + widthAfterTab(rest, measurer) > marginOf() + TOLERANCE
                          ? "text after a tab stop past the paragraph's right indent that goes past the margin"
                          : pastMargin && pastEnd === undefined
                            ? "text after a left tab stop past the margin, in a paragraph indented past it, that goes past the end of the line"
                            : pastEnd === undefined
                              ? undefined
                              : pastEndUnknown(pastEnd, line.started);
                if (unknown !== undefined) {
                    line = { ...line, unsupported: line.unsupported ?? unknown };
                }
                // Word 2010 and before put the text after a tab to a stop past the end of the line, the paragraph's own or a
                // default one, past the margin on the line, where Word 2013 moves it to the next (`word-stops-compat-14.docx`
                // CM12a, CM12d), in ways not yet followed. Guessing, it goes where Word 2013 puts it
                if (older && !numbered && next.position > limitOf() + TOLERANCE) {
                    line = {
                        ...line,
                        unsupported: line.unsupported ?? "a tab past the end of the line in a document in compatibility mode",
                    };
                }
                if (pastEnd?.alignment === "left" && unknown === undefined) {
                    const below = line.started ? wrap(line) : line;
                    line = wrap(place({ ...below, text: `${below.text}\t`, heights: withToken(below.heights, token), started: true }));
                    continue;
                }
                const aligned = pastEnd !== undefined && pastEnd.alignment !== "left" && unknown === undefined;
                if (aligned && line.position + widthAfterTab(rest, measurer) > limitOf() + TOLERANCE) {
                    // The text doesn't fit before the end of the line, so the tab goes on to the next line, and the text lines
                    // up with its end
                    line = wrap(line);
                }
                const stop = numbered
                    ? numbered.stop
                    : aligned
                      ? { position: limitOf(), alignment: "right" as const }
                      : pastIndent
                        ? next
                        : (nextStop(line.position, given, defaultTabStop, limitOf()) ??
                          (line.started
                              ? nextStop(startOf(lines.length + 1, false), stops, defaultTabStop, limitOf(lines.length + 1))
                              : undefined));
                if (stop === undefined) {
                    // No stop before the end of the line: the text after the tab starts where it is, which on a grid that snaps
                    // to characters hasn't been seen
                    line = {
                        ...line,
                        end: line.position,
                        text: `${line.text}\t`,
                        heights: withToken(line.heights, token),
                        started: true,
                        ...(cell === undefined ? {} : { unsupported: line.unsupported ?? GRID_TAB }),
                    };
                    continue;
                }
                if (!numbered && stop.position <= line.position + TOLERANCE) {
                    // The tab moves to a stop on the next line
                    line = wrap(line);
                }
                line = { ...place(line), ...(pastIndent ? { pastIndent } : {}) };
                const shift = shiftAt(stop.alignment, rest, measurer, line.border);
                const misaligned = shift === undefined ? "text at a decimal tab stop that Word hasn't been seen lining up" : undefined;
                // The text after it starts at the stop however much the spaces before it are squeezed. On a grid that snaps to
                // characters, Chinese, Japanese or Korean text after a left stop starts at the next of the grid's cells: after
                // a stop at 3000 twips, on a grid of cells of 225.65, at 3159, the 14th (stops2/word-stops-east-asian.ts
                // GR10a). Other text after one, and text at a stop of another alignment, haven't been seen there
                const stopped = Math.max(line.position, stop.position - (shift ?? widthAfterTab(rest, measurer)));
                const position = cell === undefined ? stopped : Math.ceil(stopped / cell - GRID_ROUNDING) * cell;
                if (cell !== undefined && (stop.alignment !== "left" || !startsWithGridCharacter(rest))) {
                    line = {
                        ...line,
                        unsupported: line.unsupported ?? GRID_TAB,
                    };
                }
                line = {
                    ...line,
                    position,
                    end: position,
                    text: `${line.text}\t`,
                    heights: withToken(line.heights, token),
                    spaces: 0,
                    spaceCount: 0,
                    between: 0,
                    letters: 0,
                    otherSpaces: 0,
                    started: true,
                    ...(misaligned === undefined ? {} : { unsupported: line.unsupported ?? misaligned }),
                };
                continue;
            }
            placeWord(token, kerning[index]);
        }

        if (!end) {
            // The mark adds nothing to the height of a line with text, as Word and LibreOffice lay it out
            finish(line);
        } else {
            // A page break that ends the paragraph has the mark on its line, which with no text on it is as tall as the mark,
            // however big the break and the spaces before it are: 28-point spaces before a 28-point break, in an 11-point
            // paragraph, are an 11-point line in Word and LibreOffice (word-probes.docx U8a7)
            const breakFont = isLast && !line.started ? emptyLineFont : end.font;
            finish(
                { ...line, heights: withFont(line.started ? line.heights : NOTHING, breakFont, measurer), started: true },
                end.kind === "line" ? undefined : end.kind,
            );
        }
        first = false;
    }
    // Word 2010 and before put the mark of a paragraph that ends with a page break on a line of its own on the next page,
    // as `splitPgBreakAndParaMark` brings back, in a way not yet followed
    return older && endsWithBreak
        ? lines.map((line, index) => (index === lines.length - 1 ? { ...line, unsupported: OLDER_PAGE_BREAK } : line))
        : lines;
};
