/**
 * Estimates how much space text takes up, from the widths of the characters in common fonts.
 *
 * The estimate is close for the fonts in {@link FONT_WIDTHS}. Other fonts are measured with the one most like them,
 * so their estimates are rougher. Kerning and ligatures are left out, which makes text a little wider than Word draws it.
 *
 * @module
 */
// cspell:ignore caladea Aptos
import { FONT_WIDTHS, FONT_WIDTH_CHARACTERS, type FontWidths } from "./font-widths";

/**
 * The font text is measured in.
 */
export type TextFont = {
    /** The font's name, such as `"Calibri"`. Default is Times New Roman, which Word uses when a document doesn't give a font */
    readonly font?: string;
    /** Size in points. Default is 10, which Word uses when a document doesn't give a size */
    readonly size?: number;
    readonly bold?: boolean;
};

/**
 * A piece of text in one font.
 */
export type TextSpan = TextFont & {
    /** The text. `"\n"` starts a new line and `"\t"` moves to the next tab stop */
    readonly text: string;
};

export const DEFAULT_FONT = "Times New Roman";
export const DEFAULT_FONT_SIZE = 10;

// Word's default tab stops are half an inch apart
const TAB_STOP = 36;

// Fonts that are measured with a font in the table, because they have the same widths or are close to them
const SIMILAR_FONTS: readonly (readonly [RegExp, string])[] = [
    [/^(carlito|segoe ui|candara|corbel)$/i, "Calibri"],
    [/^caladea$/i, "Cambria"],
    [/mono|courier|consolas|code|typewriter/i, "Courier New"],
    [/times|tinos|liberation serif|georgia|garamond|palatino|book antiqua|(?<!sans[ -]?)serif|roman/i, "Times New Roman"],
];

const CHARACTER_INDEX: ReadonlyMap<number, number> = new Map(
    [...FONT_WIDTH_CHARACTERS].map((character, index) => [character.codePointAt(0)!, index]),
);

const AVERAGE_LETTER_INDEXES = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)!)!);

/**
 * The widths to measure a font with: its own, or those of the most similar font in the table.
 * Sans-serif fonts that aren't in the table, such as Aptos and Helvetica, are measured as Arial.
 */
const widthsOf = (font = DEFAULT_FONT): FontWidths => {
    const named = (name: string): FontWidths | undefined => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());
    const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
    return named(font) ?? named(similar ? similar[1] : "Arial")!;
};

// Characters as wide as they are tall: Chinese, Japanese and Korean, full-width forms and emoji
const isWide = (code: number): boolean =>
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    code >= 0x1f300;

/**
 * The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
 * lowercase letter, or a whole em for wide characters, and combining accents take no space.
 */
const characterWidth = (widths: readonly number[], code: number): number => {
    const index = CHARACTER_INDEX.get(code);
    if (index !== undefined) {
        return widths[index];
    }
    if (isWide(code)) {
        return 1000;
    }
    if (code >= 0x300 && code <= 0x36f) {
        return 0;
    }
    return AVERAGE_LETTER_INDEXES.reduce((total, letter) => total + widths[letter], 0) / AVERAGE_LETTER_INDEXES.length;
};

const sizeOf = ({ size = DEFAULT_FONT_SIZE }: TextFont): number => size;

/**
 * How wide a line of text is, in points. Tabs move to the next half inch, counted from `start`.
 *
 * @param start - Where the text starts on its line, in points
 */
export const measureTextWidth = (text: string, font: TextFont = {}, start = 0): number => {
    const { regular, bold } = widthsOf(font.font);
    const widths = font.bold ? bold : regular;
    const size = sizeOf(font);
    return (
        [...text].reduce((position, character) => {
            if (character === "\t") {
                return (Math.floor(position / TAB_STOP) + 1) * TAB_STOP;
            }
            return position + (characterWidth(widths, character.codePointAt(0)!) * size) / 1000;
        }, start) - start
    );
};

/**
 * How tall a line of single-spaced text is, in points.
 */
export const measureLineHeight = (font: TextFont = {}): number => (widthsOf(font.font).lineHeight * sizeOf(font)) / 1000;

/**
 * The size of text laid out in lines, in points.
 */
export type TextSize = {
    /** The width of the longest line */
    readonly width: number;
    /** The height of all the lines */
    readonly height: number;
};

type Line = {
    readonly width: number;
    readonly height: number;
};

/**
 * Splits spans into words and the spaces between them. A word can be made of pieces of several spans, such as a bold
 * letter in a plain word, so each token is a list of pieces.
 */
const tokenize = (spans: readonly TextSpan[]): readonly (readonly TextSpan[])[] =>
    spans
        .flatMap((span) =>
            span.text
                .split(/([ \t]+)/)
                .filter((text) => text.length > 0)
                .map((text) => ({ ...span, text })),
        )
        .reduce<readonly (readonly TextSpan[])[]>((tokens, piece) => {
            const last = tokens[tokens.length - 1];
            const isSpace = (text: string): boolean => /^[ \t]/.test(text);
            // Pieces of words next to each other are one word
            return last && !isSpace(piece.text) && !isSpace(last[0].text)
                ? [...tokens.slice(0, -1), [...last, piece]]
                : [...tokens, [piece]];
        }, []);

const measurePieces = (pieces: readonly TextSpan[], start: number): number =>
    pieces.reduce((position, piece) => position + measureTextWidth(piece.text, piece, position), start) - start;

type LineState = {
    readonly lines: readonly Line[];
    /** Where the next word starts */
    readonly position: number;
    /** Where the last word on the line ends: spaces at the end of a line aren't drawn */
    readonly end: number;
};

/**
 * Lays out one line of a paragraph, up to a line break, wrapping it at `maxWidth`.
 */
const wrapLine = (spans: readonly TextSpan[], height: number, maxWidth?: number): readonly Line[] => {
    const wraps = (position: number, width: number): boolean => maxWidth !== undefined && position + width > maxWidth;
    const { lines, end } = tokenize(spans).reduce<LineState>(
        (state, token) => {
            if (/^[ \t]/.test(token[0].text)) {
                return { ...state, position: state.position + measurePieces(token, state.position) };
            }
            // A word that doesn't fit starts a new line, unless it is the first on its line
            const wrapped = state.end > 0 && wraps(state.position, measurePieces(token, state.position));
            const done = wrapped ? [...state.lines, { width: state.end, height }] : state.lines;
            const position = wrapped ? 0 : state.position;
            const width = measurePieces(token, position);
            if (maxWidth === undefined || maxWidth <= 0 || !wraps(position, width)) {
                return { lines: done, position: position + width, end: position + width };
            }
            // A word wider than a line is broken across as many lines as it needs
            const full = Math.ceil((position + width) / maxWidth) - 1;
            const rest = position + width - full * maxWidth;
            return { lines: [...done, ...Array.from({ length: full }, () => ({ width: maxWidth, height }))], position: rest, end: rest };
        },
        { lines: [], position: 0, end: 0 },
    );
    return [...lines, { width: end, height }];
};

/**
 * Measures text that wraps at `maxWidth`, or only at line breaks when `maxWidth` isn't given. Words wider than a
 * line are broken across lines, as Word breaks them. Spaces at the ends of lines take no space.
 *
 * @param paragraphs - Each paragraph's spans. A paragraph without spans is one empty line in the default font
 * @param maxWidth - The width lines wrap at, in points
 */
export const measureText = (paragraphs: readonly (readonly TextSpan[])[], maxWidth?: number): TextSize => {
    const lines = paragraphs.flatMap((spans) => {
        // Each line is as tall as its tallest font
        const height = Math.max(...(spans.length > 0 ? spans : [{}]).map(measureLineHeight));
        const breaks = spans.reduce<readonly (readonly TextSpan[])[]>(
            (parts, span) =>
                span.text
                    .split("\n")
                    .reduce<readonly (readonly TextSpan[])[]>(
                        (spanParts, text, index) =>
                            index === 0
                                ? [...spanParts.slice(0, -1), [...spanParts[spanParts.length - 1], { ...span, text }]]
                                : [...spanParts, [{ ...span, text }]],
                        parts,
                    ),
            [[]],
        );
        return breaks.flatMap((line) => wrapLine(line, height, maxWidth));
    });
    return {
        width: Math.max(0, ...lines.map(({ width }) => width)),
        height: lines.reduce((total, { height }) => total + height, 0),
    };
};
