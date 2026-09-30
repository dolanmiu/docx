/**
 * Breaks a paragraph into lines as Word breaks it, for laying out pages: where each line wraps, how tall it is, and
 * which bookmarks start on it.
 *
 * Lines break at spaces, after hyphens, and between Chinese, Japanese and Korean characters. Tabs move to the
 * paragraph's tab stops, or to the document's default ones. Each line is as tall as the tallest text or picture on
 * it, with the paragraph's line spacing.
 *
 * @module
 */
import { TWIPS_PER_POINT } from "./text-styles";
import { type LineSpacing, type ParagraphFormat, type TextFont, measureLineHeight, measureTextWidth } from "./text-width";

/**
 * Measures text. The default measures it with the widths of the fonts in {@link FONT_WIDTHS}.
 */
export type TextMeasurer = {
    /** How wide text is, in points. The text has no tabs or line breaks */
    readonly measureWidth: (text: string, font: TextFont) => number;
    /** How tall a line of single-spaced text is, in points */
    readonly measureLineHeight: (font: TextFont) => number;
};

export const DEFAULT_MEASURER: TextMeasurer = {
    measureWidth: (text, font) => measureTextWidth(text, font),
    measureLineHeight,
};

/**
 * A piece of a paragraph's content, in the order it is written.
 */
export type InlineItem =
    | { readonly type: "text"; readonly text: string; readonly font: TextFont }
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
    /** The width of the text, in points: the page's, or a table cell's, less their margins */
    readonly width: number;
    readonly format?: ParagraphFormat;
    readonly tabStops?: readonly TabStop[];
    /** The distance between the document's default tab stops, in points. Default is half an inch */
    readonly defaultTabStop?: number;
    /** The font of the paragraph's mark, which sets the height of a line with no text on it, such as an empty paragraph's */
    readonly markFont?: TextFont;
    readonly measurer?: TextMeasurer;
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

// Letters of Chinese, Japanese and Korean, between which a line can break
const CJK_LETTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
// Characters that don't start a line, such as closing punctuation and small kana, and those that don't end one
// cspell:disable-next-line
const NO_LINE_START = new Set([..."、。，．：；？！）」』】〕〉》ー々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ,.:;?!)]}"]);
// cspell:disable-next-line
const NO_LINE_END = new Set([..."（「『【〔〈《([{"]);

/**
 * Whether a line can break between two characters with no space between them: after a hyphen that isn't before a
 * digit, and before or after a Chinese, Japanese or Korean letter.
 */
const canBreakBetween = (before: string, after: string): boolean =>
    !NO_LINE_START.has(after) &&
    !NO_LINE_END.has(before) &&
    ((before === "-" && !/[\d-]/.test(after)) || CJK_LETTER.test(before) || CJK_LETTER.test(after));

/**
 * Splits text into words and the spaces between them, and words where a line can break inside them.
 */
type TextPart = { readonly text: string; readonly isSpace: boolean };

const splitText = (text: string): readonly TextPart[] =>
    text
        .split(/( +)/)
        .filter((part) => part.length > 0)
        .flatMap((part): readonly TextPart[] => {
            if (part.startsWith(" ")) {
                return [{ text: part, isSpace: true }];
            }
            const characters = [...part];
            return characters
                .reduce<readonly string[]>(
                    (words, character, index) =>
                        index > 0 && canBreakBetween(characters[index - 1], character)
                            ? [...words, character]
                            : [...words.slice(0, -1), `${words[words.length - 1] ?? ""}${character}`],
                    [],
                )
                .map((word) => ({ text: word, isSpace: false }));
        });

const lastCharacter = (text: string): string => [...text].pop()!;

/**
 * Turns a part of a paragraph into tokens. Pieces of words next to each other in different fonts are one word, unless
 * the line can break between them.
 */
const tokenize = (items: readonly InlineItem[]): readonly Token[] =>
    items.reduce<readonly Token[]>((tokens, item) => {
        if (item.type === "text") {
            return splitText(item.text).reduce<readonly Token[]>((all, { text, isSpace }) => {
                const last = all[all.length - 1];
                const type = isSpace ? "space" : "word";
                const joins =
                    last?.type === type &&
                    (isSpace || !canBreakBetween(lastCharacter(last.pieces[last.pieces.length - 1].text), [...text][0]));
                return joins
                    ? [...all.slice(0, -1), { type, pieces: [...last.pieces, { text, font: item.font }] }]
                    : [...all, { type, pieces: [{ text, font: item.font }] }];
            }, tokens);
        }
        // The breaks are taken out before the parts between them are tokenized
        return [...tokens, item as Exclude<InlineItem, { readonly type: "text" | "break" }>];
    }, []);

/**
 * Splits a paragraph's content at its breaks.
 */
const segmentsOf = (items: readonly InlineItem[]): readonly Segment[] => {
    const breaks = items.flatMap((item, index) => (item.type === "break" ? [index] : []));
    const starts = [0, ...breaks.map((index) => index + 1)];
    return starts.map((start, index) => {
        const end = breaks[index];
        return {
            tokens: tokenize(items.slice(start, end)),
            end: end === undefined ? undefined : (items[end] as Segment["end"]),
        };
    });
};

const widthOf = (pieces: readonly Piece[], measurer: TextMeasurer): number =>
    pieces.reduce((total, { text, font }) => total + measurer.measureWidth(text, font), 0);

/**
 * A height in whole twips. LibreOffice's lines are whole twips tall: the font's line height, rounded, for most fonts
 * and sizes, and a twip taller for a few, such as Times New Roman at 10 points.
 */
const inTwips = (points: number): number => Math.round(points * TWIPS_PER_POINT) / TWIPS_PER_POINT;

/** The height of single-spaced lines, with this line spacing, in whole twips */
const spaced = (natural: number, spacing: LineSpacing | undefined): number => {
    const single = inTwips(natural);
    if (!spacing) {
        return single;
    }
    if (spacing.rule === "multiple") {
        return inTwips(single * spacing.multiple);
    }
    return spacing.rule === "exact" ? spacing.height : Math.max(single, spacing.height);
};

/** A line being laid out */
type LineState = {
    /** Where the next token starts, in points from the left edge of the text */
    readonly position: number;
    /** The tallest text or picture on it, in points */
    readonly natural: number;
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
 * Breaks a paragraph into lines, as Word breaks it.
 *
 * @param items - The paragraph's content, in order
 */
export const layoutLines = (
    items: readonly InlineItem[],
    { width, format = {}, tabStops = [], defaultTabStop = DEFAULT_TAB_STOP, markFont = {}, measurer = DEFAULT_MEASURER }: LineLayoutOptions,
): readonly LaidOutLine[] => {
    const { indentLeft = 0, indentRight = 0, firstLineIndent = 0, lineSpacing } = format;
    const limit = width - indentRight;
    const markHeight = measurer.measureLineHeight(markFont);
    const stops = [...tabStops].sort((a, b) => a.position - b.position);
    const firstLineStops =
        firstLineIndent < 0
            ? [...stops, { position: indentLeft, alignment: "left" as const }].sort((a, b) => a.position - b.position)
            : stops;
    const parts = segmentsOf(items);
    // A page or column break at the end of a paragraph has the paragraph's mark on its line, as Word lays it out from
    // Word 2013, rather than on a line of its own on the next page
    const [previous, last] = parts.slice(-2);
    const endsWithBreak = parts.length > 1 && previous.end!.kind !== "line" && last.tokens.every((token) => token.type === "marker");
    const segments = endsWithBreak ? [...parts.slice(0, -2), { tokens: [...previous.tokens, ...last.tokens], end: previous.end }] : parts;

    // eslint-disable-next-line functional/prefer-readonly-type
    const lines: LaidOutLine[] = [];
    let first = true;
    for (const [segmentIndex, { tokens, end }] of segments.entries()) {
        const isLast = segmentIndex === segments.length - 1;
        let line: LineState = {
            position: indentLeft + (first ? firstLineIndent : 0),
            natural: 0,
            markers: [],
            pending: [],
            started: false,
            first,
        };
        const finish = (state: LineState, breakAfter?: LaidOutLine["breakAfter"], extra = 0): void => {
            const natural = Math.max(state.natural, extra, state.started ? 0 : markHeight);
            // eslint-disable-next-line functional/immutable-data
            lines.push({
                height: spaced(natural, lineSpacing),
                markers: [...state.markers, ...state.pending],
                ...(breakAfter ? { breakAfter } : {}),
            });
        };
        const wrap = (state: LineState): LineState => {
            finish({ ...state, pending: [] });
            return { position: indentLeft, natural: 0, markers: [], pending: state.pending, started: false, first: false };
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
                line = { ...line, position: line.position + widthOf(token.pieces, measurer), natural: Math.max(line.natural, height) };
                continue;
            }
            if (token.type === "tab") {
                const height = measurer.measureLineHeight(token.font);
                const stop =
                    nextStop(line.position, line.first ? firstLineStops : stops, defaultTabStop, limit) ??
                    (line.started ? nextStop(indentLeft, stops, defaultTabStop, limit) : undefined);
                if (stop === undefined) {
                    // No stop before the end of the line: the text after the tab starts where it is
                    line = { ...line, natural: Math.max(line.natural, height), started: true };
                    continue;
                }
                if (stop.position <= line.position + TOLERANCE) {
                    // The tab moves to a stop on the next line
                    line = wrap(line);
                }
                line = place(line);
                const after = widthAfterTab(tokens.slice(index + 1), measurer);
                const shift = stop.alignment === "left" ? 0 : stop.alignment === "center" ? after / 2 : after;
                line = {
                    ...line,
                    position: Math.max(line.position, stop.position - shift),
                    natural: Math.max(line.natural, height),
                    started: true,
                };
                continue;
            }
            const tokenWidth = token.type === "box" ? token.width : widthOf(token.pieces, measurer);
            const tokenHeight =
                token.type === "box" ? token.height : Math.max(...token.pieces.map(({ font }) => measurer.measureLineHeight(font)));
            if (line.started && line.position + tokenWidth > limit + TOLERANCE) {
                line = wrap(line);
            }
            line = place(line);
            if (token.type === "word" && line.position + tokenWidth > limit + TOLERANCE && limit - indentLeft > 0) {
                // A word wider than a line is broken across as many lines as it needs
                const room = limit - indentLeft;
                const full = Math.floor((line.position - indentLeft + tokenWidth) / room - TOLERANCE);
                for (let count = 0; count < full; count++) {
                    line = wrap({ ...line, natural: Math.max(line.natural, tokenHeight), started: true });
                }
                line = { ...line, position: indentLeft + ((line.position - indentLeft + tokenWidth) % room || room) };
            } else {
                line = { ...line, position: line.position + tokenWidth };
            }
            line = { ...line, natural: Math.max(line.natural, tokenHeight), started: true };
        }

        if (!end) {
            // The mark adds nothing to the height of a line with text, as Word and LibreOffice lay it out
            finish(line);
        } else {
            const breakHeight = Math.max(measurer.measureLineHeight(end.font), isLast && !line.started ? markHeight : 0);
            finish({ ...line, natural: Math.max(line.natural, breakHeight), started: true }, end.kind === "line" ? undefined : end.kind);
        }
        first = false;
    }
    return lines;
};
