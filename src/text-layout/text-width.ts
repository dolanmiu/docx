/**
 * Estimates how much space text takes up, from the widths of the characters in common fonts.
 *
 * The estimate is close for the fonts in {@link FONT_WIDTHS}, and those made with the same widths, such as Carlito.
 * Other fonts are measured with the one most like them, so their estimates are rougher, and {@link unknownFont} says
 * which they are. {@link measureTextWidthAsDrawn} kerns text that asks for kerning, and joins its letters into
 * ligatures, as Word draws the fonts of the tables, from `font-kerning.ts`, and {@link unknownShaping} says where that
 * isn't known.
 *
 * @module
 */
// cspell:ignore caladea Aptos
import { type ArabicFace, arabicFaceOf, isJoinedLetter, joinedWidthsOf } from "./arabic-shaping";
import { FALLBACK_FACES, FONT_WIDTHS, FONT_WIDTH_RANGES, type FontWidths } from "./font-widths";
import { type FaceShaping, type Glyph, hasLigatures, joinLetters, kerningBetween, rulesOf, shapingOf } from "./kerning";
import { FALLBACK_FONTS, MORE_WIDTHS, MORE_WIDTH_RANGES } from "./more-widths";

/**
 * The font text is measured in.
 */
export type TextFont = {
    /** The font's name, such as `"Calibri"`. Default is Times New Roman, which Word uses when a document doesn't give a font */
    readonly font?: string;
    /** Size in points. Default is 10, which Word uses when a document doesn't give a size */
    readonly size?: number;
    readonly bold?: boolean;
    /** Measured in the font's italics, or bold italics */
    readonly italic?: boolean;
    /** Kerns pairs of characters in text of this size or larger, in points (`w:kern`). Not kerned when it isn't given */
    readonly kerning?: number;
    /**
     * Which of the font's ligatures join its letters (`w14:ligatures`), as Word writes them, such as `"standardContextual"`,
     * which Word's own Normal template has. None when it isn't given
     */
    readonly ligatures?: Ligatures;
    /**
     * The language of kerned text, or text with ligatures (`w:lang`), as Word kerns and joins letters across runs of the
     * same language, but not of others (scripts/layout-probes/word-kerning.ts R1d), though it does across runs of other
     * colours (R1c, R2d)
     */
    readonly language?: string;
    /** Space added after each character, in points */
    readonly characterSpacing?: number;
    /** How wide the characters are drawn, as a percentage of their width */
    readonly scale?: number;
    /**
     * The size in points of the line the text takes up, when it is drawn smaller than its run's size: superscript,
     * subscript and the small letters of small capitals take up the line of their run's size. Default is its size
     */
    readonly lineSize?: number;
    /** How far the text is raised, in points, or lowered when it is negative (`w:position`), which raises its line too */
    readonly raise?: number;
    /** A border around the text, which takes room beside it, and above and below it */
    readonly border?: TextBorder;
    /** Whether emphasis marks over the text, or under it, take room in its line (`w:em`) */
    readonly emphasis?: "above" | "below";
    /**
     * Off when the text isn't laid out on the characters of its section's document grid (`w:snapToGrid` off), which its
     * measurer leaves to the layout of its lines
     */
    readonly snapToGrid?: false;
    /** Whether it is in a right-to-left run (`w:rtl`), which changes where Word breaks a line at a space beside it */
    readonly rightToLeft?: boolean;
    /**
     * Whether it is a list's number, or the space or tab that follows it, which take up less of their line than text: a
     * number only the room above the baseline, and what follows it none
     */
    readonly listNumber?: "number" | "separator";
};

/**
 * The ligatures text has (`w14:ligatures`): the font's standard ligatures, contextual, historical and discretional ones,
 * or a mix of them. Word's Font dialog writes "none", "standard", "standardContextual", "historicalDiscretional" and
 * "all".
 */
export type Ligatures =
    | "none"
    | "standard"
    | "contextual"
    | "historical"
    | "discretional"
    | "standardContextual"
    | "standardHistorical"
    | "contextualHistorical"
    | "standardDiscretional"
    | "contextualDiscretional"
    | "historicalDiscretional"
    | "standardContextualHistorical"
    | "standardContextualDiscretional"
    | "standardHistoricalDiscretional"
    | "contextualHistoricalDiscretional"
    | "all";

/**
 * A border around text, as its run gives it (`w:bdr`).
 */
export type TextBorder = {
    /** The room it takes on each side of the text, and above and below it, in points: its space and its width */
    readonly room: number;
    /** Which border it is: text next to text with the same border is in one box with it, with room only at the box's ends */
    readonly key: string;
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
 * A border of a paragraph, on one side (`w:pBdr`), as it is written.
 */
export type ParagraphBorder = {
    /** Its style, such as "single" or "double", or "none" or "nil" for none */
    readonly style: string;
    /** How wide it is, in eighths of a point, when it says */
    readonly size?: number;
    /** The space between it and the text, in points */
    readonly space: number;
    readonly shadow: boolean;
    readonly frame: boolean;
    /** All it says, which tells whether two paragraphs have the same border */
    readonly key: string;
};

/**
 * The formatting of a paragraph that changes how tall it is, where its lines wrap, or where pages break around it.
 * Lengths are in points.
 */
export type ParagraphFormat = {
    readonly spaceBefore?: number;
    readonly spaceAfter?: number;
    /**
     * The space before and after in hundredths of a line (`w:beforeLines`, `w:afterLines`), which Word takes in place
     * of the space in points when it isn't 0
     */
    readonly spaceBeforeLines?: number;
    readonly spaceAfterLines?: number;
    /**
     * Word's automatic space before and after (`w:beforeAutospacing`, `w:afterAutospacing`), as documents made from HTML
     * have it, in place of the space given
     */
    readonly autoSpaceBefore?: boolean;
    readonly autoSpaceAfter?: boolean;
    readonly lineSpacing?: LineSpacing;
    /**
     * The line spacing of its lines from the one with a marker on, in place of `lineSpacing`: those of a paragraph joined
     * to it by its hidden mark, where they differ, as Word spaces each line by the paragraph its text ends in
     */
    readonly lineSpacingFrom?: { readonly marker: string; readonly lineSpacing?: LineSpacing };
    readonly indentLeft?: number;
    readonly indentRight?: number;
    /** How much further in the first line starts than the others. Negative for a hanging indent */
    readonly firstLineIndent?: number;
    /**
     * Indents in hundredths of a character (`w:leftChars`, `w:rightChars`, `w:firstLineChars` and `w:hangingChars`, the
     * last as a negative first line indent), which Word takes in place of those in points when they aren't 0
     */
    readonly indentLeftChars?: number;
    readonly indentRightChars?: number;
    readonly firstLineChars?: number;
    /** Its borders, each of which its own formatting gives or takes away apart from its style's */
    readonly borderTop?: ParagraphBorder;
    readonly borderBottom?: ParagraphBorder;
    readonly borderLeft?: ParagraphBorder;
    readonly borderRight?: ParagraphBorder;
    readonly borderBetween?: ParagraphBorder;
    readonly borderBar?: ParagraphBorder;
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
    /** Whether the paragraph is right to left (`w:bidi`) */
    readonly rightToLeft?: boolean;
    /** Whether its lines break between words (`w:wordWrap`), or, when off, anywhere in the words of East Asian runs */
    readonly wordWrap?: boolean;
    /** Whether Word's automatic hyphenation leaves its words whole (`w:suppressAutoHyphens`) */
    readonly suppressAutoHyphens?: boolean;
    /**
     * Whether its lines are laid out on the document grid of its section, when the section has one (`w:snapToGrid`).
     * Default is on
     */
    readonly snapToGrid?: boolean;
    /**
     * How its lines line up. Word squeezes the spaces of a justified line to fit one more word on it, so its lines can
     * break later than a left-aligned paragraph's
     */
    readonly alignment?: ParagraphAlignment;
};

/**
 * How a paragraph's lines line up (`w:jc`): justified is `both`, and distributed, which spreads the letters too and
 * lines up the last line as well, is `distribute`. Word's three justifications for Arabic draw out its letters by a low,
 * medium or high kashida, and Thai distributed is `thaiDistribute`.
 */
export type ParagraphAlignment =
    "left" | "center" | "right" | "justified" | "distributed" | "thaiDistributed" | "lowKashida" | "mediumKashida" | "highKashida";

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

// Fonts made to have the same widths and heights as a font in the table, which are measured exactly as it. Helvetica is
// within 0.1% of Arial in Word (`word-watertight-text.docx` TX18)
const SAME_WIDTHS: readonly (readonly [RegExp, string])[] = [
    [/^carlito$/i, "Calibri"],
    [/^caladea$/i, "Cambria"],
    [/^(liberation sans|arimo|helvetica)$/i, "Arial"],
    [/^(liberation serif|tinos)$/i, "Times New Roman"],
    [/^(liberation mono|cousine)$/i, "Courier New"],
];

// Fonts that are measured with a font in the table because they are close to it, which is a guess: Word draws them with
// their own widths, as it draws Calibri Light 1.4% narrower than Calibri and Georgia 9% wider than Times New Roman (TX18)
const SIMILAR_FONTS: readonly (readonly [RegExp, string])[] = [
    [/^segoe ui$/i, "Calibri"],
    [/mono|courier|code|typewriter/i, "Courier New"],
    [/times|garamond|palatino|(?<!sans[ -]?)serif|roman/i, "Times New Roman"],
];

// The characters of the tables, in their order, and the index of each
const CHARACTERS = FONT_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset));
const CHARACTER_INDEX: ReadonlyMap<number, number> = new Map(CHARACTERS.map((code, index) => [code, index]));

const AVERAGE_LETTERS = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => CHARACTER_INDEX.get(letter.codePointAt(0)!)!);

// The characters of the tables of Hebrew, the Arabic-Indic and Devanagari digits, Thai, box drawing, shapes, symbols and
// dingbats, in their order, and the index of each
const MORE_CHARACTER_INDEX: ReadonlyMap<number, number> = new Map(
    MORE_WIDTH_RANGES.flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset)).map(
        (code, index) => [code, index],
    ),
);

// Arabic, whose letters Word joins into forms of other widths, and Devanagari, whose letters it joins and reorders, which
// aren't measured, but for their digits and Devanagari's full stops, which it joins to nothing (see `more-widths.ts`), and
// Arabic's letters in the fonts whose forms' widths Word's PDF has (see `arabic-widths.ts`)
const JOINED_SCRIPT = /[\p{Script=Arabic}\p{Script=Devanagari}]/u;

// The digits the tables write widths in, two to a width
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

const decoded = new Map<string, FaceWidths>();
const decodedOwn = new Map<string, FaceWidths>();
const twoDigitsIn = (encoded: string, at: number): number => DIGITS.indexOf(encoded[at]) * 64 + DIGITS.indexOf(encoded[at + 1]);

/**
 * Reads what a string of `more-widths.ts` says of each character: tokens of `size` characters, or "!" for none, each with
 * "*" and two digits repeating it that many more times.
 */
const decodeTokens = <T>(encoded: string, size: number, read: (token: string) => T): readonly (T | undefined)[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const values: (T | undefined)[] = [];
    let last: T | undefined;
    for (let at = 0; at < encoded.length;) {
        if (encoded[at] === "*") {
            // eslint-disable-next-line functional/immutable-data
            values.push(...new Array<T | undefined>(twoDigitsIn(encoded, at + 1)).fill(last));
            at += 3;
        } else {
            last = encoded[at] === "!" ? undefined : read(encoded.slice(at, at + size));
            // eslint-disable-next-line functional/immutable-data
            values.push(last);
            at += encoded[at] === "!" ? 1 : size;
        }
    }
    return values;
};

/** The widths and fonts of a face of {@link MORE_WIDTHS}: each character's width, and the font it is drawn in, if not its own */
type MoreFace = { readonly widths: readonly (number | undefined)[]; readonly fonts: readonly (number | undefined)[] };
const decodedMore = new Map<string, MoreFace>();
const decodeMore = ({ widths, fonts }: { readonly widths: string; readonly fonts: string }): MoreFace => {
    const known = decodedMore.get(widths + fonts);
    if (known) {
        return known;
    }
    const face = {
        // In tenths of a thousandth of an em, three digits each
        widths: decodeTokens(widths, 3, (token) => (DIGITS.indexOf(token[0]) * 4096 + twoDigitsIn(token, 1)) / 10),
        fonts: decodeTokens(fonts, 1, (token) => (token === "-" ? undefined : DIGITS.indexOf(token))),
    };
    // eslint-disable-next-line functional/immutable-data
    decodedMore.set(widths + fonts, face);
    return face;
};

/**
 * The widths of a font's face: the width of each character of the tables, in thousandths of an em, or undefined where
 * its width in Word isn't known, and for each character the face doesn't have, which Word draws in another face of the
 * tables, the index of that face in {@link FALLBACK_FACES}.
 */
type FaceWidths = { readonly widths: readonly (number | undefined)[]; readonly fallbacks: readonly (number | undefined)[] };

/**
 * Reads the widths of a font's face, as {@link FontWidths} writes them, but for the characters Word draws in another face
 * of the tables, which are undefined.
 */
const decodeOwnWidths = (encoded: string): FaceWidths => {
    const known = decodedOwn.get(encoded);
    if (known) {
        return known;
    }
    const twoDigitsAt = (at: number): number => twoDigitsIn(encoded, at);
    // eslint-disable-next-line functional/prefer-readonly-type
    const widths: (number | undefined)[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const fallbacks: (number | undefined)[] = [];
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
                encoded[token] === "!" || encoded[token] === "~"
                    ? undefined
                    : encoded[token] === "="
                      ? // As wide as the letter it is made from, which comes before it
                        widths[CHARACTER_INDEX.get(String.fromCodePoint(code).normalize("NFD").codePointAt(0)!)!]
                      : twoDigitsAt(token);
            // eslint-disable-next-line functional/immutable-data
            widths.push(width);
            // eslint-disable-next-line functional/immutable-data
            fallbacks.push(encoded[token] === "~" ? DIGITS.indexOf(encoded[token + 1]) : undefined);
        }
    }
    const face = { widths, fallbacks };
    // eslint-disable-next-line functional/immutable-data
    decodedOwn.set(encoded, face);
    return face;
};

/**
 * Reads the widths of a font's face, as {@link FontWidths} writes them. A character Word draws in another face of the
 * tables is as wide as it is there, where the face has it itself.
 */
const decodeWidths = (encoded: string): FaceWidths => {
    const known = decoded.get(encoded);
    if (known) {
        return known;
    }
    const { widths, fallbacks } = decodeOwnWidths(encoded);
    const face = {
        widths: widths.map((width, index) => {
            const fallback = fallbacks[index];
            if (fallback === undefined) {
                return width;
            }
            const { font, bold, italic } = FALLBACK_FACES[fallback];
            return decodeOwnWidths(encodedFaceOf(widthsOf(font), bold, italic)).widths[index];
        }),
        fallbacks,
    };
    // eslint-disable-next-line functional/immutable-data
    decoded.set(encoded, face);
    return face;
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
    /** How far its lines go below the baseline, in thousandths of an em, as Word lays them out */
    readonly descent: number;
    /** Whether its Latin letters are all half an em wide */
    readonly monospaced?: boolean;
    /** The font in the table its Latin letters are measured with, when they aren't monospaced */
    readonly latin: string;
};

/* cspell:disable */
// The heights of their lines are Word's, from its PDF of scripts/layout-probes/word-unicode2.ts, over 20 lines of each, and
// their descents are from its PDF of word-mixed-heights.ts, over 10 lines of a picture beside each (MH5): MS Mincho's 289
// thousandths, with Courier New and Times New Roman beside it, make lines of 313.99 and 284.75 twips, where Word's are
// 313.92 to 314 and 284.73 to 284.8 (MH6a, MH6b). Their Chinese, Japanese and Korean characters are an em wide
const EAST_ASIAN_FONTS: readonly EastAsianFont[] = [
    { name: "MS Mincho", aliases: ["ＭＳ 明朝", "MS 明朝"], lineHeight: 1297, descent: 289, monospaced: true, latin: "Times New Roman" },
    { name: "MS Gothic", aliases: ["ＭＳ ゴシック", "MS ゴシック"], lineHeight: 1297, descent: 289, monospaced: true, latin: "Arial" },
    { name: "MS PMincho", aliases: ["ＭＳ Ｐ明朝", "MS P明朝"], lineHeight: 1297, descent: 289, latin: "Times New Roman" },
    { name: "MS PGothic", aliases: ["ＭＳ Ｐゴシック", "MS Pゴシック"], lineHeight: 1297, descent: 289, latin: "Arial" },
    { name: "Yu Mincho", aliases: ["游明朝"], lineHeight: 1433, descent: 387, latin: "Times New Roman" },
    { name: "Yu Gothic", aliases: ["游ゴシック", "游ゴシック Light", "Yu Gothic Light"], lineHeight: 1434, descent: 388, latin: "Arial" },
    { name: "Meiryo", aliases: ["メイリオ"], lineHeight: 1950, descent: 665, latin: "Arial" },
    { name: "SimSun", aliases: ["宋体"], lineHeight: 1297, descent: 289, monospaced: true, latin: "Times New Roman" },
    { name: "NSimSun", aliases: ["新宋体"], lineHeight: 1296, descent: 290, monospaced: true, latin: "Times New Roman" },
    { name: "SimHei", aliases: ["黑体"], lineHeight: 1297, descent: 290, monospaced: true, latin: "Arial" },
    { name: "KaiTi", aliases: ["楷体"], lineHeight: 1297, descent: 289, monospaced: true, latin: "Times New Roman" },
    { name: "FangSong", aliases: ["仿宋"], lineHeight: 1297, descent: 290, monospaced: true, latin: "Times New Roman" },
    // A fraction more than 12/7 of an em, as Microsoft YaHei 10.5, 21 and 31.5 take one more of a grid's lines of 360, 720
    // and 1080 twips than the size before (scripts/layout-probes/word-grid.ts G1f), within the 20 lines' 1714
    { name: "Microsoft YaHei", aliases: ["微软雅黑"], lineHeight: 1714.3, descent: 460, latin: "Arial" },
    { name: "DengXian", aliases: ["等线", "等线 Light", "DengXian Light"], lineHeight: 1354, descent: 388, latin: "Arial" },
    { name: "PMingLiU", aliases: ["新細明體"], lineHeight: 1300, descent: 350, latin: "Times New Roman" },
    { name: "MingLiU", aliases: ["細明體"], lineHeight: 1301, descent: 350, monospaced: true, latin: "Times New Roman" },
    { name: "Microsoft JhengHei", aliases: ["微軟正黑體"], lineHeight: 1730, descent: 454, latin: "Arial" },
    { name: "Malgun Gothic", aliases: ["맑은 고딕"], lineHeight: 1730, descent: 440, latin: "Arial" },
    { name: "Batang", aliases: ["바탕"], lineHeight: 1300, descent: 292, latin: "Times New Roman" },
    { name: "Gulim", aliases: ["굴림"], lineHeight: 1301, descent: 292, latin: "Arial" },
    { name: "Dotum", aliases: ["돋움"], lineHeight: 1301, descent: 292, latin: "Arial" },
];
// East Asian fonts that aren't in the table, which are measured as MS Gothic, or MS Mincho for those with serifs
const EAST_ASIAN_NAME =
    /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]|hiragino|cjk|source han|pingfang|songti|heiti|kaiti|fangsong|mincho|mingliu|simhei|gungsuh|nanum/i;
const EAST_ASIAN_SANS = /gothic|ゴシック|hei|黑|黒|sans|고딕|pingfang/i;
/* cspell:enable */

/** The East Asian font in the table a font is, by any of its names. Undefined for other fonts */
const knownEastAsianFontOf = (font: string): EastAsianFont | undefined => {
    const name = font.toLowerCase();
    return EAST_ASIAN_FONTS.find((candidate) => [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name));
};

/** Whether a font is one of the East Asian fonts in the table whose characters are all an em, or half an em, wide */
export const isMonospacedEastAsianFont = (font: string | undefined): boolean =>
    knownEastAsianFontOf(font ?? DEFAULT_FONT)?.monospaced === true;

/**
 * The East Asian font a font is, or is measured as, by its name. Undefined for other fonts.
 */
const eastAsianFontOf = (font: string): EastAsianFont | undefined => {
    const similar = EAST_ASIAN_SANS.test(font) ? "MS Gothic" : "MS Mincho";
    return (
        knownEastAsianFontOf(font) ??
        (EAST_ASIAN_NAME.test(font) ? EAST_ASIAN_FONTS.find((candidate) => candidate.name === similar) : undefined)
    );
};

/** Whether a font is one for Chinese, Japanese or Korean text */
export const isEastAsianFont = (font: string | undefined): boolean => font !== undefined && eastAsianFontOf(font) !== undefined;

const named = (name: string): FontWidths | undefined => FONT_WIDTHS.find((known) => known.name.toLowerCase() === name.toLowerCase());

/** The widths of a font in the table, or of a font with the same widths as one. Undefined for other fonts */
const exactWidthsOf = (font: string): FontWidths | undefined => {
    const same = SAME_WIDTHS.find(([pattern]) => pattern.test(font));
    return named(same ? same[1] : font);
};

/**
 * The widths to measure a font with: its own, or those of the most similar font in the table.
 * Sans-serif fonts that aren't in the table, such as Roboto, are measured as Arial.
 */
const widthsOf = (font = DEFAULT_FONT): FontWidths => {
    const similar = SIMILAR_FONTS.find(([pattern]) => pattern.test(font));
    return exactWidthsOf(font) ?? named(similar ? similar[1] : "Arial")!;
};

/**
 * The widths of a font's face, as the table writes them. Bold in a font without a bold face, such as Calibri Light, is
 * the bold Word makes itself (`word-stops-office-fonts.docx` MB1). Italic in a font without an italic face, such as
 * Tahoma, is the upright face's, as Word slants it, as wide (`word-stops-font-italic-widths.docx`), and so is Trebuchet
 * MS's bold italic, which Word draws as its bold, slanted, and Impact's, its bold made from its regular face
 */
const encodedFaceOf = (widths: FontWidths, bold: boolean, italic: boolean): string =>
    bold ? (italic ? (widths.boldItalic ?? widths.bold) : widths.bold) : italic ? (widths.italic ?? widths.regular) : widths.regular;

/** The widths of the face text is in: its font's, bold, italic, both or neither */
const faceOf = ({ font, bold = false, italic = false }: TextFont): FaceWidths => decodeWidths(encodedFaceOf(widthsOf(font), bold, italic));

/**
 * The widths of Hebrew, the Arabic-Indic and Devanagari digits, Thai, box drawing, shapes, symbols and dingbats in the face
 * text is in, and the fonts Word draws them in, which every font of the width tables has. Undefined in the italics of
 * Office's other fonts, whose widths Word's PDFs don't show
 */
const moreFaceOf = ({ font, bold = false, italic = false }: TextFont): MoreFace | undefined => {
    const { name } = widthsOf(font);
    const more = MORE_WIDTHS.find((known) => known.name === name)!;
    const face = italic ? (bold ? more.boldItalic : more.italic) : bold ? more.bold : more.regular;
    return face === undefined ? undefined : decodeMore(face);
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

/**
 * Whether a character is Chinese, Japanese or Korean, or one of their full-width or half-width forms, which a document
 * grid that snaps to characters puts in cells of their own, where it puts other text in as many cells as it needs
 */
export const isGridCharacter = (character: string): boolean => {
    const code = character.codePointAt(0)!;
    return isWide(code) || isHalfWidth(code);
};

// Marks, which go on the character before them, and characters that only change how the text around them is laid out
export const takesNoRoom = (character: string): boolean => /[\p{Mn}\p{Me}\p{Cf}]/u.test(character);

/**
 * The width of a character in thousandths of an em, from the tables, and those of Hebrew, the Arabic-Indic and Devanagari
 * digits, Thai, box drawing, shapes, symbols and dingbats (`more`), which Word draws in the font, or in another when the
 * font doesn't have them, such as Calibri's Thai in Tahoma, its Devanagari digits in Mangal and its ★ in Segoe UI Symbol
 * (scripts/layout-probes/stops2/word-stops-more-widths.ts).
 * Characters that aren't in them are as wide as an average lowercase letter, a whole em for wide characters and half an
 * em for half-width ones, and marks take no space. So are those the tables have, but whose width in the font isn't known.
 */
const characterWidth = (widths: readonly (number | undefined)[], more: MoreFace | undefined, character: string): number => {
    const code = character.codePointAt(0)!;
    const index = CHARACTER_INDEX.get(code);
    const moreIndex = MORE_CHARACTER_INDEX.get(code);
    const width = index !== undefined ? widths[index] : moreIndex !== undefined ? more?.widths[moreIndex] : undefined;
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

/** Whether text is kerned: with kerning on (`w:kern`), and at its size or larger, as Word kerns it (word-fonts.docx F3) */
export const isKerned = ({ kerning, size = DEFAULT_FONT_SIZE }: TextFont): boolean => kerning !== undefined && size >= kerning;

const lineSizeOf = (font: TextFont): number => font.lineSize ?? sizeOf(font);

/**
 * How a font's characters are measured: an East Asian font's Latin letters with the widths of the font in the table they
 * are measured as, or all of a monospaced one's as half an em or an em, and other fonts with their own widths, or those of
 * the most similar font in the table
 */
const measuresOf = (
    font: TextFont,
): FaceWidths & { readonly more: MoreFace | undefined; readonly arabic: ArabicFace | undefined; readonly monospaced: boolean } => {
    const eastAsian = eastAsianFontOf(font.font ?? DEFAULT_FONT);
    const measured = { ...font, font: eastAsian?.latin ?? font.font };
    return {
        ...faceOf(measured),
        more: moreFaceOf(measured),
        arabic: eastAsian === undefined ? arabicFaceOf(widthsOf(measured.font).name, font.bold === true, font.italic === true) : undefined,
        monospaced: eastAsian?.monospaced === true,
    };
};

/**
 * The widths of the letters of text Word joins, Arabic's, by the index of each among its characters, in the forms Word
 * joins them in, where its face's are known (see `arabic-shaping.ts`)
 */
const joinedIn = (characters: readonly string[], arabic: ArabicFace | undefined): ReadonlyMap<number, number> | undefined =>
    arabic !== undefined && characters.some(isJoinedLetter) ? joinedWidthsOf(characters, arabic) : undefined;

/**
 * The first character of text whose width in its font isn't known, so isn't what Word lays out: one of the tables'
 * characters that Word draws in a font whose widths the tables don't have when the font doesn't have it, such as Cambria
 * Math, or in one whose line gap could make the line taller, such as Arial, or whose width Word's PDFs don't show, such as
 * Hebrew and the symbols in the italics of Office's other fonts, Arabic and Devanagari, whose letters Word joins into
 * forms of other widths, the Devanagari digits of Cambria and Times New Roman, which Word draws in Kohinoor Devanagari,
 * whose lines' height isn't known, and a symbol font's own character. Undefined when the widths of all of them are known, or are measured as before: those of
 * characters the tables don't have, as an average letter.
 */
export const unknownCharacter = (text: string, font: TextFont = {}): string | undefined => {
    const { widths, more, arabic, monospaced } = measuresOf(font);
    // Arabic's letters in its fonts' forms, but spaced out, which Word hasn't been seen doing with joined letters
    const joined = arabic !== undefined && (font.characterSpacing ?? 0) === 0;
    return [...text].find((character) => {
        const code = character.codePointAt(0)!;
        const index = CHARACTER_INDEX.get(code);
        const moreIndex = MORE_CHARACTER_INDEX.get(code);
        if (isJoinedLetter(character) && !monospaced) {
            return !joined;
        }
        if (monospaced || (index === undefined && moreIndex === undefined)) {
            return isPrivate(code) || (!monospaced && JOINED_SCRIPT.test(character) && !takesNoRoom(character));
        }
        return index === undefined ? more?.widths[moreIndex!] === undefined : widths[index] === undefined;
    });
};

/**
 * How tall a line of text is, in points, and how far it goes below its baseline, where Word draws some of its characters
 * in another font, which makes room for them above and below the baseline as far as it goes: the tallest ascent and
 * deepest descent of the fonts its characters are drawn in. A line of Thai in Calibri 11 is Tahoma's, 265.5 twips, where
 * Calibri's are 268.55, and spaces take no part (`word-stops-thai.docx` TH1, `word-stops-more-widths.docx`: lines of
 * Calibri's ★ and the like in Segoe UI Symbol 10 are 266 twips apart, and 269.6 from a line with Calibri's letters on it).
 * A line of Gill Sans MT 11 with a Д, which Word draws in Calibri, is as tall as Calibri's, 268.3 twips where Gill Sans
 * MT's are 255.5 (`word-stops-office-fonts.docx` FB2a). Undefined for text Word draws all in its own font, as in the tables.
 */
export const measureTextHeight = (
    text: string,
    font: TextFont = {},
): { readonly lineHeight: number; readonly descent: number } | undefined => {
    const { fallbacks, more, monospaced } = measuresOf(font);
    if (monospaced || font.lineSize !== undefined) {
        return undefined;
    }
    const size = sizeOf(font);
    const own = { ascent: measureLineHeight(font) - measureDescent(font), descent: measureDescent(font) };
    const heights = [...text]
        .filter((character) => !/\s/u.test(character) && !takesNoRoom(character))
        .map((character) => {
            const code = character.codePointAt(0)!;
            const index = CHARACTER_INDEX.get(code);
            const fallback = index === undefined ? undefined : fallbacks[index];
            if (fallback !== undefined) {
                // A face of the tables, whose line is above the baseline but for its descent
                const face = widthsOf(FALLBACK_FACES[fallback].font);
                return { ascent: ((face.lineHeight - face.descent) * size) / 1000, descent: (face.descent * size) / 1000 };
            }
            const moreIndex = MORE_CHARACTER_INDEX.get(code);
            const other = moreIndex === undefined ? undefined : more?.fonts[moreIndex];
            return other === undefined
                ? own
                : { ascent: (FALLBACK_FONTS[other].ascent * size) / 1000, descent: (FALLBACK_FONTS[other].descent * size) / 1000 };
        });
    if (heights.every((height) => height === own)) {
        return undefined;
    }
    const ascent = Math.max(...heights.map((height) => height.ascent));
    const descent = Math.max(...heights.map((height) => height.descent));
    return { lineHeight: ascent + descent, descent };
};

/**
 * Whether the tables measure text in a font as another font, as they don't have the font's own widths: a font that isn't
 * in them and isn't made with the same widths as one that is, such as Roboto, which they measure as the most similar
 * font that is. Word draws it with its own widths when it has it, and in another font when it doesn't, such as Cambria
 * on the Mac (`word-watertight-text.docx` TX18), so a layout stops there rather than guessing. The East Asian fonts of
 * the tables are measured as themselves, but for the other characters of those that aren't monospaced, such as Latin
 * letters in Yu Gothic, which are measured as Times New Roman or Arial. Without text, whether the height of a line in the
 * font is another font's.
 */
export const unknownFont = (font: TextFont = {}, text?: string): boolean => {
    const name = font.font ?? DEFAULT_FONT;
    const eastAsian = knownEastAsianFontOf(name);
    if (eastAsian === undefined) {
        return exactWidthsOf(name) === undefined;
    }
    return (
        !eastAsian.monospaced &&
        text !== undefined &&
        [...text].some((character) => {
            const code = character.codePointAt(0)!;
            return !isWide(code) && !isHalfWidth(code) && !takesNoRoom(character);
        })
    );
};

/**
 * How wide a line of text is, in points. Tabs move to the next half inch, counted from the start of the line.
 *
 * @param start - Where the text starts on its line, in points
 */
export const measureTextWidth = (text: string, font: TextFont = {}, start = 0): number => {
    const { widths, more, arabic, monospaced } = measuresOf(font);
    const widthOf = monospaced ? monospacedWidth : (character: string): number => characterWidth(widths, more, character);
    const size = sizeOf(font);
    const { characterSpacing = 0, scale = 100 } = font;
    const characters = [...text];
    const joined = joinedIn(characters, arabic);
    return (
        characters.reduce(
            (position, character, index) =>
                character === "\t"
                    ? (Math.floor(position / TAB_STOP) + 1) * TAB_STOP
                    : position + ((joined?.get(index) ?? widthOf(character)) * size * scale) / 100000 + characterSpacing,
            start,
        ) - start
    );
};

/**
 * How wide a line of text is, in points, as Word draws it: kerned, and with its letters joined into ligatures, when it
 * asks for them, as {@link measureTextWidth} measures it otherwise. The layout measures with it; shapes, whose text isn't
 * kerned, with {@link measureTextWidth}, which leaves the tables of kerning out of their bundle.
 *
 * @param start - Where the text starts on its line, in points
 */
export const measureTextWidthAsDrawn = (text: string, font: TextFont = {}, start = 0): number => {
    const shaping = shapingFor(font);
    if (shaping === undefined) {
        return measureTextWidth(text, font, start);
    }
    // The fonts of the tables, whose kerning and ligatures they have, aren't monospaced East Asian fonts
    const { widths, more } = measuresOf(font);
    const widthOf = (character: string): number => characterWidth(widths, more, character);
    const size = sizeOf(font);
    const { characterSpacing = 0, scale = 100 } = font;
    const kerned = kernedIn(font, shaping);
    return (
        text.split("\t").reduce((position, part, index) => {
            const at = index === 0 ? position : (Math.floor(position / TAB_STOP) + 1) * TAB_STOP;
            const glyphs = glyphsOf(part, font, shaping);
            return glyphs.reduce((total, glyph, glyphIndex) => {
                const next = glyphs[glyphIndex + 1];
                // Kerning a pair it doesn't know is left out, where a layout has stopped at it (`unknownShaping`)
                const kerning = kerned && next !== undefined ? kerningBetween(shaping, glyph, next) || 0 : 0;
                return (
                    total +
                    (((glyph.width ?? widthOf(glyph.text)) + kerning) * size * scale) / 100000 +
                    characterSpacing * [...glyph.text].length
                );
            }, at);
        }, start) - start
    );
};

/**
 * The tables' kerning and ligatures of the face text is in, when it is kerned or has ligatures: those of the fonts of the
 * tables by their own names, as fonts made with the same widths, such as Carlito, kern and join letters as they do
 * themselves
 */
const shapingFor = (font: TextFont): FaceShaping | undefined =>
    isKerned(font) || hasLigatures(font)
        ? shapingOf(named(font.font ?? DEFAULT_FONT)?.name ?? "", font.bold === true, font.italic === true)
        : undefined;

/**
 * Whether Word kerns text: when it asks for kerning, but for text with ligatures in a face whose kerning is only in its
 * font's kern table, such as Trebuchet MS's, which Word kerns without ligatures and not with them, whichever of them it
 * has (scripts/layout-probes/stops2/word-stops-font-kerning.ts K and P, and word-stops-office-fonts.ts KL1: standard,
 * standard and contextual, historical and discretional, and all, in six such fonts, and kerned with none)
 */
const kernedIn = (font: TextFont, shaping: FaceShaping): boolean =>
    isKerned(font) && !(hasLigatures(font) && shaping.notKernedWithLigatures);

/** The glyphs text is drawn in: its characters, joined into ligatures as its font's rules join them */
const glyphsOf = (text: string, font: TextFont, shaping: FaceShaping | undefined): readonly Glyph[] => {
    const rules = shaping !== undefined && hasLigatures(font) ? rulesOf(shaping, font.ligatures!) : undefined;
    return rules === undefined ? [...text].map((character) => ({ text: character })) : joinLetters([...text], rules, shaping!.glyphs);
};

// Two letters next to each other, which a font's ligatures could join
const LETTERS = /\p{L}\p{L}/u;
// A letter of the Latin script
const LATIN_LETTER = /^\p{Script=Latin}$/u;

/**
 * Why the tables don't know how Word kerns text, or joins its letters, when they don't: kerned text in a font whose
 * kerning they don't have, or with a character whose kerning they don't have, and ligatures in a font or of a setting
 * whose ligatures they don't have, or beside a character they haven't seen them beside. The tables have Word's kerning of
 * the characters of Windows-1252, and its ligatures of Word's settings, in the fonts of the tables, but for those of East
 * Asian fonts (scripts/layout-probes/word-kerning.ts), and in Office's other fonts in the tables
 * (scripts/layout-probes/stops2/word-stops-font-kerning.ts). Courier New, of which Word kerned no pair of printable ASCII,
 * and monospaced East Asian fonts, aren't kerned, and nor is text with ligatures in a face Word kerns only without them.
 */
export const unknownShaping = (text: string, font: TextFont = {}): string | undefined => {
    const ligatures = hasLigatures(font);
    if ((!isKerned(font) && !ligatures) || eastAsianFontOf(font.font ?? DEFAULT_FONT)?.monospaced === true) {
        return undefined;
    }
    const shaping = shapingFor(font);
    const kerned = shaping === undefined ? isKerned(font) : kernedIn(font, shaping);
    // The parts between tabs, which are measured apart, so nothing is kerned or joined across a tab. Characters that take
    // no room, such as a zero-width space or a combining mark, are measured as characters of their own, whose kerning,
    // and whether Word kerns and joins the letters beside them across them, isn't known
    const parts = text.split("\t").map((part) => [...part]);
    const characters = parts.flat();
    if (shaping === undefined) {
        return kerned
            ? "kerned text in a font whose kerning isn't known"
            : LETTERS.test(text)
              ? "ligatures in a font whose ligatures aren't known"
              : undefined;
    }
    // A font Word kerns no pair of, as Courier New, which is monospaced, kerns no character
    if (kerned && shaping.pairs.size > 0 && characters.some((character) => !shaping.characters.has(character))) {
        return "kerned text with a character whose kerning isn't known";
    }
    const rules = ligatures ? rulesOf(shaping, font.ligatures!) : undefined;
    if (ligatures && rules === undefined) {
        return LETTERS.test(text) ? "ligatures of a setting not yet followed" : undefined;
    }
    // A character a rule starts with, followed by one the ligatures haven't been seen beside, but for a Latin letter, which
    // Word joins them beside as beside one they have been seen beside: "fi" before "ā" (scripts/layout-probes/stops2/word-stops-kerning.ts
    // KE3)
    if (
        rules !== undefined &&
        parts.some((part) =>
            part.some(
                (character, index) =>
                    rules.has(character) &&
                    part.slice(index + 1, index + 3).some((next) => !shaping.characters.has(next) && !LATIN_LETTER.test(next)),
            ),
        )
    ) {
        return "ligatures beside a character not yet followed";
    }
    return kerned ? parts.map((part) => unknownPairIn(glyphsOf(part.join(""), font, shaping), shaping)).find(Boolean) : undefined;
};

/** Why the kerning of a pair of glyphs isn't known, when one's isn't */
const unknownPairIn = (glyphs: readonly Glyph[], shaping: FaceShaping): string | undefined => {
    const unknownPair = glyphs.findIndex((glyph, index) => index > 0 && Number.isNaN(kerningBetween(shaping, glyphs[index - 1], glyph)));
    if (unknownPair < 0) {
        return undefined;
    }
    // Word's drawing moves some characters, such as a hyphen in Cambria, so the pairs before them aren't known
    return glyphs[unknownPair - 1].width === undefined && glyphs[unknownPair].width === undefined
        ? "kerning of a pair of characters not yet followed"
        : "kerning beside a ligature not yet followed";
};

/**
 * How tall a line of single-spaced text is, in points.
 */
export const measureLineHeight = (font: TextFont = {}): number =>
    ((eastAsianFontOf(font.font ?? DEFAULT_FONT) ?? widthsOf(font.font)).lineHeight * lineSizeOf(font)) / 1000;

/**
 * How far a line of single-spaced text goes below its baseline, in points. The rest of the line is above it, with the
 * font's line gap at the top, where Word puts it: Arial 11 with Courier New 11 is 272.42 twips, Arial's ascent and gap and
 * Courier New's descent (scripts/layout-probes/word-mixed-heights.ts MH2a).
 */
export const measureDescent = (font: TextFont = {}): number =>
    ((eastAsianFontOf(font.font ?? DEFAULT_FONT) ?? widthsOf(font.font)).descent * lineSizeOf(font)) / 1000;

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
