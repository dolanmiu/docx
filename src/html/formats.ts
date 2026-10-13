/**
 * The formatting of runs, paragraphs and borders, from elements' styles.
 *
 * @module
 */
import { AlignmentType, BorderStyle, HighlightColor, type IBorderOptions, LineRuleType, ShadingType, UnderlineType } from "docx";

import type { ParagraphFormat, RunFormat } from "./content";
import type { BorderSide, ComputedStyle, Decoration } from "./css/computed-style";

/** Points in twips, twentieths of a point, which Word's lengths are in */
export const twips = (points: number): number => Math.round(points * 20);

// Word's underlines for text-decoration-style
const UNDERLINES: Readonly<Record<string, (typeof UnderlineType)[keyof typeof UnderlineType]>> = {
    solid: UnderlineType.SINGLE,
    double: UnderlineType.DOUBLE,
    dotted: UnderlineType.DOTTED,
    dashed: UnderlineType.DASH,
    wavy: UnderlineType.WAVE,
};

// Word's highlighter colours, which a background of exactly one of their colours is written as
const HIGHLIGHTS: Readonly<Record<string, (typeof HighlightColor)[keyof typeof HighlightColor]>> = {
    FFFF00: HighlightColor.YELLOW,
    "00FF00": HighlightColor.GREEN,
    "00FFFF": HighlightColor.CYAN,
    FF00FF: HighlightColor.MAGENTA,
    "0000FF": HighlightColor.BLUE,
    FF0000: HighlightColor.RED,
    "000080": HighlightColor.DARK_BLUE,
    "008080": HighlightColor.DARK_CYAN,
    "008000": HighlightColor.DARK_GREEN,
    "800080": HighlightColor.DARK_MAGENTA,
    "800000": HighlightColor.DARK_RED,
    "808000": HighlightColor.DARK_YELLOW,
    "808080": HighlightColor.DARK_GRAY,
    C0C0C0: HighlightColor.LIGHT_GRAY,
    "000000": HighlightColor.BLACK,
    FFFFFF: HighlightColor.WHITE,
};

// Word's borders for CSS's border styles
const BORDERS: Readonly<Record<string, (typeof BorderStyle)[keyof typeof BorderStyle]>> = {
    solid: BorderStyle.SINGLE,
    double: BorderStyle.DOUBLE,
    dotted: BorderStyle.DOTTED,
    dashed: BorderStyle.DASHED,
    groove: BorderStyle.THREE_D_ENGRAVE,
    ridge: BorderStyle.THREE_D_EMBOSS,
    inset: BorderStyle.INSET,
    outset: BorderStyle.OUTSET,
};

/** What a run gets from the inline elements it is in, beyond what they give the style of its text */
export type InlineFormat = {
    /** The background of the inline element it is in, which is behind the text of the elements in it too */
    readonly background?: string;
    /** Whether it is superscript or subscript, or raised or lowered, from the inline element it is in */
    readonly script?: ComputedStyle["verticalAlign"];
    /** The Word character style it is in, such as Hyperlink */
    readonly characterStyle?: string;
    /** Whether the CSS of the link it is in takes the underline off, which the Hyperlink style has */
    readonly removeUnderline?: boolean;
};

const underlineOf = ({ style, color }: Decoration): RunFormat["underline"] => ({ type: UNDERLINES[style], ...(color ? { color } : {}) });

/**
 * The formatting of a run: what the HTML says about its text, and nothing else, so the Word document's styles decide
 * the rest.
 */
export const runFormatOf = (style: ComputedStyle, { background, script, characterStyle, removeUnderline }: InlineFormat): RunFormat => {
    const { underline, lineThrough } = style.decorations;
    const highlight = background === undefined ? undefined : HIGHLIGHTS[background];
    const format: RunFormat = {
        style: characterStyle,
        bold: style.bold,
        italics: style.italic,
        color: style.color,
        size: style.fontSize === undefined ? undefined : Math.max(Math.round(style.fontSize * 2), 2),
        font: style.fontFamily,
        underline: underline ? underlineOf(underline) : removeUnderline ? { type: UnderlineType.NONE } : undefined,
        strike: lineThrough && lineThrough.style !== "double" ? true : undefined,
        doubleStrike: lineThrough?.style === "double" ? true : undefined,
        smallCaps: style.smallCaps,
        allCaps: style.textTransform === "uppercase" ? true : undefined,
        superScript: script === "super" ? true : undefined,
        subScript: script === "sub" ? true : undefined,
        position: typeof script === "object" && script.raise !== 0 ? `${Math.round(script.raise * 2) / 2}pt` : undefined,
        characterSpacing: style.letterSpacing ? twips(style.letterSpacing) : undefined,
        rightToLeft: style.direction === "rtl" ? true : undefined,
        language: style.language ? { value: style.language } : undefined,
        highlight,
        shading:
            background !== undefined && highlight === undefined ? { type: ShadingType.CLEAR, fill: background, color: "auto" } : undefined,
    };
    return Object.fromEntries(Object.entries(format).filter(([, value]) => value !== undefined)) as RunFormat;
};

/** A border side as Word has it: its width in eighths of a point, from 2 to 96, and the space inside it in points */
export const borderOf = ({ style, width, color }: BorderSide, padding = 0): IBorderOptions => ({
    style: BORDERS[style],
    size: Math.min(Math.max(Math.round(width * 8), 2), 96),
    color,
    space: Math.min(Math.round(padding), 31),
});

const ALIGNMENTS: Readonly<Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]>> = {
    left: AlignmentType.LEFT,
    right: AlignmentType.RIGHT,
    center: AlignmentType.CENTER,
    justify: AlignmentType.JUSTIFIED,
    start: AlignmentType.START,
    end: AlignmentType.END,
};

/** What a paragraph gets from the blocks it is in */
export type Flow = {
    /** How far the blocks it is in indent it from the left and the right, in points */
    readonly indentLeft: number;
    readonly indentRight: number;
    /** The background of the block it is in */
    readonly background?: string;
    /** The borders of the block it is in, which Word draws around the paragraphs next to each other that have them */
    readonly borders?: ParagraphFormat["border"];
    /** How deep in lists it is, when it is in a list's item, which it is indented to the text of */
    readonly listDepth?: number;
};

/** A paragraph's line spacing. A multiple is of a browser's normal line height, 1.2 times the font size, as Word's single spacing is about the same */
const lineSpacingOf = (lineHeight: NonNullable<ComputedStyle["lineHeight"]>): ParagraphFormat["spacing"] => {
    if ("points" in lineHeight) {
        return { line: twips(lineHeight.points), lineRule: LineRuleType.AT_LEAST };
    }
    // Word's lines are 240ths of its single spacing
    return {
        line: Math.round("lines" in lineHeight ? 240 * lineHeight.lines : (240 * lineHeight.multiple) / 1.2),
        lineRule: LineRuleType.AUTO,
    };
};

/**
 * The formatting of a paragraph of a block: its alignment, its indents from the blocks it is in, its first line's
 * indent, its line spacing, background, borders and direction.
 *
 * @param style - The block's style
 * @param flow - What the paragraph gets from the blocks it is in, the block's own included
 * @param listIndent - The indent of a list's text at the paragraph's depth, in twips
 */
export const paragraphFormatOf = (style: ComputedStyle, flow: Flow, listIndent: number): ParagraphFormat => {
    const left = twips(flow.indentLeft) + listIndent;
    const right = twips(flow.indentRight);
    const textIndent = style.textIndent === undefined ? 0 : twips(style.textIndent);
    const indent = {
        ...(left !== 0 ? { left } : {}),
        ...(right !== 0 ? { right } : {}),
        ...(textIndent > 0 ? { firstLine: textIndent } : textIndent < 0 ? { hanging: -textIndent } : {}),
    };
    const format: ParagraphFormat = {
        alignment: style.textAlign && ALIGNMENTS[style.textAlign],
        indent: Object.keys(indent).length > 0 ? indent : undefined,
        spacing: style.lineHeight && lineSpacingOf(style.lineHeight),
        shading: flow.background === undefined ? undefined : { type: ShadingType.CLEAR, fill: flow.background, color: "auto" },
        border: flow.borders,
        bidirectional: style.direction === "rtl" ? true : undefined,
        keepLines: style.breakInside === "avoid" ? true : undefined,
    };
    return Object.fromEntries(Object.entries(format).filter(([, value]) => value !== undefined)) as ParagraphFormat;
};
