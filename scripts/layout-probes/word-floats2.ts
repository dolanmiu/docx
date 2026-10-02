// Probes of how Word lays out text around floating drawings and tables where word-floats.ts left it open, and where
// docx/layout still stops. Each probe starts a page, its first line names it ("G1 above"), and the paragraphs of a probe
// start with its name too, so word-floats.py can find each probe's page in pdftotext's HTML of a PDF saved from Word, and
// the drawings on it in pdftocairo's SVG. Calibri 11, single spaced, no space before or after, on A4 with 1440 margins:
// 9026 twips of text, lines of 268.55 twips, 51 to a page. The paragraphs that wrap are justified, so each of their lines
// but the last ends where the room beside a drawing does. Each drawing is a grey picture of a size of its own. Lengths are
// in twips.
//
// Drawings that overlap:
// G1:  two pictures with square wrapping in one paragraph, the second overlapping the first: whether the lines go beside both
// G2:  three pictures 1440 square with top and bottom wrapping, 900 apart across the margins, overlapping: where the text goes
// G3:  two pictures with square wrapping at the right, in paragraphs a line apart, that may not overlap (allowOverlap off):
//      where Word puts the second
// Distances and effects:
// G4:  top and bottom wrapping, 288 from the text above, at the top of a paragraph after one of 3 lines: whether the line
//      above it goes below it
// G5:  the same with square wrapping at the right: whether the line above it is narrowed
// G6:  a picture with an effect extent of 360 on each side, 2000 across the margins and 720 below its paragraph's top:
//      whether the distance places the picture or its effects
// Where the top of a paragraph is, with space after the paragraph before it:
// G7:  200 after it, 480 before the paragraph, a picture at the right at its top
// G8:  200 after it, none before
// G9:  200 after it, 100 before
// G10: 200 after it, none before, top and bottom wrapping: where the paragraph's first line goes
// Paragraphs kept with the next:
// G11: a heading kept with the next 6 lines from the bottom of a page, before a paragraph with a picture 2880 tall at its
//      top, which would go past the bottom: whether the heading goes to the next page with the paragraph
// G12: the same with top and bottom wrapping and a picture 1440 tall, whose paragraph's first line doesn't fit below it
// G13: a heading kept with the next beside a picture 2400 tall from a paragraph before, 4 lines from the bottom, before a
//      paragraph of 3 lines across the page, which takes 5 beside the picture: whether the heading moves with it
// Tables beside drawings:
// G14: a table 3000 wide below a paragraph with a picture 2880 square at the right: whether it goes beside the picture
// G15: the same with the picture at the left
// Where drawings go:
// G16: a picture 14000 tall at the top of a page, with square wrapping: whether it goes past the bottom of the page
// G17: a picture 2880 tall in 2 columns, at the top of a paragraph 5 lines from the bottom of the first column
// G18: a picture with square wrapping at the bottom of the margins, on a page with a footnote
// G19: a picture placed against where it is anchored along its line, after 10 words
// G20: a picture placed against its paragraph, anchored after 700 words of a paragraph that starts 30 lines down a page
// G21: a picture in 2 columns evened out before a continuous section break
// G22: a picture placed 200 below the top of its line
// G23: a picture at the top of the first paragraph of a section, with 480 before it
// Floating tables, 3000 wide and 6 rows, each followed by prose:
// G24: placed 2000 across and 3000 down the page
// G25: without borders, at the left of the margins
// G26: at the right of the column
// G27: 500 below the top of the paragraph after it, after a line
// G28: after 47 lines, where it doesn't fit on the page
// G29: two, the first at the left and the second at the right
//
// What Word showed, in word-floats2.pdf, saved from Word 16 for Mac on 2026-10-02 and read with word-floats.py:
//
// - G1, G2: drawings that overlap keep the text out of all their room: lines beside both go left of both, and those beside
//   one only on both sides of it. G3: one that may not overlap another is moved out of its way, to its left
// - G4, G5: a distance above a drawing reaches the lines before its paragraph: with top and bottom wrapping they go below
//   it, and with square wrapping they are narrowed. The drawing stays where it was first placed, though its paragraph then
//   moves down
// - G6: a distance from what a drawing is placed against places its own box, with its effect extent outside it
// - G7 to G10: a paragraph's top is below the space after the paragraph before it, and only the rest of the space above
//   it is its own: with 200 after and 480 before, its drawing is 200 down and its first line 480
// - G11, G12: a heading kept with the next goes to the next page with a paragraph that its drawing moves there. G13: one
//   beside a drawing goes with as many of the next paragraph's lines beside it as widow control keeps together
// - G14, G15: a table that fits beside a drawing goes beside it, moved right past one on its left
// - G16: a drawing taller than the page's text, at the top of a page, goes past its bottom, and its paragraph's first line
//   isn't narrowed
// - G17: in columns, a paragraph whose drawing would go past the bottom moves to the next column with it
// - G18: a drawing at the bottom of the margins is above the page's footnotes
// - G19: a drawing placed against its anchor's character starts where the anchor is along its justified line, which the
//   layout doesn't work out yet
// - G20: a drawing anchored in a line on the next page goes there, against the top of the paragraph's part on that page
// - G21: columns are evened out with a drawing in them as without. G22: 200 below a line is below its top as first laid
//   out. G23: at a section's start, the paragraph's top is above its space before
// - G24 to G29: a floating table is a box as wide as the table and its borders, placed by its settings, against the page,
//   the margins, the column, or the top of the paragraph after it, and text goes round it as round a drawing with square
//   wrapping, between two of them, and beside the rest of one that breaks across pages
//
// Usage: npm run run-ts -- scripts/layout-probes/word-floats2.ts, which writes build/word-probes/word-floats2.docx
// cspell:ignore pdftocairo
import * as fs from "fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    HeadingLevel,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    type IFloating,
    type ISectionOptions,
    ImageRun,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    SectionType,
    Table,
    TableAnchorType,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";

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
    /** Whether it may overlap other drawings, as docx writes it unless told otherwise */
    readonly allowOverlap?: boolean;
};

/** A floating picture of a size, in twips, placed and wrapped as given, with its offsets in twips, turned by degrees */
const drawing = ({ width, height, h, v, wrap, distances = [0, 0, 0, 0], allowOverlap = true }: Place, rotation?: number): ImageRun => {
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
            allowOverlap,
        },
    });
};

const SQUARE: Wrap = { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES };
const TOP_AND_BOTTOM: Wrap = { type: TextWrappingType.TOP_AND_BOTTOM };
const MARGIN_RIGHT = { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT } as const;
const MARGIN_LEFT = { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.LEFT } as const;
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

const PARAGRAPH_TOP = belowParagraph(0);

const borders = {
    top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
};

const table = (name: string, width = 3000, float?: ConstructorParameters<typeof Table>[0]["float"], withBorders = true): Table =>
    new Table({
        width: { size: width, type: WidthType.DXA },
        columnWidths: [width],
        borders: withBorders ? borders : TableBorders.NONE,
        ...(float ? { float } : {}),
        rows: Array.from(
            { length: 6 },
            (_, i) =>
                new TableRow({
                    children: [new TableCell({ width: { size: width, type: WidthType.DXA }, children: [line(`${name} cell ${i + 1}`)] })],
                }),
        ),
    });

/** A heading kept with the next */
const kept = (name: string): Paragraph =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, children: [new TextRun(`${name} heading`)] });

/** Floating table options at the left or right of the margins, at the top of the paragraph after it, 200 from the text */
const beside = (side: "left" | "right", down = 0): ConstructorParameters<typeof Table>[0]["float"] => ({
    horizontalAnchor: TableAnchorType.MARGIN,
    relativeHorizontalPosition: side === "left" ? RelativeHorizontalPosition.LEFT : RelativeHorizontalPosition.RIGHT,
    verticalAnchor: TableAnchorType.TEXT,
    absoluteVerticalPosition: down,
    ...(side === "left" ? { rightFromText: 200 } : { leftFromText: 200 }),
    bottomFromText: 200,
});

const TWO_COLUMNS = { column: { count: 2, space: 720 } };
const COLUMN_RIGHT = { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.RIGHT } as const;

// G6's picture, by its width in EMUs, and the effect extent written for it in place of docx's
const EFFECT_WIDTH = 2850 * EMUS;
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [
        new RegExp(`(<wp:extent cx="${EFFECT_WIDTH}" cy="\\d+"/>)<wp:effectExtent [^/]*/>`),
        `$1<wp:effectExtent l="${360 * EMUS}" t="${360 * EMUS}" r="${360 * EMUS}" b="${360 * EMUS}"/>`,
    ],
];

const sections: ISectionOptions[] = [
    probe("G1", [
        anchored("G1", 260, [
            drawing({ width: 2880, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE }),
            drawing({ width: 1440, height: 1440, h: fromMargin(6000), v: belowParagraph(720), wrap: SQUARE }),
        ]),
    ]),
    probe("G2", [
        anchored(
            "G2",
            260,
            [0, 900, 1800].map((offset, i) =>
                drawing({ width: 1440 + i * 15, height: 1440, h: fromMargin(offset), v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM }),
            ),
        ),
    ]),
    probe("G3", [
        anchored("G3p1", 30, [
            drawing({ width: 2880, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE, allowOverlap: false }),
        ]),
        anchored("G3p2", 220, [
            drawing({ width: 2895, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE, allowOverlap: false }),
        ]),
    ]),
    probe("G4", [
        anchored("G4 before", 45, []),
        anchored("G4", 200, [
            drawing({ width: 2910, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM, distances: [288, 0, 0, 0] }),
        ]),
    ]),
    probe("G5", [
        anchored("G5 before", 45, []),
        anchored("G5", 200, [
            drawing({ width: 2925, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE, distances: [288, 0, 0, 0] }),
        ]),
    ]),
    probe("G6", [anchored("G6", 260, [drawing({ width: 2850, height: 1440, h: fromMargin(2000), v: belowParagraph(720), wrap: SQUARE })])]),
    probe("G7", [
        anchored("G7 before", 30, [], { spacing: { after: 200 } }),
        anchored("G7", 200, [drawing({ width: 2940, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            spacing: { before: 480 },
        }),
    ]),
    probe("G8", [
        anchored("G8 before", 30, [], { spacing: { after: 200 } }),
        anchored("G8", 200, [drawing({ width: 2955, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
    ]),
    probe("G9", [
        anchored("G9 before", 30, [], { spacing: { after: 200 } }),
        anchored("G9", 200, [drawing({ width: 2970, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
            spacing: { before: 100 },
        }),
    ]),
    probe("G10", [
        anchored("G10 before", 30, [], { spacing: { after: 200 } }),
        anchored("G10", 200, [drawing({ width: 2985, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })]),
    ]),
    probe("G11", [
        ...fill("G11", 44),
        kept("G11"),
        anchored("G11", 120, [drawing({ width: 3000, height: 2880, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
    ]),
    probe("G12", [
        ...fill("G12", 44),
        kept("G12"),
        anchored("G12", 120, [drawing({ width: 3015, height: 1440, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: TOP_AND_BOTTOM })]),
    ]),
    probe("G13", [
        ...fill("G13", 40),
        anchored("G13 picture", 4, [drawing({ width: 4320, height: 2400, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
        ...fill("G13 more", 5),
        kept("G13"),
        anchored("G13", 45, []),
        anchored("G13 after", 60, []),
    ]),
    probe("G14", [
        anchored("G14", 25, [drawing({ width: 2880, height: 2880, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
        table("G14"),
        anchored("G14 after", 200, []),
    ]),
    probe("G15", [
        anchored("G15", 25, [drawing({ width: 2895, height: 2880, h: MARGIN_LEFT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
        table("G15"),
        anchored("G15 after", 200, []),
    ]),
    probe("G16", [anchored("G16", 400, [drawing({ width: 3030, height: 14000, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])]),
    probe(
        "G17",
        [
            ...fill("G17", 45),
            anchored("G17", 100, [drawing({ width: 1440, height: 2880, h: COLUMN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })]),
            ...fill("G17 after", 30),
        ],
        TWO_COLUMNS,
    ),
    probe("G18", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                drawing({
                    width: 3045,
                    height: 1440,
                    h: MARGIN_RIGHT,
                    v: { relative: VerticalPositionRelativeFrom.MARGIN, align: VerticalPositionAlign.BOTTOM },
                    wrap: SQUARE,
                }),
                new TextRun(`G18 ${prose(40)}`),
                new FootnoteReferenceRun(1),
                new TextRun(` ${prose(700)}`),
            ],
        }),
    ]),
    probe("G19", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun(`G19 ${prose(10)}`),
                drawing({
                    width: 1500,
                    height: 1440,
                    h: { relative: HorizontalPositionRelativeFrom.CHARACTER, offset: 0 },
                    v: belowParagraph(600),
                    wrap: SQUARE,
                }),
                new TextRun(` anchor ${prose(220)}`),
            ],
        }),
    ]),
    probe("G20", [
        ...fill("G20", 29),
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun(`G20 ${prose(700)}`),
                drawing({ width: 3060, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE }),
                new TextRun(` anchor ${prose(100)}`),
            ],
        }),
    ]),
    probe(
        "G21",
        [anchored("G21", 300, [drawing({ width: 1455, height: 1440, h: COLUMN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })])],
        TWO_COLUMNS,
    ),
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [line("G21 after the columns"), anchored("G21 after", 100, [])],
    },
    probe("G22", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun(`G22 ${prose(40)}`),
                drawing({
                    width: 3075,
                    height: 1440,
                    h: MARGIN_RIGHT,
                    v: { relative: VerticalPositionRelativeFrom.LINE, offset: 200 },
                    wrap: SQUARE,
                }),
                new TextRun(` anchor ${prose(220)}`),
            ],
        }),
    ]),
    {
        properties: {},
        children: [
            anchored("G23", 260, [drawing({ width: 3090, height: 1440, h: MARGIN_RIGHT, v: PARAGRAPH_TOP, wrap: SQUARE })], {
                spacing: { before: 480 },
            }),
        ],
    },
    probe("G24", [
        table("G24", 3000, {
            horizontalAnchor: TableAnchorType.PAGE,
            absoluteHorizontalPosition: 2000,
            verticalAnchor: TableAnchorType.PAGE,
            absoluteVerticalPosition: 3000,
            rightFromText: 200,
            bottomFromText: 200,
        }),
        anchored("G24", 400, []),
    ]),
    probe("G25", [table("G25", 3000, beside("left"), false), anchored("G25", 260, [])]),
    probe("G26", [table("G26", 3000, { ...beside("right"), horizontalAnchor: TableAnchorType.TEXT }), anchored("G26", 260, [])]),
    probe("G27", [line("G27 line"), table("G27", 3000, beside("left", 500)), anchored("G27", 260, [])]),
    probe("G28", [...fill("G28", 46), table("G28", 3000, beside("left")), anchored("G28", 120, [])]),
    probe("G29", [table("G29a", 3000, beside("left")), table("G29b", 3000, beside("right")), anchored("G29", 260, [])]),
];

const doc = new Document({
    styles: {
        default: {
            document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
            heading1: { run: { size: 22, bold: true }, paragraph: { spacing: { before: 0, after: 0 } } },
        },
        paragraphStyles: [
            { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    footnotes: { 1: { children: [new Paragraph(`G18 note ${prose(30)}`)] } },
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
    fs.writeFileSync("build/word-probes/word-floats2.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

main();
