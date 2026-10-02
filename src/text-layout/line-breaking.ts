/**
 * Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
 * which bookmarks start on it.
 *
 * Lines break at spaces, and at en, em, four-per-em and ideographic spaces, after hyphens, between Chinese, Japanese and
 * Korean characters, and between the words of Thai and the other scripts without spaces, as {@link findLineBreaks} finds.
 * Tabs move to the paragraph's tab stops, or to the document's default ones. Each line is as tall as its text's tallest
 * ascent and deepest descent, with its pictures standing on the baseline, and the paragraph's line spacing.
 *
 * @module
 */
import { type LineBreakRules, extendsCharacter, findLineBreaks, joinsNext } from "./line-break-rules";
import {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    type LineSpacing,
    type ParagraphFormat,
    type TextBorder,
    type TextFont,
    isKerned,
    measureDescent,
    measureLineHeight,
    measureTextWidth,
    unknownCharacter,
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
};

export const DEFAULT_MEASURER: TextMeasurer = {
    measureWidth: (text, font) => measureTextWidth(text, font),
    measureLineHeight,
    measureDescent,
    unknownCharacter,
};

/**
 * A piece of a paragraph's content, in the order it is written.
 */
export type InlineItem =
    /**
     * Text, with the East Asian language of its run, which decides which characters can't start or end a line, and whether
     * its run is East Asian, whose words break anywhere with word wrap off
     */
    | { readonly type: "text"; readonly text: string; readonly font: TextFont; readonly language?: string; readonly eastAsian?: boolean }
    | { readonly type: "tab"; readonly font: TextFont }
    /** A line break, or a page or column break, which ends the line and starts the rest on a new page or column */
    | { readonly type: "break"; readonly kind: "line" | "page" | "column"; readonly font: TextFont }
    /**
     * A picture or other drawing in the line, in points, with the font of its run, whose line the picture's is at least as
     * tall as
     */
    | { readonly type: "box"; readonly width: number; readonly height: number; readonly font?: TextFont }
    /** Where a bookmark starts */
    | { readonly type: "marker"; readonly name: string };

/**
 * A tab stop, in points from the left edge of the text.
 */
export type TabStop = {
    readonly position: number;
    /** How the text after the tab lines up with the stop. Decimal stops line up the end of the text, as right stops do */
    readonly alignment: "left" | "right" | "center" | "decimal";
};

/**
 * How a paragraph's lines are laid out.
 */
export type LineLayoutOptions = {
    /**
     * The width of the text, in points: the page's, a column's, or a table cell's, less their margins. Or the width of
     * each line, from its index in the paragraph, for lines of different widths, such as those of a paragraph that goes on
     * into a column of another width
     */
    readonly width: number | ((line: number) => number);
    readonly format?: ParagraphFormat;
    readonly tabStops?: readonly TabStop[];
    /** The distance between the document's default tab stops, in points. Default is half an inch */
    readonly defaultTabStop?: number;
    /** The font of the paragraph's mark, which sets the height of a line with no text on it, such as an empty paragraph's */
    readonly markFont?: TextFont;
    readonly measurer?: TextMeasurer;
    /** The document's rules for where lines break. The paragraph's `kinsoku` takes the place of the rules' */
    readonly breakRules?: LineBreakRules;
};

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
     * The text on the line, with the spaces where it wraps and a tab as `\t`. A picture or a break adds nothing to it, so
     * the texts of a paragraph's lines, one after the other, are its text
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

type Piece = { readonly text: string; readonly font: TextFont };

/** A part of a line that is placed as a whole: a word, the spaces after it, a tab, a picture or a bookmark */
type Token =
    | { readonly type: "word"; readonly pieces: readonly Piece[] }
    | { readonly type: "space"; readonly pieces: readonly Piece[] }
    | { readonly type: "tab"; readonly font: TextFont }
    | { readonly type: "box"; readonly width: number; readonly height: number; readonly font?: TextFont }
    | { readonly type: "marker"; readonly name: string };

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
// Word squeezes one more word onto a justified line when its spaces would otherwise stretch by a share of their width
// more than twice as large as the share they're squeezed by: 2.06 times as large, and not 2.02 (`word-justify.docx` J01
// to J09)
const STRETCH_TO_SQUEEZE = 2.04;
// and never squeezes them by more than a quarter of their width: by 24.9%, and not 25.4% (J03 and J05 to J07), even on a
// line whose other words have no spaces between them to stretch (`word-justify2.docx` K10, K11)
const MOST_SQUEEZE = 0.25;
// A distributed line can spread its letters as well as its spaces, so Word squeezes a word onto it less often. It weighs
// how far the line would stretch without the word as if each space took this many times what each letter does: between
// 6.94 and 7.37 times puts every one of Word's lines of K01 to K07 and K12 where Word put them
const SPACE_TO_LETTER = 7.2;

type TextItem = Extract<InlineItem, { readonly type: "text" }>;

// The spaces lines break after, which go past the end of a line as U+0020 does: the en, em and four-per-em spaces, which
// Word has as spaces of its own, and the ideographic space. Word joins the words around the other spaces, such as the thin
// space (word-character-widths B and H, and word-watertight-text TX19g)
const SPACES: ReadonlySet<string> = new Set([" ", "\u2002", "\u2003", "\u2005", "\u3000"]);

/**
 * Turns text next to each other into words and the spaces between them. Pieces of words next to each other in different
 * fonts are one word, unless the line can break between them.
 */
const tokenizeText = (items: readonly TextItem[], rules: LineBreakRules): readonly Token[] => {
    const breaks = findLineBreaks(items, rules);
    // eslint-disable-next-line functional/prefer-readonly-type
    const tokens: { readonly type: "word" | "space"; readonly pieces: Piece[] }[] = [];
    let index = 0;
    for (const { text, font } of items) {
        for (const character of text) {
            const type = SPACES.has(character) ? "space" : "word";
            const last = tokens[tokens.length - 1];
            if (last?.type !== type || (type === "word" && breaks.has(index))) {
                // eslint-disable-next-line functional/immutable-data
                tokens.push({ type, pieces: [{ text: character, font }] });
            } else {
                const piece = last.pieces[last.pieces.length - 1];
                // eslint-disable-next-line functional/immutable-data
                last.pieces[last.pieces.length - 1 + (piece.font === font ? 0 : 1)] = {
                    text: piece.font === font ? piece.text + character : character,
                    font,
                };
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
    let text: TextItem[] = [];
    for (const item of items) {
        if (item.type === "text") {
            // eslint-disable-next-line functional/immutable-data
            text.push(item);
        } else {
            // eslint-disable-next-line functional/immutable-data
            tokens.push(...tokenizeText(text, rules), item as Exclude<InlineItem, { readonly type: "text" | "break" }>);
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

/** How many characters pieces have */
const lengthOf = (pieces: readonly Piece[]): number => pieces.reduce((total, { text }) => total + [...text].length, 0);

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

/**
 * How wide pieces of text are, with the room of the borders between them. Pieces next to each other in the same font, and
 * kerned, are measured together, so the pairs of characters across them are kerned, as Word kerns them across runs
 * (word-fonts.docx F4). Others are measured apart, as a measurer may measure a piece, such as a page number, differently on
 * its own.
 */
const widthOf = (pieces: readonly Piece[], measurer: TextMeasurer): number => {
    if (pieces.length === 0) {
        return 0;
    }
    let total = 0;
    let [{ text, font }] = pieces;
    for (const piece of pieces.slice(1)) {
        total += roomBetween(font.border, piece.font.border);
        if (isKerned(font) && sameFont(font, piece.font)) {
            text += piece.text;
            continue;
        }
        total += measurer.measureWidth(text, font);
        ({ text, font } = piece);
    }
    return total + measurer.measureWidth(text, font);
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
};

const NOTHING: Heights = { ascent: 0, descent: 0, tallest: 0, picture: 0 };

/** The heights of a line, with text in this font on it too */
const withFont = (heights: Heights, font: TextFont, measurer: TextMeasurer): Heights => {
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

// Line spacing that adds up to 0.19 of a line with emphasis marks leaves the marks' room over it, and from 0.34 of it
// holds the marks: at 1.08 and 1.15 lines and at least 16 points over Calibri 11 (0.08, 0.15 and 0.19 of its 268.55 twips),
// the marks add their 67.14 twips, and at 1.5 and 2 lines and at least 18 points (0.34) they don't
// (scripts/layout-probes/word-run-formatting.ts RF6k, word-run-formatting2.ts RF9). Where between Word turns from one to
// the other isn't known
const MARKS_OVER_SPACING = 0.1916;
const MARKS_IN_SPACING = 0.3405;

/**
 * How tall a line with emphasis marks is: a quarter of the line more, over its text or under it, whatever the font and
 * the size of the text they are on: 67.14 twips in a line of Calibri 11 and 122 of Calibri 20, 57.5 of Times New Roman 10
 * and 63.25 of Arial 11, and 67.14 still for marks on a word of 7 points, or on a space, in a line of Calibri 11
 * (scripts/layout-probes/word-run-formatting.ts RF6, word-watertight-text.ts TX15). A line taller than its fonts' own
 * lines takes a quarter of itself: 616.95 for marks on Courier New 20 in a line of Times New Roman 20, and 485.69 for a
 * line with a word raised 6 points (word-run-formatting2.ts RF10). Line spacing that adds a little room adds it below the
 * marks' room, and spacing that adds enough holds the marks
 */
const markedHeightOf = (
    { tallest, picture, marks }: Heights,
    natural: number,
    spacing: LineSpacing | undefined,
): Pick<LaidOutLine, "height" | "spacingBelow" | "unsupported"> => {
    const room = natural / 4;
    if (marks!.above && marks!.below) {
        return { height: natural + room, unsupported: "emphasis marks over and under text on one line" };
    }
    if (picture > 0) {
        return { height: natural + room, unsupported: "emphasis marks on a line with a picture" };
    }
    if (spacing === undefined || spacing.rule === "exact") {
        return { height: spacing === undefined ? natural + room : spacing.height };
    }
    const extra = spacing.rule === "multiple" ? (spacing.multiple - 1) * tallest : Math.max(0, spacing.height - natural);
    const share = extra / natural;
    // Word's probes had multiple spacing of 1.08 to 2 lines over a line as tall as its fonts' own, and at-least spacing over
    // one less or a little more than that
    const known =
        extra >= 0 &&
        (extra === 0 || Math.abs(natural - tallest) <= TOLERANCE) &&
        (share <= MARKS_OVER_SPACING || share >= MARKS_IN_SPACING);
    if (!known) {
        return { height: natural + room, unsupported: "emphasis marks on a line whose line spacing Word hasn't shown with them" };
    }
    // Multiple spacing's room is below the text, and at-least spacing's above it, where the marks over it go
    const below = spacing.rule === "multiple" ? (share <= MARKS_OVER_SPACING ? extra : extra - room) : 0;
    return {
        height: natural + extra + (share <= MARKS_OVER_SPACING ? room : 0),
        ...(below > 0 ? { spacingBelow: below } : {}),
    };
};

/**
 * How tall a line is, with the paragraph's line spacing, and how much of that multiple spacing adds below its text. Word
 * doesn't round it: Calibri 11 is 268.55 twips, and 289.82 at 259 twips' multiple spacing, where LibreOffice rounds them
 * to whole twips, 269 and 290.
 */
const heightOf = (heights: Heights, spacing: LineSpacing | undefined): Pick<LaidOutLine, "height" | "spacingBelow" | "unsupported"> => {
    const { ascent, descent, tallest, picture, marks } = heights;
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
     * How wide the en, em, four-per-em and ideographic spaces among its spaces are, which Word hasn't been seen squeezing,
     * and whether a word past its end could be squeezed in, so Word's breaking of it isn't known
     */
    readonly otherSpaces: number;
    readonly unknown?: boolean;
    /** The border of the text placed last, whose box is open there, and whether it has text in a border */
    readonly border?: TextBorder;
    readonly boxed?: boolean;
    readonly markers: readonly string[];
    /** The bookmarks that start with the next word, picture or tab, which may wrap onto the next line */
    readonly pending: readonly string[];
    /** Whether it has a word, a picture or a tab on it yet */
    readonly started: boolean;
    /** Whether it is the first line of the paragraph, which starts at its first line indent */
    readonly first: boolean;
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
 * The width of the text after a tab, up to the next tab or the end of the part: what lines up with a right or centered
 * stop. Spaces at its end aren't counted.
 */
const widthAfterTab = (tokens: readonly Token[], measurer: TextMeasurer): number => {
    const text = textAfterTab(tokens);
    const lastWord = text.findLastIndex((token) => token.type !== "space" && token.type !== "marker");
    return text.slice(0, lastWord + 1).reduce(
        ({ total, border }, token) => {
            if (token.type === "box") {
                return { total: total + roomBetween(border, undefined) + token.width, border: undefined };
            }
            return token.type === "word" || token.type === "space"
                ? {
                      total: total + roomBetween(border, firstBorder(token.pieces)) + widthOf(token.pieces, measurer),
                      border: lastBorder(token.pieces),
                  }
                : { total, border };
        },
        { total: 0, border: undefined as TextBorder | undefined },
    ).total;
};

/** The tokens after a tab, up to the next tab or the end of the part */
const textAfterTab = (tokens: readonly Token[]): readonly Token[] => {
    const next = tokens.findIndex((token) => token.type === "tab");
    return next === -1 ? tokens : tokens.slice(0, next);
};

/** Whether the text after a tab has a border */
const hasBorder = (tokens: readonly Token[]): boolean =>
    textAfterTab(tokens).some((token) => (token.type === "word" || token.type === "space") && token.pieces.some(({ font }) => font.border));

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
    }: Omit<LineLayoutOptions, "width" | "markFont">,
): ContentWidths => {
    const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = format;
    const { stops, firstLineStops } = stopsOf(tabStops, format);
    return segmentsOf(items, rulesOf(format, breakRules)).reduce<ContentWidths>(
        (widths, { tokens }, segmentIndex) => {
            const first = segmentIndex === 0;
            let position = indentLeft + (first ? firstLineIndent : 0);
            let end = position;
            let { min } = widths;
            // The border of the text before, whose box is open, and of the last word, picture or tab
            let border: TextBorder | undefined;
            let endBorder: TextBorder | undefined;
            for (const [index, token] of tokens.entries()) {
                if (token.type === "marker") {
                    continue;
                }
                if (token.type === "space") {
                    position += roomBetween(border, firstBorder(token.pieces)) + widthOf(token.pieces, measurer);
                    border = lastBorder(token.pieces);
                    continue;
                }
                const lead = token.type === "word" ? roomBetween(border, firstBorder(token.pieces)) : roomBetween(border, undefined);
                border = token.type === "word" ? lastBorder(token.pieces) : undefined;
                endBorder = border;
                if (token.type === "tab") {
                    const stop = nextStop(position + lead, first ? firstLineStops : stops, defaultTabStop, Infinity)!;
                    const after = widthAfterTab(tokens.slice(index + 1), measurer);
                    const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
                    position = Math.max(position + lead, stop.position - shift);
                    end = position;
                    continue;
                }
                const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
                // The first word of a line starts where it is, and any other can wrap to the start of a line, where a word in
                // a border starts its box again. A box ends on its line with the border's room after it
                const close = border?.room ?? 0;
                const start =
                    end === indentLeft + (first ? firstLineIndent : 0)
                        ? position + lead
                        : indentLeft + (token.type === "word" ? (firstBorder(token.pieces)?.room ?? 0) : 0);
                min = Math.max(min, start + tokenWidth + close + indentRight);
                position += lead + tokenWidth;
                end = position;
            }
            return { min, max: Math.max(widths.max, min, end + (endBorder?.room ?? 0) + indentRight) };
        },
        { min: 0, max: 0 },
    );
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
    }: LineLayoutOptions,
): readonly LaidOutLine[] => {
    const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing, alignment } = format;
    const markHeight = measurer.measureLineHeight(markFont);
    /**
     * Whether a line of only pictures is in a paragraph whose mark has a taller line than the pictures' runs, so that how
     * tall the line is depends on whether the mark counts. Word hasn't shown that: in its probes the pictures' runs were as
     * large as the mark or larger (scripts/layout-probes/word-mixed-heights.ts MH3d, MH7), and beside text the mark doesn't
     * count
     */
    const markMatters = ({ ascent, tallest, picture }: Heights): boolean =>
        picture > 0 &&
        ascent === 0 &&
        markHeight > tallest + TOLERANCE &&
        (picture < markHeight - TOLERANCE || (lineSpacing?.rule === "multiple" && lineSpacing.multiple !== 1));
    /** The heights of a line with the text of the token on it too */
    const withToken = (heights: Heights, token: Exclude<Token, { readonly type: "marker" }>): Heights => {
        if (token.type === "box") {
            const tallest = token.font ? Math.max(heights.tallest, measurer.measureLineHeight(token.font)) : heights.tallest;
            return { ...heights, picture: Math.max(heights.picture, token.height), tallest };
        }
        return token.type === "tab"
            ? withFont(heights, token.font, measurer)
            : token.pieces.reduce((all, { font }) => withFont(all, font, measurer), heights);
    };
    // Word squeezes the spaces of a justified line to fit one more word on it, so it has more words to a line than a
    // left-aligned one (`word-watertight-text.docx` TX20)
    const squeezes =
        alignment === "justified" || alignment === "distributed" || alignment === "thaiDistributed" || alignment === "lowKashida";
    const { stops, firstLineStops } = stopsOf(tabStops, format);
    const parts = segmentsOf(items, rulesOf(format, breakRules));
    // A page break at the end of a paragraph has the paragraph's mark on its line, as Word lays it out from Word 2013,
    // rather than on a line of its own on the next page. A column break's mark is on a line at the top of the next column,
    // in Word and LibreOffice
    const [previous, last] = parts.slice(-2);
    const endsWithBreak = parts.length > 1 && previous.end!.kind === "page" && last.tokens.every((token) => token.type === "marker");
    const segments = endsWithBreak ? [...parts.slice(0, -2), { tokens: [...previous.tokens, ...last.tokens], end: previous.end }] : parts;

    // eslint-disable-next-line functional/prefer-readonly-type
    const lines: LaidOutLine[] = [];
    /** Where a line ends, from its index: where the line being filled ends, unless another is given */
    const limitOf = (line = lines.length): number => (typeof width === "number" ? width : width(line)) - indentRight;
    /**
     * Whether Word squeezes a word or picture this wide onto a justified or distributed line it goes past the end of,
     * rather than move it to the next line. It squeezes the line's spaces in proportion to their widths, and does when that
     * takes less of their width than a quarter, and than half of what the spaces between the words already on it would
     * stretch by with it on the next line, or, on a distributed line, the spaces and letters. That is so on a paragraph's
     * last line, and one that ends with a line break, too (J10 to J12). Latin text justified for Thai or with a low kashida
     * is squeezed as justified text is (K08, K09)
     */
    const squeezesIn = (state: LineState, tokenWidth: number): boolean => {
        if (!squeezes || state.spaces <= 0) {
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
    /**
     * Whether a word or picture past the end of a justified line could be squeezed in, were the spaces Word hasn't been
     * seen squeezing among its spaces squeezed as the others are
     */
    const unsure = (state: LineState, tokenWidth: number): boolean =>
        squeezes && state.otherSpaces > 0 && state.position + tokenWidth - limitOf() <= MOST_SQUEEZE * state.spaces;
    let first = true;
    for (const [segmentIndex, { tokens, end }] of segments.entries()) {
        const isLast = segmentIndex === segments.length - 1;
        const start = indentLeft + (first ? firstLineIndent : 0);
        let line: LineState = {
            position: start,
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
        };
        const finish = (state: LineState, breakAfter?: LaidOutLine["breakAfter"]): void => {
            // Spaces add nothing to the height of a line with no text on it, which is as tall as its mark, as Word and
            // LibreOffice lay it out. A border on the mark takes no room (scripts/layout-probes/word-run-formatting.ts RF8d)
            const heights = state.started ? state.heights : withFont(NOTHING, { ...markFont, border: undefined }, measurer);
            const { unsupported: unknownHeight, ...height } = heightOf(heights, lineSpacing);
            const unsupported = state.unknown
                ? "a justified line that only fits squeezed at an en, em or ideographic space"
                : (state.unsupported ??
                  (markMatters(heights) ? "a picture alone in a line of a paragraph whose mark is larger" : unknownHeight));
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
            return {
                position: indentLeft,
                start: indentLeft,
                end: indentLeft,
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

        for (const [index, token] of tokens.entries()) {
            if (token.type === "marker") {
                line = { ...line, pending: [...line.pending, token.name] };
                continue;
            }
            if (token.type === "space") {
                const spaces = widthOf(token.pieces, measurer);
                line = {
                    ...line,
                    position: line.position + roomBetween(line.border, firstBorder(token.pieces)) + spaces,
                    text: line.text + textOf(token.pieces),
                    spaces: line.started ? line.spaces + spaces : 0,
                    spaceCount: line.started ? line.spaceCount + lengthOf(token.pieces) : 0,
                    otherSpaces: line.started ? line.otherSpaces + widthOf(othersOf(token.pieces), measurer) : 0,
                    heights: withToken(line.heights, token),
                    border: lastBorder(token.pieces),
                };
                continue;
            }
            // A tab or picture after text with a border closes its box
            line =
                token.type === "word"
                    ? line
                    : { ...line, position: line.position + roomBetween(line.border, undefined), border: undefined };
            if (token.type === "tab") {
                const stop =
                    nextStop(line.position, line.first ? firstLineStops : stops, defaultTabStop, limitOf()) ??
                    (line.started ? nextStop(indentLeft, stops, defaultTabStop, limitOf(lines.length + 1)) : undefined);
                if (stop === undefined) {
                    // No stop before the end of the line: the text after the tab starts where it is
                    line = { ...line, end: line.position, text: `${line.text}\t`, heights: withToken(line.heights, token), started: true };
                    continue;
                }
                if (stop.position <= line.position + TOLERANCE) {
                    // The tab moves to a stop on the next line
                    line = wrap(line);
                }
                line = place(line);
                const after = widthAfterTab(tokens.slice(index + 1), measurer);
                const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
                // The text after it starts at the stop however much the spaces before it are squeezed
                const position = Math.max(line.position, stop.position - shift);
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
                    ...(shift > 0 && hasBorder(tokens.slice(index + 1))
                        ? { unsupported: "text with a border lined up with a tab stop" }
                        : {}),
                };
                continue;
            }
            const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
            // A word in a border starts its box, unless it goes on from the text before it, and on the next line it starts
            // it again: a bordered run that goes on to the next line starts it 90 twips in, for a border of half a point 4
            // points away (scripts/layout-probes/word-run-formatting.ts RF7n). A line has room for its box to end after its
            // last word, whether the box goes on to the next line or not: such a word 70 twips short of the end of the line
            // goes on to the next, and one 110 short stays (word-run-formatting2.ts RF11)
            const leadOf = (state: LineState): number => (token.type === "word" ? roomBetween(state.border, firstBorder(token.pieces)) : 0);
            const boxEnd = token.type === "word" ? (lastBorder(token.pieces)?.room ?? 0) : 0;
            const needs = leadOf(line) + tokenWidth + boxEnd;
            const overflows = line.started && line.position + needs > limitOf() + TOLERANCE;
            if (overflows && unsure(line, needs)) {
                line = { ...line, unknown: true };
            }
            // Whether Word squeezes the spaces of a justified line with a box on it to fit one more word, and by how much,
            // isn't known
            const squeezable = overflows && !line.unknown && squeezesIn(line, needs);
            const boxed = line.boxed === true || (token.type === "word" && token.pieces.some(({ font }) => font.border !== undefined));
            if (squeezable && boxed) {
                line = { ...line, unsupported: "a justified line with text in a border that only fits squeezed" };
            }
            const squeezed = squeezable && !boxed;
            if (overflows && !squeezed) {
                line = wrap(line);
            }
            line = { ...place(line), position: line.position + leadOf(line) };
            if (token.type === "word" && !squeezed && line.position + tokenWidth > limitOf() + TOLERANCE && limitOf() - indentLeft > 0) {
                // A word wider than a line is broken across as many lines as it needs, after the last character that fits
                // on each, and never between a character and the marks on it or what a zero-width joiner joins to it
                let placed = false;
                if (token.pieces.some(({ font }) => font.border !== undefined)) {
                    line = { ...line, unsupported: "a word longer than its line with a border" };
                }
                for (const character of charactersOf(token.pieces)) {
                    const characterWidth = widthOf(character, measurer);
                    // Each line is as long as it is, for lines of different widths, and one with no room takes the rest
                    if (placed && line.position + characterWidth > limitOf() + TOLERANCE && limitOf(lines.length + 1) - indentLeft > 0) {
                        line = wrap({ ...line, heights: withToken(line.heights, token), started: true });
                    }
                    line = {
                        ...line,
                        position: line.position + characterWidth,
                        end: line.position + characterWidth,
                        text: line.text + textOf(character),
                        letters: line.letters + lengthOf(character),
                    };
                    placed = true;
                }
            } else {
                const text = token.type === "word" ? textOf(token.pieces) : "";
                line = {
                    ...line,
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
                boxed: line.boxed === true || (token.type === "word" && token.pieces.some(({ font }) => font.border !== undefined)),
            };
        }

        if (!end) {
            // The mark adds nothing to the height of a line with text, as Word and LibreOffice lay it out
            finish(line);
        } else {
            // A page break that ends the paragraph has the mark on its line, which with no text on it is as tall as the mark,
            // however big the break and the spaces before it are: 28-point spaces before a 28-point break, in an 11-point
            // paragraph, are an 11-point line in Word and LibreOffice (word-probes.docx U8a7)
            const breakFont = isLast && !line.started ? markFont : end.font;
            finish(
                { ...line, heights: withFont(line.started ? line.heights : NOTHING, breakFont, measurer), started: true },
                end.kind === "line" ? undefined : end.kind,
            );
        }
        first = false;
    }
    return lines;
};
