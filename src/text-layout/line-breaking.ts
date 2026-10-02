/**
 * Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
 * which bookmarks start on it.
 *
 * Lines break at spaces, and at en, em, four-per-em and ideographic spaces, after hyphens, between Chinese, Japanese and
 * Korean characters, and between the words of Thai and the other scripts without spaces, as {@link findLineBreaks} finds.
 * Tabs move to the paragraph's tab stops, or to the document's default ones. Each line is as tall as the tallest text or
 * picture on it, with the paragraph's line spacing.
 *
 * @module
 */
import { type LineBreakRules, extendsCharacter, findLineBreaks, joinsNext } from "./line-break-rules";
import {
    DEFAULT_FONT,
    DEFAULT_FONT_SIZE,
    type LineSpacing,
    type ParagraphFormat,
    type TextFont,
    isKerned,
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
    /**
     * The first character of text whose width this measurer doesn't know as Word lays it out, so a layout stops there
     * rather than guessing. A measurer that measures with the fonts themselves leaves it out
     */
    readonly unknownCharacter?: (text: string, font: TextFont) => string | undefined;
};

export const DEFAULT_MEASURER: TextMeasurer = {
    measureWidth: (text, font) => measureTextWidth(text, font),
    measureLineHeight,
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
    /** A picture or other drawing in the line, in points */
    | { readonly type: "box"; readonly width: number; readonly height: number }
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
    /** Why Word's breaking of the line isn't known, when it isn't */
    readonly unsupported?: string;
};

type Piece = { readonly text: string; readonly font: TextFont };

/** A part of a line that is placed as a whole: a word, the spaces after it, a tab, a picture or a bookmark */
type Token =
    | { readonly type: "word"; readonly pieces: readonly Piece[] }
    | { readonly type: "space"; readonly pieces: readonly Piece[] }
    | { readonly type: "tab"; readonly font: TextFont }
    | { readonly type: "box"; readonly width: number; readonly height: number }
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

/** A font's formatting with Word's defaults where it gives none, so formatting written as the default is the same as none */
const withDefaults = (font: TextFont): Readonly<Record<string, unknown>> => ({
    font: DEFAULT_FONT,
    size: DEFAULT_FONT_SIZE,
    bold: false,
    italic: false,
    characterSpacing: 0,
    scale: 100,
    ...Object.fromEntries(Object.entries(font).filter(([, value]) => value !== undefined)),
});

/** Whether two pieces of text are in the same font, with the same formatting */
const sameFont = (one: TextFont, other: TextFont): boolean => {
    const [first, second] = [withDefaults(one), withDefaults(other)];
    return Object.keys(first).length === Object.keys(second).length && Object.entries(first).every(([key, value]) => second[key] === value);
};

/**
 * How wide pieces of text are. Pieces next to each other in the same font, and kerned, are measured together, so the pairs
 * of characters across them are kerned, as Word kerns them across runs (word-fonts.docx F4). Others are measured
 * apart, as a measurer may measure a piece, such as a page number, differently on its own.
 */
const widthOf = (pieces: readonly Piece[], measurer: TextMeasurer): number => {
    if (pieces.length === 0) {
        return 0;
    }
    let total = 0;
    let [{ text, font }] = pieces;
    for (const piece of pieces.slice(1)) {
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

/**
 * The height of single-spaced lines, with this line spacing. Word doesn't round it: Calibri 11 is 268.55 twips, and
 * 289.82 at 259 twips' multiple spacing, where LibreOffice rounds them to whole twips, 269 and 290.
 */
const spaced = (natural: number, spacing: LineSpacing | undefined): number => {
    if (!spacing) {
        return natural;
    }
    if (spacing.rule === "multiple") {
        return natural * spacing.multiple;
    }
    return spacing.rule === "exact" ? spacing.height : Math.max(natural, spacing.height);
};

/** A line being laid out */
type LineState = {
    /** Where the next token starts, in points from the left edge of the text */
    readonly position: number;
    /** Where the line starts, and where the last of its words, pictures or tabs ends */
    readonly start: number;
    readonly end: number;
    readonly text: string;
    /** The tallest text or picture on it, in points */
    readonly natural: number;
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
    readonly markers: readonly string[];
    /** The bookmarks that start with the next word, picture or tab, which may wrap onto the next line */
    readonly pending: readonly string[];
    /** Whether it has a word, a picture or a tab on it yet */
    readonly started: boolean;
    /** Whether it is the first line of the paragraph, which starts at its first line indent */
    readonly first: boolean;
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
    const next = tokens.findIndex((token) => token.type === "tab");
    const text = next === -1 ? tokens : tokens.slice(0, next);
    const lastWord = text.findLastIndex((token) => token.type !== "space" && token.type !== "marker");
    return text.slice(0, lastWord + 1).reduce((total, token) => {
        if (token.type === "box") {
            return total + token.width;
        }
        return token.type === "word" || token.type === "space" ? total + widthOf(token.pieces, measurer) : total;
    }, 0);
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
            for (const [index, token] of tokens.entries()) {
                if (token.type === "marker") {
                    continue;
                }
                if (token.type === "space") {
                    position += widthOf(token.pieces, measurer);
                    continue;
                }
                if (token.type === "tab") {
                    const stop = nextStop(position, first ? firstLineStops : stops, defaultTabStop, Infinity)!;
                    const after = widthAfterTab(tokens.slice(index + 1), measurer);
                    const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
                    position = Math.max(position, stop.position - shift);
                    end = position;
                    continue;
                }
                const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
                // The first word of a line starts where it is, and any other can wrap to the start of a line
                const start = end === indentLeft + (first ? firstLineIndent : 0) ? position : indentLeft;
                min = Math.max(min, start + tokenWidth + indentRight);
                position += tokenWidth;
                end = position;
            }
            return { min, max: Math.max(widths.max, min, end + indentRight) };
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
            natural: 0,
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
        const finish = (state: LineState, breakAfter?: LaidOutLine["breakAfter"], extra = 0): void => {
            // Spaces add nothing to the height of a line with no text on it, which is as tall as its mark, as Word and
            // LibreOffice lay it out
            const natural = Math.max(state.started ? state.natural : markHeight, extra);
            // eslint-disable-next-line functional/immutable-data
            lines.push({
                height: spaced(natural, lineSpacing),
                markers: [...state.markers, ...state.pending],
                ...(breakAfter ? { breakAfter } : {}),
                text: state.text,
                textWidth: Math.max(0, state.end - state.start),
                ...(state.unknown ? { unsupported: "a justified line that only fits squeezed at an en, em or ideographic space" } : {}),
            });
        };
        const wrap = (state: LineState): LineState => {
            finish({ ...state, pending: [] });
            return {
                position: indentLeft,
                start: indentLeft,
                end: indentLeft,
                text: "",
                natural: 0,
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
                const height = Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
                const spaces = widthOf(token.pieces, measurer);
                line = {
                    ...line,
                    position: line.position + spaces,
                    text: line.text + textOf(token.pieces),
                    spaces: line.started ? line.spaces + spaces : 0,
                    spaceCount: line.started ? line.spaceCount + lengthOf(token.pieces) : 0,
                    otherSpaces: line.started ? line.otherSpaces + widthOf(othersOf(token.pieces), measurer) : 0,
                    natural: Math.max(line.natural, height),
                };
                continue;
            }
            if (token.type === "tab") {
                const height = measurer.measureLineHeight(token.font);
                const stop =
                    nextStop(line.position, line.first ? firstLineStops : stops, defaultTabStop, limitOf()) ??
                    (line.started ? nextStop(indentLeft, stops, defaultTabStop, limitOf(lines.length + 1)) : undefined);
                if (stop === undefined) {
                    // No stop before the end of the line: the text after the tab starts where it is
                    line = { ...line, end: line.position, text: `${line.text}\t`, natural: Math.max(line.natural, height), started: true };
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
                    natural: Math.max(line.natural, height),
                    spaces: 0,
                    spaceCount: 0,
                    between: 0,
                    letters: 0,
                    otherSpaces: 0,
                    started: true,
                };
                continue;
            }
            const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
            const tokenHeight =
                token.type === "box" ? token.height : Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
            const overflows = line.started && line.position + tokenWidth > limitOf() + TOLERANCE;
            if (overflows && unsure(line, tokenWidth)) {
                line = { ...line, unknown: true };
            }
            const squeezed = overflows && !line.unknown && squeezesIn(line, tokenWidth);
            if (overflows && !squeezed) {
                line = wrap(line);
            }
            line = place(line);
            if (token.type === "word" && !squeezed && line.position + tokenWidth > limitOf() + TOLERANCE && limitOf() - indentLeft > 0) {
                // A word wider than a line is broken across as many lines as it needs, after the last character that fits
                // on each, and never between a character and the marks on it or what a zero-width joiner joins to it
                let placed = false;
                for (const character of charactersOf(token.pieces)) {
                    const characterWidth = widthOf(character, measurer);
                    // Each line is as long as it is, for lines of different widths, and one with no room takes the rest
                    if (placed && line.position + characterWidth > limitOf() + TOLERANCE && limitOf(lines.length + 1) - indentLeft > 0) {
                        line = wrap({ ...line, natural: Math.max(line.natural, tokenHeight), started: true });
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
            line = { ...line, end: line.position, between: line.spaceCount, natural: Math.max(line.natural, tokenHeight), started: true };
        }

        if (!end) {
            // The mark adds nothing to the height of a line with text, as Word and LibreOffice lay it out
            finish(line);
        } else {
            // A page break that ends the paragraph has the mark on its line, which with no text on it is as tall as the mark,
            // however big the break and the spaces before it are: 28-point spaces before a 28-point break, in an 11-point
            // paragraph, are an 11-point line in Word and LibreOffice (word-probes.docx U8a7)
            const breakHeight = isLast && !line.started ? markHeight : measurer.measureLineHeight(end.font);
            finish(
                { ...line, natural: Math.max(line.started ? line.natural : 0, breakHeight), started: true },
                end.kind === "line" ? undefined : end.kind,
            );
        }
        first = false;
    }
    return lines;
};
