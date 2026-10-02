// Probes of how Word lays out text around floating drawings and tables, where docx/layout stops at "a drawing that text
// flows around" and "a table that text flows around". Each probe starts a page, its first line names it ("F1 above"), and
// the paragraph a drawing is anchored in starts with the probe's name too, so word-floats.py can find each probe's page
// in pdftotext's HTML of a PDF saved from Word, and the drawings on it in pdftocairo's SVG. Calibri 11, single spaced, no
// space before or after, on A4 with 1440 margins: 9026 twips of text, lines of 268.55 twips. The paragraphs that wrap are
// justified, so each of their lines but the last ends where the room beside a drawing does. Each drawing is a grey
// picture of a size of its own, so it can be told from the others in the PDF. Lengths are in twips.
//
// Square wrapping, beside a drawing 2880 wide and 1440 tall, anchored at the start of a paragraph of prose:
// F1:  at the right of the margins, 0 below the paragraph's top: which lines are narrowed, and to what
// F2:  the same at the left of the margins
// F3:  at the right, 1584 below the paragraph's top, 288 from the text above and below and 180 beside: whether those
//      distances count, which lines 4 and 12 show (the first starts 1074 down, the last ends 3491 down)
// F4a: at the right, 1328 tall: 5 lines narrowed, by the plain overlap of the line with the drawing
// F4b: the same, 1358 tall: 6 lines
// Top and bottom wrapping:
// F5:  2880 by 1440 at the left, 0 below the paragraph's top: whether the paragraph's first line goes below it
// F6:  1584 below the paragraph's top, 288 from the text above and below: which lines go below it
// F7:  720 by 1440, all of it in the page's right margin: whether lines still go below it
// F8:  the same with square wrapping: whether lines beside it are narrowed
// Both sides, and which side:
// F9:  square, both sides, centred: whether a line beside it has text on both sides, the left first
// F10: square, the largest side, 2700 from the left of the margins: text only on the right, which is larger
// F11: square, the left side only, centred
// F12: square, the right side only, centred
// F13: square, both sides, 1440 by 720, with 180, 360, 540, 720, 1080 and 1440 left of it, in 6 paragraphs: the least
//      room Word puts text in, on the left
// F14: the same with the room on the right
// Where a drawing is, from the paragraph, the line and the page:
// F15: square at the right, 0 below the top of a paragraph with 480 before: whether the drawing's top is above the space
//      before or below it
// F16: square at the right, anchored after 40 words, 0 below its line's top: which line that is
// F17: square at the right, 7200 below the page's top, anchored at the start of the page: the lines it is beside
// F18: square at the right, 2160 below the page's top, anchored in the 8th paragraph of 20 words, below it: whether the
//      paragraphs before its anchor go round it
// F19: square at the right, at the bottom of the margins, anchored at the start of the page
// F20: square at the right, 2880 by 2880, 0 below the top of a paragraph 7 lines from the bottom of the page, past which it
//      would go: where Word puts the drawing, and the paragraph's lines
// F21: drawings that text doesn't wrap around, placed across the page by each horizontal setting, to check where each is
// F22: the same, placed down the page by each vertical setting
// Tight and through wrapping, with docx's wrap polygon, the drawing's own rectangle:
// F23: tight, as F3: whether the distances above and below count, as they don't for tight wrapping
// F24: through, the same
// Floating tables (w:tblpPr):
// F25: a table 3000 wide at the right of the margins, 0 below the text after it, 200 from the text beside and below it
// F26: a table at the left, 7200 below the page's top, written after a line at the top of the page
// F27: a table centred: whether text goes on both sides of it
// More:
// F28: square at the right, 2880 by 4320, anchored in a paragraph of 2 lines, then 5 short paragraphs with 200 after each:
//      whether those after it go round it, with their spacing as without it
// F29a: a paragraph of only a square drawing at the right, then prose: where its mark's line is
// F29b: a paragraph of only a top and bottom drawing, then prose
// F30a: square at the left, 1440 wide, beside a paragraph indented 720: whether its text starts at 1440 or 2160
// F30b: the same indented 2880, past the drawing
// F30c: the same with a first line indented 720
// F30d: square at the right, 1440 wide, beside a paragraph indented 720 from the right
// F31: square at the right of the first of 2 columns: whether the second column's lines are narrowed
// F32: square, both sides, centred across 2 columns: each column's lines beside it
// F33: square, 9026 wide, as wide as the text: whether lines go below it, as with top and bottom wrapping
// F34: square at the left, 0 below the paragraph's top, and square at the right, 720 below it: lines between both
// F35: square at the right, 1440 above the top of a paragraph 15 lines down the page: whether the lines above its paragraph
//      go round it
// F36: top and bottom, 1440 tall, 0 below the top of a paragraph 5 lines from the bottom of the page: where the drawing
//      and the paragraph go
// F37: top and bottom, 0 below the top of a paragraph with 480 before: where the drawing and the paragraph's first line go
// F38a: square at the right, 2880 by 1440 turned 20 degrees, as docx writes a turned picture, with no effect extent: what
//      Word wraps the text around
// F38b: the same as a docx/shapes rectangle, which writes the turned shape's reach as its effect extent
// F38c: square at the right, 2880 by 1440, with an effect extent of 360 on each side: whether the text wraps around it
// F39: a docx/shapes rectangle 25% of the width between the margins, 50% across them, on a page with margins of 2880
//      left and right: whether Word places and sizes it by the percentages, rather than the offset and size docx writes
//      for an A4 page with 1440 margins
// F40: square at the right, 2880 by 2880, anchored in a paragraph of 2 lines, then a table as wide as the text: whether
//      the table goes beside the drawing or below it
//
// What Word showed, in word-floats.pdf, saved from Word 16 for Mac on 2026-10-02 and read with word-floats.py:
//
// - F1 to F4, F23, F24, F34: a line is beside a drawing when they overlap at all, with the drawing's distances from the text
//   (F3's lines 4 and 12), and its room ends at the drawing's edge, less its distance. Tight and through wrapping, with
//   docx's wrap polygon, the drawing's own rectangle, are square wrapping, and their distances above and below count too
// - F5, F6, F33, F37: with top and bottom wrapping, or square wrapping as wide as the text, a line beside the drawing goes
//   below it. A paragraph's first line goes below it with the paragraph's space before above it: F37's 480 is between
//   the drawing and its first line
// - F7, F8: a drawing in the page's margin, where no text is, leaves the lines as they are, with any wrapping
// - F9 to F12: text goes on both sides of a drawing, the left first, or on the side its wrapping says, or the larger
// - F13, F14: Word puts as many words in the room beside a drawing as fit there, however narrow: "of", 183 twips wide, goes
//   in 360 and not in 180. A room the next word doesn't fit in is left empty. A single word right of a drawing in a
//   justified paragraph is set at the end of its room
// - F15, F22: a drawing placed against its paragraph is at the top of the paragraph's space before
// - F16: one placed against its line is at the line its anchor was on before the text went round it: the second line,
//   though the text going round the drawing moved the anchor on to the third
// - F17 to F19, F35: the text before a drawing's paragraph on its page goes round it too
// - F20, F36: a paragraph whose drawing would go past the bottom of the page's text, or whose first line doesn't fit below
//   its drawing, moves to the next page with it. LibreOffice moves the drawing up instead
// - F21, F22: drawings are placed against each setting as the standard says. The inside margin is the left and the top one
//   on odd pages, and the right and the bottom one on even pages, without mirrored margins
// - F25 to F27: a floating table takes text round it as a drawing with square wrapping does, on both sides when centred
// - F28, F29: paragraphs beside a drawing keep their spacing, and an empty paragraph takes a line beside it, or below one
//   with top and bottom wrapping
// - F30: a line beside a drawing starts at its edge or the left indent, whichever is further in, and a first line indent is
//   added to that: 720 beside a drawing 1470 wide starts the first line at 2190
// - F31, F32: in columns, a drawing narrows the lines of each column it is beside
// - F38: a turned picture without an effect extent wraps the text around its box before it is turned. An effect extent
//   counts, lined up with the margin when the drawing is, and a drawing that would go above the page's text with it goes
//   down to it
// - F39: Word places and sizes a docx/shapes shape by its percentages
// - F40: a table as wide as the text goes below a drawing
//
// Usage: npm run run-ts -- scripts/layout-probes/word-floats.ts, which writes build/word-probes/word-floats.docx
// cspell:ignore pdftocairo
import * as fs from "fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Column,
    Document,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    type IFloating,
    type ISectionOptions,
    ImageRun,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    Table,
    TableAnchorType,
    TableCell,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";
import { ShapeRun } from "docx/shapes";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Wrap = NonNullable<IFloating["wrap"]>;

// EMUs in a twip, and pixels, which docx sizes pictures in
const EMUS = 635;
const PIXELS = 1 / 15;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A grey PNG of one pixel, drawn at any size */
const pixel = (): Buffer => {
    const crc = (bytes: Buffer): number => {
        let value = ~0;
        for (const byte of bytes) {
            value ^= byte;
            for (let bit = 0; bit < 8; bit++) {
                value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
            }
        }
        return ~value >>> 0;
    };
    const chunk = (type: string, data: Buffer): Buffer => {
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const check = Buffer.alloc(4);
        check.writeUInt32BE(crc(body));
        return Buffer.concat([length, body, check]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(1, 0);
    header.writeUInt32BE(1, 4);
    header.set([8, 0, 0, 0, 0], 8);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", header),
        chunk("IDAT", deflateSync(Buffer.from([0, 0x80]))),
        chunk("IEND", Buffer.alloc(0)),
    ]);
};
const PIXEL = pixel();

type Place = {
    readonly width: number;
    readonly height: number;
    readonly h: IFloating["horizontalPosition"];
    readonly v: IFloating["verticalPosition"];
    readonly wrap?: Wrap;
    /** The distances from the text: above, below, left and right */
    readonly distances?: readonly [number, number, number, number];
};

/** A floating picture of a size, in twips, placed and wrapped as given, with its offsets in twips, turned by degrees */
const drawing = ({ width, height, h, v, wrap, distances = [0, 0, 0, 0] }: Place, rotation?: number): ImageRun => {
    const [top, bottom, left, right] = distances.map((distance) => distance * EMUS);
    return new ImageRun({
        type: "png",
        data: PIXEL,
        transformation: { width: width * PIXELS, height: height * PIXELS, ...(rotation === undefined ? {} : { rotation }) },
        floating: {
            horizontalPosition: h.offset === undefined ? h : { ...h, offset: h.offset * EMUS },
            verticalPosition: v.offset === undefined ? v : { ...v, offset: v.offset * EMUS },
            ...(wrap ? { wrap } : {}),
            margins: { top, bottom, left, right },
        },
    });
};

const SQUARE: Wrap = { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES };
const TOP_AND_BOTTOM: Wrap = { type: TextWrappingType.TOP_AND_BOTTOM };
const MARGIN_RIGHT = { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT } as const;
const MARGIN_LEFT = { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.LEFT } as const;
const MARGIN_CENTER = { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.CENTER } as const;
const fromMargin = (offset: number): IFloating["horizontalPosition"] => ({ relative: HorizontalPositionRelativeFrom.MARGIN, offset });
const belowParagraph = (offset: number): IFloating["verticalPosition"] => ({ relative: VerticalPositionRelativeFrom.PARAGRAPH, offset });

/** A justified paragraph of prose, starting with its probe's name, with what is given before its text */
const anchored = (probe: string, words: number, before: readonly ImageRun[], options: Options = {}): Paragraph =>
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, ...options, children: [...before, new TextRun(`${probe} ${prose(words)}`)] });

/** A probe: its line at the top of its page, then what is given */
const probe = (
    name: string,
    children: readonly (Paragraph | Table)[],
    properties: ISectionOptions["properties"] = {},
): ISectionOptions => ({
    properties,
    children: [line(`${name} above`), ...children],
});

/** A floating picture of a size of its own, which doesn't wrap, for F21 and F22 */
const placed = (size: number, h: IFloating["horizontalPosition"], v: IFloating["verticalPosition"]): ImageRun =>
    drawing({ width: size, height: size, h, v, wrap: { type: TextWrappingType.NONE } });

const PARAGRAPH_TOP = belowParagraph(0);

const borders = {
    top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
};
const floatingTable = (name: string, float: ConstructorParameters<typeof Table>[0]["float"]): Table =>
    new Table({
        width: { size: 3000, type: WidthType.DXA },
        columnWidths: [3000],
        borders,
        float,
        rows: Array.from(
            { length: 6 },
            (_, i) =>
                new TableRow({
                    children: [new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [line(`${name} cell ${i + 1}`)] })],
                }),
        ),
    });

const TWO_COLUMNS = { column: { count: 2, space: 720 } };

// F38c's picture, by its width in EMUs, and the effect extent written for it in place of docx's
const EFFECT_WIDTH = 2865 * EMUS;
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [
        new RegExp(`(<wp:extent cx="${EFFECT_WIDTH}" cy="\\d+"/>)<wp:effectExtent [^/]*/>`),
        `$1<wp:effectExtent l="${360 * EMUS}" t="${360 * EMUS}" r="${360 * EMUS}" b="${360 * EMUS}"/>`,
    ],
];

const sections: ISectionOptions[] = [
    probe("F1", [anchored("F1", 260, [drawing({ width: 2880, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe("F2", [anchored("F2", 260, [drawing({ width: 2895, height: 1455, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe("F3", [
        anchored("F3", 260, [
            drawing({ width: 2910, height: 1440, h: MARGIN_RIGHT, v: belowParagraph(1584), wrap: SQUARE, distances: [288, 288, 180, 180] }),
        ]),
    ]),
    probe("F4a", [anchored("F4a", 260, [drawing({ width: 2925, height: 1328, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe("F4b", [anchored("F4b", 260, [drawing({ width: 2940, height: 1358, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),

    probe("F5", [anchored("F5", 260, [drawing({ width: 2955, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })])]),
    probe("F6", [
        anchored("F6", 260, [
            drawing({
                width: 2970,
                height: 1440,
                h: MARGIN_LEFT,
                v: belowParagraph(1584),
                wrap: TOP_AND_BOTTOM,
                distances: [288, 288, 0, 0],
            }),
        ]),
    ]),
    probe("F7", [
        anchored("F7", 260, [
            drawing({
                width: 720,
                height: 1440,
                h: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 10620 },
                v: PARAGRAPH_TOP,
                wrap: TOP_AND_BOTTOM,
            }),
        ]),
    ]),
    probe("F8", [
        anchored("F8", 260, [
            drawing({
                width: 735,
                height: 1440,
                h: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 10620 },
                v: PARAGRAPH_TOP,
                wrap: SQUARE,
            }),
        ]),
    ]),

    probe("F9", [anchored("F9", 260, [drawing({ width: 2985, height: 1440, h: MARGIN_CENTER, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe("F10", [
        anchored("F10", 260, [
            drawing({
                width: 3000,
                height: 1440,
                h: fromMargin(2700),
                v: PARAGRAPH_TOP,
                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LARGEST },
            }),
        ]),
    ]),
    probe("F11", [
        anchored("F11", 260, [
            drawing({
                width: 3015,
                height: 1440,
                h: MARGIN_CENTER,
                v: PARAGRAPH_TOP,
                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
            }),
        ]),
    ]),
    probe("F12", [
        anchored("F12", 260, [
            drawing({
                width: 3030,
                height: 1440,
                h: MARGIN_CENTER,
                v: PARAGRAPH_TOP,
                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.RIGHT },
            }),
        ]),
    ]),
    probe(
        "F13",
        [180, 360, 540, 720, 1080, 1440].map((room, i) =>
            anchored(
                `F13${"abcdef"[i]}`,
                60,
                [drawing({ width: 1440 + i * 15, height: 720, h: fromMargin(room), v: PARAGRAPH_TOP, wrap: SQUARE })],
                {
                    spacing: { after: 240 },
                },
            ),
        ),
    ),
    probe(
        "F14",
        [180, 360, 540, 720, 1080, 1440].map((room, i) =>
            anchored(
                `F14${"abcdef"[i]}`,
                60,
                [
                    drawing({
                        width: 1530 + i * 15,
                        height: 720,
                        h: fromMargin(9026 - room - (1530 + i * 15)),
                        v: PARAGRAPH_TOP,
                        wrap: SQUARE,
                    }),
                ],
                { spacing: { after: 240 } },
            ),
        ),
    ),

    probe("F15", [
        anchored("F15", 260, [drawing({ width: 3045, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            spacing: { before: 480 },
        }),
    ]),
    probe("F16", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun(`F16 ${prose(40)}`),
                drawing({
                    width: 3060,
                    height: 1440,
                    h: MARGIN_RIGHT,
                    v: { relative: VerticalPositionRelativeFrom.LINE, offset: 0 },
                    wrap: SQUARE,
                }),
                new TextRun(` anchor ${prose(220)}`),
            ],
        }),
    ]),
    probe("F17", [
        anchored("F17", 620, [
            drawing({
                width: 3075,
                height: 1440,
                h: MARGIN_RIGHT,
                v: { relative: VerticalPositionRelativeFrom.PAGE, offset: 7200 },
                wrap: SQUARE,
            }),
        ]),
    ]),
    probe("F18", [
        ...Array.from({ length: 7 }, (_, i) => anchored(`F18p${i + 1}`, 20, [])),
        anchored("F18p8", 20, [
            drawing({
                width: 3090,
                height: 1440,
                h: MARGIN_RIGHT,
                v: { relative: VerticalPositionRelativeFrom.PAGE, offset: 2160 },
                wrap: SQUARE,
            }),
        ]),
        ...Array.from({ length: 12 }, (_, i) => anchored(`F18p${i + 9}`, 20, [])),
    ]),
    probe("F19", [
        anchored("F19", 620, [
            drawing({
                width: 3105,
                height: 1440,
                h: MARGIN_RIGHT,
                v: { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.BOTTOM },
                wrap: SQUARE,
            }),
        ]),
    ]),
    probe("F20", [
        ...fill("F20", 43),
        anchored("F20", 120, [drawing({ width: 2880, height: 2880, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
        ...fill("F20 after", 5),
    ]),

    // F21: across the page, each 1 to 11 below the paragraph's top, in sizes of 300, 330, 360 and on
    probe("F21", [
        new Paragraph({
            children: [
                new TextRun("F21 anchor"),
                ...(
                    [
                        { relative: HorizontalPositionRelativeFrom.MARGIN, offset: 720 },
                        { relative: HorizontalPositionRelativeFrom.PAGE, offset: 720 },
                        { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 720 },
                        { relative: HorizontalPositionRelativeFrom.CHARACTER, offset: 0 },
                        { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.CENTER },
                        { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT },
                        { relative: HorizontalPositionRelativeFrom.PAGE, align: HorizontalPositionAlign.RIGHT },
                        { relative: HorizontalPositionRelativeFrom.LEFT_MARGIN, align: HorizontalPositionAlign.CENTER },
                        { relative: HorizontalPositionRelativeFrom.RIGHT_MARGIN, align: HorizontalPositionAlign.LEFT },
                        { relative: HorizontalPositionRelativeFrom.INSIDE_MARGIN, align: HorizontalPositionAlign.LEFT },
                        { relative: HorizontalPositionRelativeFrom.OUTSIDE_MARGIN, align: HorizontalPositionAlign.RIGHT },
                        { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.INSIDE },
                        { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.OUTSIDE },
                    ] as const
                ).map((h, i) => placed(300 + i * 30, h, belowParagraph(600 + i * 900))),
                new TextRun(" after"),
            ],
        }),
    ]),
    // F22: down the page, each across the page from its left by 1000 more, in sizes of 600, 630 and on
    probe("F22", [
        line("F22 two"),
        new Paragraph({
            spacing: { before: 480 },
            children: [
                new TextRun(`F22 anchor ${prose(40)}`),
                ...(
                    [
                        { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                        { relative: VerticalPositionRelativeFrom.LINE, offset: 0 },
                        { relative: VerticalPositionRelativeFrom.PAGE, offset: 720 },
                        { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.CENTER },
                        { relative: VerticalPositionRelativeFrom.TOP_MARGIN, align: VerticalPositionAlign.CENTER },
                        { relative: VerticalPositionRelativeFrom.BOTTOM_MARGIN, align: VerticalPositionAlign.TOP },
                        { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.BOTTOM },
                        { relative: VerticalPositionRelativeFrom.PAGE, align: VerticalPositionAlign.BOTTOM },
                        { relative: VerticalPositionRelativeFrom.INSIDE_MARGIN, align: VerticalPositionAlign.TOP },
                        { relative: VerticalPositionRelativeFrom.OUTSIDE_MARGIN, align: VerticalPositionAlign.TOP },
                        { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.INSIDE },
                        { relative: VerticalPositionRelativeFrom.PARAGRAPH, align: VerticalPositionAlign.TOP },
                        { relative: VerticalPositionRelativeFrom.LINE, align: VerticalPositionAlign.BOTTOM },
                    ] as const
                ).map((v, i) => placed(600 + i * 30, fromMargin(i * 640), v)),
                new TextRun(` after ${prose(40)}`),
            ],
        }),
    ]),

    probe("F23", [
        anchored("F23", 260, [
            drawing({
                width: 3120,
                height: 1440,
                h: MARGIN_RIGHT,
                v: belowParagraph(1584),
                wrap: { type: TextWrappingType.TIGHT, side: TextWrappingSide.BOTH_SIDES },
                distances: [288, 288, 180, 180],
            }),
        ]),
    ]),
    probe("F24", [
        anchored("F24", 260, [
            drawing({
                width: 3135,
                height: 1440,
                h: MARGIN_RIGHT,
                v: belowParagraph(1584),
                wrap: { type: TextWrappingType.THROUGH, side: TextWrappingSide.BOTH_SIDES },
                distances: [288, 288, 180, 180],
            }),
        ]),
    ]),

    probe("F25", [
        floatingTable("F25", {
            horizontalAnchor: TableAnchorType.MARGIN,
            relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
            verticalAnchor: TableAnchorType.TEXT,
            absoluteVerticalPosition: 0,
            leftFromText: 200,
            bottomFromText: 200,
        }),
        anchored("F25", 260, []),
    ]),
    probe("F26", [
        floatingTable("F26", {
            horizontalAnchor: TableAnchorType.MARGIN,
            relativeHorizontalPosition: RelativeHorizontalPosition.LEFT,
            verticalAnchor: TableAnchorType.PAGE,
            absoluteVerticalPosition: 7200,
            rightFromText: 200,
            bottomFromText: 200,
        }),
        anchored("F26", 620, []),
    ]),
    probe("F27", [
        floatingTable("F27", {
            horizontalAnchor: TableAnchorType.MARGIN,
            relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
            verticalAnchor: TableAnchorType.TEXT,
            absoluteVerticalPosition: 0,
            leftFromText: 200,
            rightFromText: 200,
            bottomFromText: 200,
        }),
        anchored("F27", 260, []),
    ]),

    probe("F28", [
        anchored("F28", 25, [drawing({ width: 2880, height: 4320, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            spacing: { after: 200 },
        }),
        ...Array.from({ length: 5 }, (_, i) => anchored(`F28p${i + 2}`, 20, [], { spacing: { after: 200 } })),
        anchored("F28 last", 200, []),
    ]),
    probe("F29a", [
        new Paragraph({ children: [drawing({ width: 3150, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })] }),
        anchored("F29a", 260, []),
    ]),
    probe("F29b", [
        new Paragraph({ children: [drawing({ width: 3165, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })] }),
        anchored("F29b", 260, []),
    ]),
    probe("F30a", [
        anchored("F30a", 120, [drawing({ width: 1440, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            indent: { left: 720 },
        }),
    ]),
    probe("F30b", [
        anchored("F30b", 120, [drawing({ width: 1455, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            indent: { left: 2880 },
        }),
    ]),
    probe("F30c", [
        anchored("F30c", 120, [drawing({ width: 1470, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            indent: { firstLine: 720 },
        }),
    ]),
    probe("F30d", [
        anchored("F30d", 120, [drawing({ width: 1485, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            indent: { right: 720 },
        }),
    ]),
    probe(
        "F31",
        [
            anchored("F31", 300, [
                drawing({
                    width: 1500,
                    height: 1440,
                    h: { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.RIGHT },
                    v: PARAGRAPH_TOP,
                    wrap: SQUARE,
                }),
            ]),
            line("F31 last"),
        ],
        TWO_COLUMNS,
    ),
    probe(
        "F32",
        [
            new Paragraph({
                children: [
                    new TextRun("F32 drawing"),
                    drawing({ width: 2880, height: 1440, h: MARGIN_CENTER, v: belowParagraph(600), wrap: SQUARE }),
                ],
            }),
            ...Array.from({ length: 70 }, (_, i) => line(`F32 line ${i + 1}`)),
        ],
        TWO_COLUMNS,
    ),
    probe("F33", [anchored("F33", 260, [drawing({ width: 9026, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe("F34", [
        anchored("F34", 260, [
            drawing({ width: 2880, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE }),
            drawing({ width: 2895, height: 1440, h: MARGIN_RIGHT, v: belowParagraph(720), wrap: SQUARE }),
        ]),
    ]),
    probe("F35", [
        ...Array.from({ length: 7 }, (_, i) => anchored(`F35p${i + 1}`, 20, [])),
        anchored("F35p8", 20, [drawing({ width: 3180, height: 1440, h: MARGIN_RIGHT, v: belowParagraph(-1440), wrap: SQUARE })]),
        ...Array.from({ length: 12 }, (_, i) => anchored(`F35p${i + 9}`, 20, [])),
    ]),
    probe("F36", [
        ...fill("F36", 45),
        anchored("F36", 120, [drawing({ width: 3195, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })]),
        ...fill("F36 after", 5),
    ]),
    probe("F37", [
        anchored("F37", 260, [drawing({ width: 3210, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })], {
            spacing: { before: 480 },
        }),
    ]),
    probe("F38a", [anchored("F38a", 260, [drawing({ width: 2880, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE }, 20)])]),
    probe("F38b", [
        anchored("F38b", 260, [
            new ShapeRun({
                type: "rectangle",
                transformation: { width: 2880 * PIXELS, height: 1440 * PIXELS, rotation: 20 },
                fill: "A0A0A0",
                line: "none",
                floating: { horizontalPosition: MARGIN_RIGHT, verticalPosition: PARAGRAPH_TOP, wrap: SQUARE },
            }),
        ]),
    ]),
    probe("F38c", [anchored("F38c", 260, [drawing({ width: 2865, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe(
        "F39",
        [
            anchored("F39", 260, [
                new ShapeRun({
                    type: "rectangle",
                    transformation: { width: "25%", height: 1440 * PIXELS },
                    fill: "A0A0A0",
                    line: "none",
                    floating: {
                        horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: "50%" },
                        verticalPosition: PARAGRAPH_TOP,
                        wrap: SQUARE,
                        sizeRelativeTo: { width: "betweenMargins" },
                    },
                }),
            ]),
        ],
        { page: { margin: { left: 2880, right: 2880 } } },
    ),
    probe("F40", [
        anchored("F40", 25, [drawing({ width: 2880, height: 2880, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            borders,
            rows: Array.from(
                { length: 4 },
                (_, i) =>
                    new TableRow({
                        children: [0, 1].map(
                            (j) =>
                                new TableCell({
                                    width: { size: 4513, type: WidthType.DXA },
                                    children: [line(`F40 row ${i + 1} cell ${j + 1}`)],
                                }),
                        ),
                    }),
            ),
        }),
        anchored("F40 after", 200, []),
    ]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const written = await zip.file("word/document.xml")!.async("string");
    const xml = INJECTIONS.reduce((text, [marker, replacement]) => {
        if (!marker.test(text)) {
            throw new Error(`No ${marker} to replace`);
        }
        return text.replace(marker, replacement);
    }, written);
    zip.file("word/document.xml", xml);
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-floats.docx", await zip.generateAsync({ type: "nodebuffer" }));
};

main();
