/**
 * Probes of what Word's PDFs of `word-stops-floats.docx`, `word-stops-drawings.docx` and `word-stops-pages.docx` left open,
 * where docx/layout still stops after lay2-floats followed them. Each probe starts a page, or is marked off by a line above
 * and below it, with justified prose around the table, frame or picture, so each line's end shows its room. Calibri 11 on
 * A4 with inch margins. Read it with word-stops.py.
 *
 * TX1a to TX1k: docx's text box in the line, 2 words wide, its width the words' less 1.5, 1, 0.75, 0.5, 0.25 points, the
 *   same, and 0.25, 0.5, 0.75, 1 and 1.5 points more, with its insets of 0.1 inch either side: whether the second word goes
 *   on its first line, which says how much room Word gives its text ("a line in a text box that only just fits": TB10's
 *   lines were 7 points narrower than their boxes, so they didn't show it)
 * PV1a to PV1f: a picture of 1 inch lined up against the page down it: top (a), inside (b) and outside (c) on an odd page,
 *   bottom (d), and inside (e) and outside (f) on an even page; PV1g, PV1h: inside on an odd page with the header 1200 and
 *   300 from the top ("a drawing lined up inside or outside, not against the margins": DR6a and DR6b were 354 twips below
 *   the page's top, half the header's distance of 708)
 * CO1a, CO1b: in 2 columns, in the second, a floating table with no w:horzAnchor (a), and a frame with no w:hAnchor (b),
 *   500 from what they are placed against ("...placed against what isn't given, in columns", FT7a and FR6a were in one)
 * NR1a to NR1c: two floating tables that may not overlap, the second with no room right of the first: placed at 4000 and
 *   5000 (a), both at the right of the margins (b); and both at the left of the margins with half-point borders (c, as
 *   word-floats3 H14 with 1 point)
 * NR2a, NR2b: a picture 1 inch tall that leaves rooms of 340 and 350 twips right of it, beside short words ("of")
 * NR2c: a picture 1000 twips tall leaving 300 twips either side: whether the line goes below it, or a line at a time
 * KP1a, KP1b: a heading kept with the next with a picture of its own (a), and a paragraph with a floating table anchored in
 *   it (b), as the page's last line, the next paragraph on the next page
 * TF1: a floating table at the top of a table of 5 rows that can't split, whose first row doesn't fit on the page
 * TF2a to TF2c: a floating table of 30 rows going past the bottom of the page: with a header row (a), 200 from the text
 *   below it (b), and with a row of 3 lines across the bottom (c)
 * TF3: a floating table with borders between its rows only
 * EN1a, EN1b: a floating table (a) and a frame (b) in an endnote
 * FN1: a picture 1.5 inches tall beside a page's footnotes, whose lines are as wide as the page (DR7's were short)
 * FB1a, FB1b: a frame with borders round it and 360 from the text beside it (hSpace) (a); a frame placed against the
 *   paragraph after it, before a table (b)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-floats2.ts [folder]
 */
import {
    AlignmentType,
    BorderStyle,
    EndnoteReferenceRun,
    FrameAnchorType,
    Header,
    HorizontalPositionRelativeFrom,
    ImageRun,
    type ISectionOptions,
    OverlapType,
    Paragraph,
    RelativeHorizontalPosition,
    SectionType,
    Table,
    TableAnchorType,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    Textbox,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, type Child, PAGE, PNG, cell, fill, footnote, group, line, para, probe, prose, write } from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
const EMU = 914400;
const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED };
const prosePara = (name: string, words = 120): Paragraph => para(name, words, JUSTIFIED);

/** A floating table 3000 wide of some rows, placed as given, 180 from the text either side */
const floating = (name: string, rows = 3, float: object = {}, extra: object = {}): Table =>
    new Table({
        width: { size: 3000, type: WidthType.DXA },
        columnWidths: [3000],
        borders: ALL_BORDERS,
        float: {
            horizontalAnchor: TableAnchorType.MARGIN,
            absoluteHorizontalPosition: 2000,
            verticalAnchor: TableAnchorType.TEXT,
            absoluteVerticalPosition: 300,
            leftFromText: 180,
            rightFromText: 180,
            ...float,
        },
        ...extra,
        rows: Array.from(
            { length: rows },
            (_, index) => new TableRow({ children: [cell(`${name} row ${index + 1}`, { width: { size: 3000, type: WidthType.DXA } })] }),
        ),
    });

/** A picture, its size in inches, placed as given, with square wrapping on both sides and 0.125 inches from the text */
const picture = (
    name: string,
    options: {
        size?: number;
        height?: number;
        x?: number;
        y?: number;
        across?: string;
        down?: string;
        alignDown?: string;
        wrap?: string;
    } = {},
): ImageRun => {
    const { size = 1, height = size, x = 0, y = 0.2, across, down, alignDown } = options;
    return new ImageRun({
        type: "png",
        data: PNG,
        altText: { name, description: name, title: name },
        transformation: { width: size * 96, height: height * 96 },
        floating: {
            horizontalPosition: { relative: (across ?? HorizontalPositionRelativeFrom.MARGIN) as never, offset: x * EMU },
            verticalPosition: alignDown
                ? { relative: (down ?? VerticalPositionRelativeFrom.PAGE) as never, align: alignDown as never }
                : { relative: (down ?? VerticalPositionRelativeFrom.PARAGRAPH) as never, offset: y * EMU },
            wrap: { type: (options.wrap ?? TextWrappingType.SQUARE) as never, side: TextWrappingSide.BOTH_SIDES },
            margins: { left: EMU / 8, right: EMU / 8, top: 0, bottom: 0 },
        },
    });
};

const frame = (x = 1000, y = 1000, extra: object = {}) => ({
    frame: {
        type: "absolute" as const,
        position: { x, y },
        width: 3000,
        height: 1000,
        anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN },
        ...extra,
    },
});

// TX1: two words, and the box's text widths about theirs
const WORDS = "lighthouse summer";
const TEXT = measureTextWidth(WORDS, CALIBRI);
const TX = [-1.5, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.5];

const thick = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const nil = { style: BorderStyle.NIL, size: 0, color: "auto" };

/** A section on a new page, of the kit's page, with these children */
const section = (
    children: readonly Child[],
    options: Partial<ISectionOptions["properties"]> = {},
    more: Partial<ISectionOptions> = {},
): ISectionOptions => ({
    properties: { ...PAGE, ...options },
    children: [...children],
    ...more,
});

const sections: ISectionOptions[] = [
    section([
        line("TX1 above"),
        ...TX.flatMap((delta, index) =>
            group(`TX1${"abcdefghijk"[index]}`, [
                new Paragraph({
                    children: [
                        new TextRun(`TX1${"abcdefghijk"[index]} `),
                        new Textbox({ style: { width: `${(TEXT + delta + 14.4).toFixed(3)}pt`, height: "auto" }, children: [line(WORDS)] }),
                        new TextRun(" after"),
                    ],
                }),
            ]),
        ),
    ]),
    // PV1a to PV1f: lined up against the page down it, each on its own page
    ...(
        [
            ["a", VerticalPositionAlign.TOP],
            ["b", VerticalPositionAlign.INSIDE],
            ["c", VerticalPositionAlign.OUTSIDE],
            ["d", VerticalPositionAlign.BOTTOM],
        ] as const
    ).map(([letter, align]) =>
        section(
            probe(`PV1${letter}`, [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [picture(`PV1${letter}`, { x: 1, alignDown: align }), new TextRun(`PV1${letter} ${prose(250)}`)],
                }),
            ]),
        ),
    ),
    // An empty page, so the next two are on even pages
    section([line("PV1 even"), new Paragraph({ pageBreakBefore: true, children: [] })], {}),
    ...(
        [
            ["e", VerticalPositionAlign.INSIDE],
            ["f", VerticalPositionAlign.OUTSIDE],
        ] as const
    ).map(([letter, align]) =>
        section(
            probe(`PV1${letter}`, [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [picture(`PV1${letter}`, { x: 1, alignDown: align }), new TextRun(`PV1${letter} ${prose(250)}`)],
                }),
            ]),
        ),
    ),
    section([line("PV1 odd")], {}),
    ...(
        [
            ["g", 1200],
            ["h", 300],
        ] as const
    ).map(([letter, header]) =>
        section(
            probe(`PV1${letter}`, [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [
                        picture(`PV1${letter}`, { x: 1, alignDown: VerticalPositionAlign.INSIDE }),
                        new TextRun(`PV1${letter} ${prose(250)}`),
                    ],
                }),
            ]),
            { page: { ...PAGE.page, margin: { ...PAGE.page.margin, header } } },
            { headers: { default: new Header({ children: [line(`PV1${letter} header`)] }) } },
        ),
    ),
    // CO1a, CO1b: in the second of 2 columns
    section(
        [
            line("CO1a above"),
            ...fill("CO1a", 51),
            prosePara("CO1a", 20),
            floating("CO1a", 3, { absoluteHorizontalPosition: 500 }),
            prosePara("CO1a after", 120),
            line("CO1a below"),
        ],
        { type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
    ),
    section(
        [
            line("CO1b above"),
            ...fill("CO1b", 51),
            new Paragraph({ ...frame(500, 2000), children: [new TextRun("CO1b frame")] }),
            prosePara("CO1b after", 120),
            line("CO1b below"),
        ],
        { type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
    ),
    section([
        ...probe("NR1a", [
            prosePara("NR1a", 20),
            floating("NR1a", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 4000 }),
            floating("NR1a second", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 5000, absoluteVerticalPosition: 500 }),
            prosePara("NR1a after", 200),
        ]),
        ...probe("NR1b", [
            prosePara("NR1b", 20),
            floating("NR1b", 4, { overlap: OverlapType.NEVER, relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT }),
            floating("NR1b second", 4, {
                overlap: OverlapType.NEVER,
                relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
                absoluteVerticalPosition: 500,
            }),
            prosePara("NR1b after", 200),
        ]),
        ...probe("NR1c", [
            prosePara("NR1c", 20),
            floating("NR1c", 4, {
                overlap: OverlapType.NEVER,
                relativeHorizontalPosition: RelativeHorizontalPosition.LEFT,
                leftFromText: 0,
                rightFromText: 200,
            }),
            floating("NR1c second", 4, {
                overlap: OverlapType.NEVER,
                relativeHorizontalPosition: RelativeHorizontalPosition.LEFT,
                leftFromText: 0,
                rightFromText: 200,
                absoluteVerticalPosition: 500,
            }),
            prosePara("NR1c after", 200),
        ]),
        // NR2a, NR2b: rooms of 340 and 350 right of a picture, 1440 + 180 + room from the margin's right
        ...[340, 350].flatMap((room, index) =>
            probe(`NR2${"ab"[index]}`, [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [
                        picture(`NR2${"ab"[index]}`, { size: (9026 - 180 - room) / 1440, height: 1 }),
                        new TextRun(`NR2${"ab"[index]} ${Array.from({ length: 80 }, () => "of").join(" ")}`),
                    ],
                }),
            ]),
        ),
        ...probe("NR2c", [
            new Paragraph({
                ...JUSTIFIED,
                children: [
                    picture("NR2c", { size: (9026 - 600 - 360) / 1440, height: 1000 / 1440, x: 480 / 1440 }),
                    new TextRun(`NR2c ${prose(120)}`),
                ],
            }),
        ]),
        // KP1a, KP1b: kept with the next as the page's last line
        ...probe("KP1a", [
            ...fill("KP1a", 48),
            new Paragraph({ keepNext: true, children: [picture("KP1a", { size: 0.15, x: 5 }), new TextRun("KP1a heading kept")] }),
            prosePara("KP1a after", 60),
        ]),
        ...probe("KP1b", [
            ...fill("KP1b", 48),
            floating("KP1b", 1, { absoluteVerticalPosition: 0, absoluteHorizontalPosition: 6000 }),
            line("KP1b kept", { keepNext: true }),
            prosePara("KP1b after", 60),
        ]),
        // TF1: before a table that goes on to the next page
        ...probe("TF1", [
            ...fill("TF1", 49),
            floating("TF1", 1, { absoluteVerticalPosition: 0, absoluteHorizontalPosition: 6000 }),
            new Table({
                width: { size: 4000, type: WidthType.DXA },
                columnWidths: [4000],
                borders: ALL_BORDERS,
                rows: Array.from(
                    { length: 5 },
                    (_, index) => new TableRow({ cantSplit: true, children: [cell(`TF1 plain ${index + 1}\nTF1 plain ${index + 1} b`)] }),
                ),
            }),
            prosePara("TF1 after", 60),
        ]),
        // TF2a to TF2c: past the bottom of the page
        ...probe("TF2a", [
            ...fill("TF2a", 40),
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                borders: ALL_BORDERS,
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    absoluteHorizontalPosition: 2000,
                    verticalAnchor: TableAnchorType.TEXT,
                    absoluteVerticalPosition: 1000,
                    leftFromText: 180,
                    rightFromText: 180,
                },
                rows: Array.from(
                    { length: 30 },
                    (_, index) =>
                        new TableRow({ tableHeader: index === 0, children: [cell(index === 0 ? "TF2a header" : `TF2a row ${index}`)] }),
                ),
            }),
            prosePara("TF2a after", 200),
        ]),
        ...probe("TF2b", [
            ...fill("TF2b", 40),
            floating("TF2b", 30, { absoluteVerticalPosition: 1000, bottomFromText: 200 }),
            prosePara("TF2b after", 200),
        ]),
        ...probe("TF2c", [
            ...fill("TF2c", 40),
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                borders: ALL_BORDERS,
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    absoluteHorizontalPosition: 2000,
                    verticalAnchor: TableAnchorType.TEXT,
                    absoluteVerticalPosition: 1000,
                    leftFromText: 180,
                    rightFromText: 180,
                },
                rows: Array.from(
                    { length: 12 },
                    (_, index) =>
                        new TableRow({
                            children: [cell(index === 5 ? "TF2c row 6\nTF2c row 6 b\nTF2c row 6 c" : `TF2c row ${index + 1}`)],
                        }),
                ),
            }),
            prosePara("TF2c after", 200),
        ]),
        // TF3: borders between its rows only
        ...probe("TF3", [
            prosePara("TF3", 30),
            floating(
                "TF3",
                3,
                { absoluteVerticalPosition: 1500 },
                { borders: { top: nil, bottom: nil, left: nil, right: nil, insideHorizontal: thick, insideVertical: nil } },
            ),
            prosePara("TF3 after", 150),
        ]),
        ...probe("EN1", [
            new Paragraph({ children: [new TextRun(`EN1 ${prose(20)}`), new EndnoteReferenceRun(1), new EndnoteReferenceRun(2)] }),
        ]),
        // FN1: footnote lines as wide as the page beside a picture placed 10 inches down
        ...probe("FN1", [
            ...fill("FN1", 20),
            new Paragraph({ children: [new TextRun("FN1 reference"), footnote(para("FN1 note", 120))] }),
            new Paragraph({
                ...JUSTIFIED,
                children: [
                    picture("FN1", { size: 1.5, x: 3, y: 9.5, down: VerticalPositionRelativeFrom.PAGE }),
                    new TextRun(`FN1 anchor ${prose(150)}`),
                ],
            }),
        ]),
        ...probe("FB1a", [
            new Paragraph({
                ...frame(1000, 1000, { space: { horizontal: 360, vertical: 0 } }),
                border: { left: { ...thick, size: 12, space: 4 }, right: { ...thick, size: 12, space: 4 } },
                children: [new TextRun("FB1a frame")],
            }),
            prosePara("FB1a", 200),
        ]),
        ...probe("FB1b", [
            prosePara("FB1b", 20),
            new Paragraph({
                ...frame(1000, 300, { anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.TEXT } }),
                children: [new TextRun("FB1b frame")],
            }),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: ALL_BORDERS,
                rows: [new TableRow({ children: [cell("FB1b plain table")] })],
            }),
            prosePara("FB1b after", 150),
        ]),
        // The endnotes, EN1a and EN1b's, on a page of their own after this
        line("Endnotes", { pageBreakBefore: true }),
    ]),
];

await write({
    name: "word-stops-floats2",
    sections,
    injections: [
        // CO1a: no w:horzAnchor
        (parts) => {
            const tables = parts.get("word/document.xml")!.split("<w:tbl>");
            const index = tables.findIndex((part) => part.includes(">CO1a row 1<"));
            if (index === -1) {
                throw new Error("CO1a's table isn't in the document");
            }
            tables[index] = tables[index].replace(/ w:horzAnchor="[^"]*"/, "");
            parts.set("word/document.xml", tables.join("<w:tbl>"));
        },
        // CO1b: no w:hAnchor
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf(">CO1b frame<");
            const start = at === -1 ? -1 : text.lastIndexOf("<w:framePr", at);
            if (start === -1) {
                throw new Error("CO1b's frame isn't in the document");
            }
            const end = text.indexOf("/>", start) + 2;
            parts.set(
                "word/document.xml",
                text.slice(0, start) + text.slice(start, end).replace(/ w:hAnchor="[^"]*"/, "") + text.slice(end),
            );
        },
    ],
    options: {
        endnotes: {
            1: { children: [line("EN1a endnote"), floating("EN1a", 3) as unknown as Paragraph, line("EN1a endnote after")] },
            2: { children: [new Paragraph({ ...frame(500, 0), children: [new TextRun("EN1b frame")] }), line("EN1b endnote")] },
        },
    },
});
