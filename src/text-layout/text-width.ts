/**
 * Estimates how much space text takes up, from the widths of the characters in common fonts.
 *
 * The estimate is close for the fonts in {@link FONT_WIDTHS}. Other fonts are measured with the one most like them,
 * so their estimates are rougher. Kerning and ligatures are left out, which makes text a little wider than Word draws it.
 *
 * @module
 */
// cspell:ignore caladea Aptos
import { FONT_WIDTHS, FONT_WIDTH_RANGES, type FontWidths } from "./font-widths";

/**
 * The font text is measured in.
 */
export type TextFont = {
    /** The font's name, such as `"Calibri"`. Default is Times New Roman, which Word uses when a document doesn't give a font */
    readonly font?: string;
    /** Size in points. Default is 10, which Word uses when a document doesn't give a size */
    readonly size?: number;
    readonly bold?: boolean;
    /** The width tables measure italic text as upright, and Pretext measures it in the font's italics */
    readonly italic?: boolean;
    /** Space added after each character, in points */
    readonly characterSpacing?: number;
    /** How wide the characters are drawn, as a percentage of their width */
    readonly scale?: number;
};

/**
 * A piece of text in one font.
 */
export type TextSpan = TextFont & {
    /** The text. `"\n"` starts a new line and `"\t"` moves to the next tab stop */
    readonly text: string;
};

/**
 * The spacing between a paragraph's lines. Default is single spacing.
 */
export type LineSpacing =
    | {
          readonly rule: "multiple";
          /** How many times single spacing, such as 1.5 */
          readonly multiple: number;
      }
    | {
          /** Every line this tall, or single spacing if that is taller */
          readonly rule: "exact" | "atLeast";
          /** Height of a line in points */
          readonly height: number;
      };

/**
 * A tab stop a paragraph or its style sets, or clears, in points from the left edge of the text.
 */
export type TabStopSetting = {
    readonly position: number;
    readonly alignment: "left" | "right" | "center" | "decimal" | "bar" | "clear";
};

/**
 * The formatting of a paragraph that changes how tall it is, where its lines wrap, or where pages break around it.
 * Lengths are in points.
 */
export type ParagraphFormat = {
    readonly spaceBefore?: number;
    readonly spaceAfter?: number;
    readonly lineSpacing?: LineSpacing;
    readonly indentLeft?: number;
    readonly indentRight?: number;
    /** How much further in the first line starts than the others. Negative for a hanging indent */
    readonly firstLineIndent?: number;
    /** Leaves out the space before and after the paragraph next to a paragraph of the same style */
    readonly contextualSpacing?: boolean;
    /** Keeps the paragraph on the same page as the next one */
    readonly keepNext?: boolean;
    /** Keeps the paragraph's lines on one page */
    readonly keepLines?: boolean;
    readonly pageBreakBefore?: boolean;
    /** Keeps the first and last lines of the paragraph from being alone on a page */
    readonly widowControl?: boolean;
    /** The tab stops the paragraph, or its style, sets or clears. Those of its styles are added to them */
    readonly tabs?: readonly TabStopSetting[];
    /** Whether Word's East Asian rules keep characters from starting or ending its lines (`w:kinsoku`). Default is on */
    readonly kinsoku?: boolean;
    /** Whether its lines break between words (`w:wordWrap`), or, when off, anywhere in the words of East Asian runs */
    readonly wordWrap?: boolean;
};

/**
 * A paragraph of text, with its formatting.
 */
export type TextParagraph = {
    readonly spans: readonly TextSpan[];
    /** The font of the paragraph's mark, which sets the height of an empty paragraph */
    readonly font?: TextFont;
    readonly format?: ParagraphFormat;
    /** The paragraph's style, for `contextualSpacing` */
    readonly style?: string;
};

export const DEFAULT_FONT = "Times New Roman";
export const DEFAULT_FONT_SIZE = 10;

// Word's default tab stops are half an inch apart
const TAB_STOP = 36;

// Fonts that are measured with a font in the table, because they have the same widths or are close to them
const SIMILAR_FONTS: readonly (readonly [RegExp, string])[] = [
    [/^(carlito|calibri light|segoe ui|candara|corbel)$/i, "Calibri"],
    [/^caladea$/i, "Cambria"],
    [/mono|courier|consolas|code|typewriter/i, "Courier New"],
    [/times|tinos|liberation serif|georgia|garamond|palatino|book antiqua|(?<!sans[ -]?)serif|roman/i, "Times New Roman"],
];

// The characters of the tables, in their order, and the index of each
const CHARACTERS = FONT_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset));
const CHARACTER_INDEX: ReadonlyMap<number, number> = new Map(CHARACTERS.map((code, index) => [code, index]));

const AVERAGE_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)!)!);

// The digits the tables write widths in, two to a width
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

const decoded = new Map<string, readonly (number | undefined)[]>();

/**
 * Reads the widths of a font's face, as {@link FontWidths} writes them: the width of each character of the tables, in
 * thousandths of an em, or undefined where its width in Word isn't known.
 */
const decodeWidths = (encoded: string): readonly (number | undefined)[] => {
    const known = decoded.get(encoded);
    if (known) {
        return known;
    }
    const twoDigitsAt = (at: number): number => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);
    // eslint-disable-next-line functional/prefer-readonly-type
    const widths: (number | undefined)[] = [];
    let token = 0;
    for (let at = 0; at < encoded.length;) {
        let count = 1;
        if (encoded[at] === "*") {
            // What is before it, again
            count = twoDigitsAt(at + 1);
            at += 3;
        } else {
            token = at;
            at += encoded[at] === "=" || encoded[at] === "!" ? 1 : 2;
        }
        for (let repeat = 0; repeat < count; repeat++) {
            const code = CHARACTERS[widths.length];
            const width =
                encoded[token] === "!"
                    ? undefined
                    : encoded[token] === "="
                      ? // As wide as the letter it is made from, which comes before it
                        widths[CHARACTER_INDEX.get(String.fromCodePoint(code).normalize("NFD").codePointAt(0)!)!]
                      : twoDigitsAt(token);
            // eslint-disable-next-line functional/immutable-data
            widths.push(width);
        }
    }
    // eslint-disable-next-line functional/immutable-data
    decoded.set(encoded, widths);
    return widths;
};

/**
 * A font for Chinese, Japanese or Korean text, and how Word lays it out.
 */
type EastAsianFont = {
    readonly name: string;
    /** The names it is also known by, in its own language, as Office's theme names them */
    readonly aliases: readonly string[];
    /** The height of its lines, in thousandths of an em: about 1.3 times the font's height, as Word lays them out */
    readonly lineHeight: number;
    /** Whether its Latin letters are all half an em wide */
    readonly monospaced?: boolean;
    /** The font in the table its Latin letters are measured with, when they aren't monospaced */
    readonly latin: string;
};

/* cspell:disable */
// The heights of their lines are Word's, from its PDF of scripts/layout-probes/word-unicode2.ts, over 20 lines of each.
// Their Chinese, Japanese and Korean characters are an em wide
const EAST_ASIAN_FONTS: readonly EastAsianFont[] = [
    { name: "MS Mincho", aliases: ["ＭＳ 明朝", "MS 明朝"], lineHeight: 1297, monospaced: true, latin: "Times New Roman" },
    { name: "MS Gothic", aliases: ["ＭＳ ゴシック", "MS ゴシック"], lineHeight: 1297, monospaced: true, latin: "Arial" },
    { name: "MS PMincho", aliases: ["ＭＳ Ｐ明朝", "MS P明朝"], lineHeight: 1297, latin: "Times New Roman" },
    { name: "MS PGothic", aliases: ["ＭＳ Ｐゴシック", "MS Pゴシック"], lineHeight: 1297, latin: "Arial" },
    { name: "Yu Mincho", aliases: ["游明朝"], lineHeight: 1433, latin: "Times New Roman" },
    { name: "Yu Gothic", aliases: ["游ゴシック", "游ゴシック Light", "Yu Gothic Light"], lineHeight: 1434, latin: "Arial" },
    { name: "Meiryo", aliases: ["メイリオ"], lineHeight: 1950, latin: "Arial" },
    { name: "SimSun", aliases: ["宋体"], lineHeight: 1297, monospaced: true, latin: "Times New Roman" },
    { name: "NSimSun", aliases: ["新宋体"], lineHeight: 1296, monospaced: true, latin: "Times New Roman" },
    { name: "SimHei", aliases: ["黑体"], lineHeight: 1297, monospaced: true, latin: "Arial" },
    { name: "KaiTi", aliases: ["楷体"], lineHeight: 1297, monospaced: true, latin: "Times New Roman" },
    { name: "FangSong", aliases: ["仿宋"], lineHeight: 1297, monospaced: true, latin: "Times New Roman" },
    { name: "Microsoft YaHei", aliases: ["微软雅黑"], lineHeight: 1714, latin: "Arial" },
    { name: "DengXian", aliases: ["等线", "等线 Light", "DengXian Light"], lineHeight: 1354, latin: "Arial" },
    { name: "PMingLiU", aliases: ["新細明體"], lineHeight: 1300, latin: "Times New Roman" },
    { name: "MingLiU", aliases: ["細明體"], lineHeight: 1301, monospaced: true, latin: "Times New Roman" },
    { name: "Microsoft JhengHei", aliases: ["微軟正黑體"], lineHeight: 1730, latin: "Arial" },
    { name: "Malgun Gothic", aliases: ["맑은 고딕"], lineHeight: 1730, latin: "Arial" },
    { name: "Batang", aliases: ["바탕"], lineHeight: 1300, latin: "Times New Roman" },
    { name: "Gulim", aliases: ["굴림"], lineHeight: 1301, latin: "Arial" },
    { name: "Dotum", aliases: ["돋움"], lineHeight: 1301, latin: "Arial" },
];
// East Asian fonts that aren't in the table, which are measured as MS Gothic, or MS Mincho for those with serifs
const EAST_ASIAN_NAME =
    /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]|hiragino|cjk|source han|pingfang|songti|heiti|kaiti|fangsong|mincho|mingliu|simhei|gungsuh|nanum/i;
const EAST_ASIAN_SANS = /gothic|ゴシック|hei|黑|黒|sans|고딕|pingfang/i;
/* cspell:enable */

/**
 * The East Asian font a font is, or is measured as, by its name. Undefined for other fonts.
 */
const eastAsianFontOf = (font: string): EastAsianFont | undefined => {
    const name = font.toLowerCase();
    const known = EAST_ASIAN_FONTS.find((candidate) =>
        [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name),
    );
    const similar = EAST_ASIAN_SANS.test(font) ? "MS Gothic" : "MS Mincho";
    return known ?? (EAST_ASIAN_NAME.test(font) ? EAST_ASIAN_FONTS.find((candidate) => candidate.name === similar) : undefined);
};

/** Whether a font is one for Chinese, Japanese or Korean text */
export const isEastAsianFont = (font: string | undefined): boolean => font !== undefined && eastAsianFontOf(font) !== undefined;

/**
 * The widths to measure a font with: its own, or those of the most similar font in the table.
 * Sans-serif fonts that aren't in the table, such as Aptos and Helvetica, are measured as Arial.
 */
const widthsOf = (font = DEFAULT_FONT): FontWidths => {
    const named = (name: string): FontWidths | undefined => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());
    const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
    return named(font) ?? named(similar ? similar[1] : "Arial")!;
};

/** The widths of the face text is in: its font's, bold or not */
const faceOf = ({ font, bold }: TextFont): readonly (number | undefined)[] => {
    const { regular, bold: heavy } = widthsOf(font);
    return decodeWidths(bold ? heavy : regular);
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

// Half-width katakana, Hangul and symbols
const isHalfWidth = (code: number): boolean => code >= 0xff61 && code <= 0xffdc;

// Marks, which go on the character before them, and characters that only change how the text around them is laid out
const takesNoRoom = (character: string): boolean => /[\p{Mn}\p{Me}\p{Cf}]/u.test(character);

/**
 * The width of a character in thousandths of an em. Characters that aren't in the table are as wide as an average
 * lowercase letter, a whole em for wide characters and half an em for half-width ones, and marks take no space. So are
 * those the table has, but whose width in the font isn't known.
 */
const characterWidth = (widths: readonly (number | undefined)[], character: string): number => {
    const code = character.codePointAt(0)!;
    const index = CHARACTER_INDEX.get(code);
    const width = index === undefined ? undefined : widths[index];
    if (width !== undefined) {
        return width;
    }
    if (isWide(code)) {
        return 1000;
    }
    if (isHalfWidth(code)) {
        return 500;
    }
    return takesNoRoom(character) ? 0 : AVERAGE_LETTERS.reduce((total, letter) => total + widths[letter]!, 0) / AVERAGE_LETTERS.length;
};

// The characters of the private use area, which are a symbol font's own, such as Wingdings' tick, U+F0FC
const isPrivate = (code: number): boolean => code >= 0xe000 && code <= 0xf8ff;

// Symbols that monospaced Japanese and Chinese fonts have as wide as their ideographs, as MS Mincho does
const FULL_WIDTH_SYMBOLS = new Set([..."§¨°±´¶×÷‐―‖‘’“”†‡‥…‰′″※℃Å"]);

/**
 * The width of a character of a monospaced East Asian font, in thousandths of an em: an em for ideographs and the symbols
 * of Japanese and Chinese, and half an em for the rest.
 */
const monospacedWidth = (character: string): number => {
    const code = character.codePointAt(0)!;
    if (takesNoRoom(character)) {
        return 0;
    }
    return isWide(code) || FULL_WIDTH_SYMBOLS.has(character) || (code >= 0x2190 && code <= 0x26ff) ? 1000 : 500;
};

const sizeOf = ({ size = DEFAULT_FONT_SIZE }: TextFont): number => size;

/**
 * How a font's characters are measured: an East Asian font's Latin letters with the widths of the font in the table they
 * are measured as, or all of a monospaced one's as half an em or an em, and other fonts with their own widths, or those of
 * the most similar font in the table
 */
const measuresOf = (font: TextFont): { readonly widths: readonly (number | undefined)[]; readonly monospaced: boolean } => {
    const eastAsian = eastAsianFontOf(font.font ?? DEFAULT_FONT);
    return { widths: faceOf({ ...font, font: eastAsian?.latin ?? font.font }), monospaced: eastAsian?.monospaced === true };
};

/**
 * The first character of text whose width in its font isn't known, so isn't what Word lays out: one of the tables'
 * characters that Word draws in another font when the font doesn't have it, or whose width Word's PDF doesn't show, or a
 * symbol font's own character. Undefined when the widths of all of them are known, or are measured as before: those of
 * characters the tables don't have, as an average letter.
 */
export const unknownCharacter = (text: string, font: TextFont = {}): string | undefined => {
    const { widths, monospaced } = measuresOf(font);
    return [...text].find((character) => {
        const code = character.codePointAt(0)!;
        const index = CHARACTER_INDEX.get(code);
        return index === undefined || monospaced ? isPrivate(code) : widths[index] === undefined;
    });
};

/**
 * How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
 *
 * @param start - Where the text starts on its line, in points
 */
export const measureTextWidth = (text: string, font: TextFont = {}, start = 0): number => {
    const { widths, monospaced } = measuresOf(font);
    const widthOf = monospaced ? monospacedWidth : (character: string): number => characterWidth(widths, character);
    const size = sizeOf(font);
    const { characterSpacing = 0, scale = 100 } = font;
    return (
        [...text].reduce(
            (position, character) =>
                character === "\t"
                    ? (Math.floor(position / TAB_STOP) + 1) * TAB_STOP
                    : position + (widthOf(character) * size * scale) / 100000 + characterSpacing,
            start,
        ) - start
    );
};

/**
 * How tall a line of single-spaced text is, in points.
 */
export const measureLineHeight = (font: TextFont = {}): number =>
    ((eastAsianFontOf(font.font ?? DEFAULT_FONT) ?? widthsOf(font.font)).lineHeight * sizeOf(font)) / 1000;

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
    /** Whether the line has a word on it yet */
    readonly started: boolean;
};

/**
 * Lays out one line of a paragraph, up to a line break, wrapping it at `limit`. Positions are measured from the left
 * edge of the text, so tabs line up across lines.
 *
 * @param start - Where the line starts: the paragraph's left indent, and its first line indent on its first line
 * @param restart - Where the lines it wraps onto start
 * @param limit - Where lines wrap: the width of the text less the paragraph's right indent
 */
const wrapLine = (spans: readonly TextSpan[], height: number, start: number, restart: number, limit?: number): readonly Line[] => {
    const wraps = (position: number, width: number): boolean => limit !== undefined && position + width > limit;
    // The width of a whole line, after the indent
    const room = limit === undefined ? 0 : limit - restart;
    const { lines, end } = tokenize(spans).reduce<LineState>(
        (state, token) => {
            if (/^[ \t]/.test(token[0].text)) {
                return { ...state, position: state.position + measurePieces(token, state.position) };
            }
            // A word that doesn't fit starts a new line, unless it is the first on its line
            const wrapped = state.started && wraps(state.position, measurePieces(token, state.position));
            const done = wrapped ? [...state.lines, { width: state.end, height }] : state.lines;
            const position = wrapped ? restart : state.position;
            const width = measurePieces(token, position);
            if (room <= 0 || !wraps(position, width)) {
                return { lines: done, position: position + width, end: position + width, started: true };
            }
            // A word wider than a line is broken across as many lines as it needs
            const full = Math.ceil((position - restart + width) / room) - 1;
            const last = position + width - full * room;
            return {
                lines: [...done, ...Array.from({ length: full }, () => ({ width: limit!, height }))],
                position: last,
                end: last,
                started: true,
            };
        },
        { lines: [], position: start, end: start, started: false },
    );
    return [...lines, { width: end, height }];
};

/**
 * How tall a paragraph's lines are: as tall as its tallest font, with its line spacing.
 */
const lineHeightOf = ({ spans, font = {}, format = {} }: TextParagraph): number => {
    const single = Math.max(...(spans.length > 0 ? spans : [font]).map(measureLineHeight));
    const { lineSpacing } = format;
    if (!lineSpacing) {
        return single;
    }
    if (lineSpacing.rule === "multiple") {
        return single * lineSpacing.multiple;
    }
    return lineSpacing.rule === "exact" ? lineSpacing.height : Math.max(single, lineSpacing.height);
};

/**
 * Splits a paragraph's spans at line breaks.
 */
const splitLines = (spans: readonly TextSpan[]): readonly (readonly TextSpan[])[] =>
    spans.reduce<readonly (readonly TextSpan[])[]>(
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

/**
 * The space above and below a paragraph. With contextual spacing, there is none next to a paragraph of the same style.
 */
const spacingOf = (
    paragraph: TextParagraph,
    before?: TextParagraph,
    after?: TextParagraph,
): { readonly above: number; readonly below: number } => {
    const { spaceBefore = 0, spaceAfter = 0, contextualSpacing } = paragraph.format ?? {};
    const sameStyle = (other?: TextParagraph): boolean =>
        contextualSpacing === true && other !== undefined && other.style === paragraph.style;
    return { above: sameStyle(before) ? 0 : spaceBefore, below: sameStyle(after) ? 0 : spaceAfter };
};

/**
 * Measures text that wraps at `maxWidth`, or only at line breaks when `maxWidth` isn't given. Words wider than a
 * line are broken across lines, as Word breaks them. Spaces at the ends of lines take no space. Paragraphs take their
 * space before and after, line spacing and indents from their `format`.
 *
 * @param paragraphs - Each paragraph, or just its spans. A paragraph without spans is one empty line
 * @param maxWidth - The width lines wrap at, in points
 */
export const measureText = (paragraphs: readonly (TextParagraph | readonly TextSpan[])[], maxWidth?: number): TextSize => {
    const all = paragraphs.map((paragraph): TextParagraph => ("spans" in paragraph ? paragraph : { spans: paragraph }));
    const measured = all.map((paragraph, index) => {
        const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = paragraph.format ?? {};
        const height = lineHeightOf(paragraph);
        const limit = maxWidth === undefined ? undefined : maxWidth - indentRight;
        const lines = splitLines(paragraph.spans).flatMap((line, lineIndex) =>
            wrapLine(line, height, indentLeft + (lineIndex === 0 ? firstLineIndent : 0), indentLeft, limit),
        );
        const { above, below } = spacingOf(paragraph, all[index - 1], all[index + 1]);
        return {
            width: Math.max(0, ...lines.map(({ width }) => width + indentRight)),
            height: above + lines.reduce((total, line) => total + line.height, 0) + below,
        };
    });
    return {
        width: Math.max(0, ...measured.map(({ width }) => width)),
        height: measured.reduce((total, { height }) => total + height, 0),
    };
};
