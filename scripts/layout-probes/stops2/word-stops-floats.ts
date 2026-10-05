/**
 * Probes of tables that text flows around (`w:tblpPr`) and of text frames (`w:framePr`), where docx/layout stops, and of
 * a table's header rows at the foot of a page, which docx/layout lays out unlike Word without stopping.
 *
 * Floating tables (#3673 followed `word-floats2.docx` G24 to G29 and `word-floats3.docx` H1 to H15, and stops at the
 * rest): "a table that text flows around without a paragraph after it", "...with a border on one side only",
 * "a footnote in a table that text flows around", "a paragraph kept with the next with a table that text flows around",
 * "a table that text flows around going past the bottom of the page" (G28 showed one case), "...in a table cell,
 * header, footer or note", "...placed against what isn't given", "...lined up in a way not yet followed", and
 * "drawings that text flows around that may not overlap, overlapping" for tables (H14). docx/demo tables/floating-tables
 * stops at the first.
 *
 * Text frames (#3674 followed `word-frames.docx` FM1 to FM19): "a text frame with no paragraph after it in its section"
 * (docx's demo text-boxes/text-frame stops here), "a text frame with borders" (FM13: the text keeps 65 and 64 twips
 * beyond the frame's text, borders drawn 67 and 50 beyond it, not explained), "a text frame in a table cell, footnote,
 * endnote, header, footer or text box", "a text frame given by both a paragraph and its style", "a footnote or endnote
 * in a text frame", "a text frame that doesn't say what it is placed against", "a text frame lined up in a way not yet
 * followed" (yAlign inline).
 *
 * Header rows: `tables-across-pages` (Word's PDF of round 2) has Word move a table's header row to the next page with
 * its first row, where docx/layout leaves it alone at the foot of the page and repeats it on the next (#3662 left it).
 *
 * Each probe starts a page, between a line above and a line below it, with justified prose around the table or frame so
 * each line's end shows its room. Calibri 11 on A4 with inch margins.
 *
 * FT1a to FT1e: a table placed 2000 from the margin's left and 1500 below the paragraph before it, square wrapping, with
 *   no paragraph after it in its section: a, a table that doesn't float after it; b, a continuous section break after
 *   it; c, a section break to a new page; d, a second floating table after it, then prose; e, the document's last
 *   (the last probe of the document)
 * FT2a to FT2e: the floating table of H1, 3000 wide, with a border of 3 points on one side only: a left, b right,
 *   c top, d bottom, e left and top
 * FT3: a footnote reference in a floating table's cell
 * FT4a, FT4b: a heading kept with the next before the paragraph after a floating table (a), and a floating table whose
 *   paragraph after it is kept with the next, before a paragraph of 20 lines (b)
 * FT5a to FT5d: a floating table of 5, 15, 30 and 60 rows, placed 1000 below its paragraph, which is 40 lines down the
 *   page, so it goes past the bottom
 * FT6a to FT6c: a floating table in a table cell (a), in the header (b, on its own page, the header with prose too),
 *   and in a footnote (c)
 * FT7a to FT7c: a floating table with no w:horzAnchor (a), no w:vertAnchor (b), and lined up inline down the page
 *   (w:tblpYSpec="inline", c)
 * FT8a to FT8c: two tables that may not overlap (w:tblOverlap never), the second placed overlapping the first: to its
 *   right and 500 lower (a), below it and 1000 to the right (b), and three, each over the one before (c)
 * FR1a to FR1d: a frame 3000 by 1000, 1000 from the margins, with no paragraph after it in its section: before a table
 *   (a), before a continuous section break (b), before a section break to a new page (c), and two paragraphs in the
 *   same frame before a table (d)
 * FR2a to FR2j: a frame 3000 by 1000 at 1000 and 3000 from the margins, its paragraph with borders all round of
 *   a: 4 (half a point) 0 from the text, b: 4 at 4 points, c: 12 at 4, d: 24 at 4, e: 4 at 12, f: 4 at 31; g: a left
 *   border of 12 at 4 only; h: top and bottom of 12 at 4 only; i: 12 at 4 with a shadow; j: two paragraphs in the
 *   frame with the same borders and a between border
 * FR3a, FR3b: a frame in a table cell (a), and in a footnote (b)
 * FR4: a frame given by a paragraph style (2000 wide, 500 from the margin), and by the paragraph too (3000 wide, 1500)
 * FR5a, FR5b: a footnote reference (a) and an endnote reference (b) in a frame's text
 * FR6a to FR6c: a frame with no w:hAnchor (a), no w:vAnchor (b), and lined up inline down the page (yAlign inline, c)
 * HR1a to HR1h: a table of a header row and rows of 3 lines, starting so that only the header row and part of the first
 *   row fit on the page: the first row a: at least 2000 tall (the demo's), b: can't split, c: of 3 lines with room for
 *   one, d: its paragraph kept with the next, e: two header rows, with room for both and no line of the first row,
 *   f: room for the header row and the first row's first line only, g: a header row of 2 lines, h: no header row
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-floats.ts [folder]
 */
import {
    AlignmentType,
    BorderStyle,
    EndnoteReferenceRun,
    FrameAnchorType,
    Header,
    HeightRule,
    type ISectionOptions,
    OverlapType,
    Paragraph,
    SectionType,
    Table,
    TableAnchorType,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, footnote, line, para, probe, prose, write } from "./kit";

const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED };
const prosePara = (name: string, words = 120): Paragraph => para(name, words, JUSTIFIED);

const floatOptions = (x = 2000, y = 1500) =>
    ({
        horizontalAnchor: TableAnchorType.MARGIN,
        absoluteHorizontalPosition: x,
        verticalAnchor: TableAnchorType.TEXT,
        absoluteVerticalPosition: y,
        leftFromText: 180,
        rightFromText: 180,
    }) as const;

const floating = (name: string, rows = 3, options: object = {}, extra: object = {}): Table =>
    new Table({
        width: { size: 3000, type: WidthType.DXA },
        columnWidths: [3000],
        borders: ALL_BORDERS,
        float: { ...floatOptions(), ...options },
        ...extra,
        rows: Array.from(
            { length: rows },
            (_, index) => new TableRow({ children: [cell(`${name} row ${index + 1}`, { width: { size: 3000, type: WidthType.DXA } })] }),
        ),
    });

const plainTable = (name: string): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [cell(`${name} plain table`)] })],
    });

const thick = { style: BorderStyle.SINGLE, size: 24, color: "000000" };
const nil = { style: BorderStyle.NIL, size: 0, color: "auto" };
const oneSided = (sides: readonly string[]) =>
    Object.fromEntries(
        ["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((side) => [side, sides.includes(side) ? thick : nil]),
    );

/** A section on a new page, of the kit's page, with these children */
const section = (children: readonly Child[], options: Partial<ISectionOptions["properties"]> = {}): ISectionOptions => ({
    properties: { ...PAGE, ...options },
    children: [...children],
});

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

const border = (size: number, space: number, extra: object = {}) => ({ style: BorderStyle.SINGLE, size, space, color: "000000", ...extra });
const boxed = (size: number, space: number, sides = ["top", "bottom", "left", "right"], extra: object = {}) =>
    Object.fromEntries(sides.map((side) => [side, border(size, space, extra)]));

const HR = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
/** HR's table: a header row (or two, or none) and rows of 3 lines, after `before` lines of prose */
const headerRows = (name: string, kind: (typeof HR)[number]): Child[] => {
    const headers = kind === "h" ? 0 : kind === "e" ? 2 : 1;
    const rows = [
        ...Array.from(
            { length: headers },
            (_, index) =>
                new TableRow({
                    tableHeader: true,
                    children: [
                        cell(kind === "g" ? `${name} header 1\n${name} header 2` : `${name} header ${index + 1}`),
                        cell(`${name} header right`),
                    ],
                }),
        ),
        ...Array.from({ length: 6 }, (_, index) => {
            const first = index === 0;
            return new TableRow({
                ...(first && kind === "a" ? { height: { value: 2000, rule: HeightRule.ATLEAST } } : {}),
                ...(first && kind === "b" ? { cantSplit: true } : {}),
                children: [
                    cell(
                        Array.from(
                            { length: 3 },
                            (_, line) =>
                                new Paragraph({
                                    ...(first && kind === "d" ? { keepNext: true } : {}),
                                    children: [new TextRun(`${name} r${index + 1} line ${line + 1}`)],
                                }),
                        ),
                    ),
                    cell(`${name} r${index + 1} right`),
                ],
            });
        }),
    ];
    // Lines before the table: 51 to a page, less the probe's line above, the header rows and what of the first row fits
    const room = { a: 1, b: 2, c: 1, d: 2, e: 0, f: 1, g: 1, h: 1 }[kind];
    const before = 50 - headers * (kind === "g" ? 2 : 1) - room - 1;
    return [
        ...fill(name, before),
        new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [6000, 3026], borders: ALL_BORDERS, rows }),
    ];
};

const sections: ISectionOptions[] = [
    // FT1a to FT1d
    section([...probe("FT1a", [prosePara("FT1a", 30), floating("FT1a"), plainTable("FT1a"), prosePara("FT1a after", 120)])]),
    section([...probe("FT1b", [prosePara("FT1b", 30), floating("FT1b")], { below: false })]),
    section([line("FT1b below"), prosePara("FT1b after", 120)], { type: SectionType.CONTINUOUS }),
    section([...probe("FT1c", [prosePara("FT1c", 30), floating("FT1c")], { below: false })]),
    section([line("FT1c below"), prosePara("FT1c after", 120)]),
    section([
        ...probe("FT1d", [
            prosePara("FT1d", 30),
            floating("FT1d"),
            floating("FT1d second", 3, { absoluteHorizontalPosition: 5500 }),
            prosePara("FT1d after", 120),
        ]),
        ...["a", "b", "c", "d", "e"].flatMap((letter, index) =>
            probe(`FT2${letter}`, [
                prosePara(`FT2${letter}`, 30),
                floating(`FT2${letter}`, 3, {}, { borders: oneSided([["left"], ["right"], ["top"], ["bottom"], ["left", "top"]][index]) }),
                prosePara(`FT2${letter} after`, 150),
            ]),
        ),
        ...probe("FT3", [
            prosePara("FT3", 30),
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                borders: ALL_BORDERS,
                float: floatOptions(),
                rows: [
                    new TableRow({
                        children: [cell([new Paragraph({ children: [new TextRun("FT3 row 1"), footnote(line("FT3 note"))] })])],
                    }),
                ],
            }),
            prosePara("FT3 after", 150),
        ]),
        ...probe("FT4a", [
            prosePara("FT4a", 30),
            floating("FT4a"),
            line("FT4a heading kept", { keepNext: true }),
            prosePara("FT4a after", 150),
        ]),
        ...probe("FT4b", [
            ...fill("FT4b", 30),
            floating("FT4b", 3, { absoluteVerticalPosition: 200 }),
            line("FT4b kept", { keepNext: true }),
            ...fill("FT4b next", 20, 1),
        ]),
        ...[5, 15, 30, 60].flatMap((rows, index) =>
            probe(`FT5${"abcd"[index]}`, [
                ...fill(`FT5${"abcd"[index]}`, 40),
                floating(`FT5${"abcd"[index]}`, rows, { absoluteVerticalPosition: 1000 }),
                prosePara(`FT5${"abcd"[index]} after`, 200),
            ]),
        ),
        ...probe("FT6a", [
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({ children: [cell([prosePara("FT6a cell", 20), floating("FT6a"), prosePara("FT6a cell after", 80)])] }),
                ],
            }),
        ]),
    ]),
    {
        properties: { ...PAGE },
        headers: {
            default: new Header({
                children: [para("FT6b header", 20), floating("FT6b", 3, { absoluteVerticalPosition: 300 }), para("FT6b header after", 40)],
            }),
        },
        children: [...probe("FT6b", [prosePara("FT6b", 200)])],
    },
    {
        properties: { ...PAGE },
        headers: { default: new Header({ children: [] }) },
        children: [
            ...probe("FT6c", [
                new Paragraph({
                    children: [
                        new TextRun(`FT6c ${prose(20)}`),
                        footnote(para("FT6c note", 20), floating("FT6c"), para("FT6c note after", 60)),
                    ],
                }),
            ]),
            ...probe("FT7a", [prosePara("FT7a", 30), floating("FT7a"), prosePara("FT7a after", 150)]),
            ...probe("FT7b", [prosePara("FT7b", 30), floating("FT7b"), prosePara("FT7b after", 150)]),
            ...probe("FT7c", [prosePara("FT7c", 30), floating("FT7c"), prosePara("FT7c after", 150)]),
            ...probe("FT8a", [
                prosePara("FT8a", 20),
                floating("FT8a", 4, { overlap: OverlapType.NEVER, absoluteVerticalPosition: 300 }),
                floating("FT8a second", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 3500, absoluteVerticalPosition: 800 }),
                prosePara("FT8a after", 200),
            ]),
            ...probe("FT8b", [
                prosePara("FT8b", 20),
                floating("FT8b", 4, { overlap: OverlapType.NEVER, absoluteVerticalPosition: 300 }),
                floating("FT8b second", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 3000, absoluteVerticalPosition: 700 }),
                prosePara("FT8b after", 200),
            ]),
            ...probe("FT8c", [
                prosePara("FT8c", 20),
                floating("FT8c", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 1000, absoluteVerticalPosition: 300 }),
                floating("FT8c second", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 2000, absoluteVerticalPosition: 500 }),
                floating("FT8c third", 4, { overlap: OverlapType.NEVER, absoluteHorizontalPosition: 3000, absoluteVerticalPosition: 700 }),
                prosePara("FT8c after", 200),
            ]),
            // Frames
            ...probe("FR1a", [
                new Paragraph({ ...frame(), children: [new TextRun("FR1a frame")] }),
                plainTable("FR1a"),
                prosePara("FR1a after", 150),
            ]),
        ],
    },
    section([
        ...probe("FR1b", [prosePara("FR1b", 20), new Paragraph({ ...frame(), children: [new TextRun("FR1b frame")] })], { below: false }),
    ]),
    section([line("FR1b below"), prosePara("FR1b after", 150)], { type: SectionType.CONTINUOUS }),
    section([
        ...probe("FR1c", [prosePara("FR1c", 20), new Paragraph({ ...frame(), children: [new TextRun("FR1c frame")] })], { below: false }),
    ]),
    section([
        line("FR1c below"),
        prosePara("FR1c after", 150),
        ...probe("FR1d", [
            new Paragraph({ ...frame(), children: [new TextRun("FR1d frame 1")] }),
            new Paragraph({ ...frame(), children: [new TextRun("FR1d frame 2")] }),
            plainTable("FR1d"),
            prosePara("FR1d after", 150),
        ]),
        ...[
            [4, 0],
            [4, 4],
            [12, 4],
            [24, 4],
            [4, 12],
            [4, 31],
        ].flatMap(([size, space], index) =>
            probe(`FR2${"abcdef"[index]}`, [
                new Paragraph({ ...frame(1000, 3000), border: boxed(size, space), children: [new TextRun(`FR2${"abcdef"[index]} frame`)] }),
                prosePara(`FR2${"abcdef"[index]}`, 200),
            ]),
        ),
        ...probe("FR2g", [
            new Paragraph({ ...frame(1000, 3000), border: boxed(12, 4, ["left"]), children: [new TextRun("FR2g frame")] }),
            prosePara("FR2g", 200),
        ]),
        ...probe("FR2h", [
            new Paragraph({ ...frame(1000, 3000), border: boxed(12, 4, ["top", "bottom"]), children: [new TextRun("FR2h frame")] }),
            prosePara("FR2h", 200),
        ]),
        ...probe("FR2i", [
            new Paragraph({
                ...frame(1000, 3000),
                border: boxed(12, 4, ["top", "bottom", "left", "right"], { shadow: true }),
                children: [new TextRun("FR2i frame")],
            }),
            prosePara("FR2i", 200),
        ]),
        ...probe("FR2j", [
            new Paragraph({
                ...frame(1000, 3000),
                border: { ...boxed(12, 4), between: border(12, 4) },
                children: [new TextRun("FR2j frame 1")],
            }),
            new Paragraph({
                ...frame(1000, 3000),
                border: { ...boxed(12, 4), between: border(12, 4) },
                children: [new TextRun("FR2j frame 2")],
            }),
            prosePara("FR2j", 200),
        ]),
        ...probe("FR3a", [
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({
                        children: [
                            cell([
                                new Paragraph({ ...frame(500, 300), children: [new TextRun("FR3a frame")] }),
                                prosePara("FR3a cell", 100),
                            ]),
                        ],
                    }),
                ],
            }),
        ]),
        ...probe("FR3b", [
            new Paragraph({
                children: [
                    new TextRun(`FR3b ${prose(20)}`),
                    footnote(new Paragraph({ ...frame(500, 300), children: [new TextRun("FR3b frame")] }), para("FR3b note", 80)),
                ],
            }),
        ]),
        ...probe("FR4", [
            new Paragraph({ style: "FramedStyle", ...frame(1500, 1500), children: [new TextRun("FR4 frame")] }),
            prosePara("FR4", 200),
        ]),
        ...probe("FR5a", [
            new Paragraph({ ...frame(1000, 3000), children: [new TextRun("FR5a frame"), footnote(line("FR5a note"))] }),
            prosePara("FR5a", 200),
        ]),
        ...probe("FR5b", [
            new Paragraph({ ...frame(1000, 3000), children: [new TextRun("FR5b frame"), new EndnoteReferenceRun(1)] }),
            prosePara("FR5b", 200),
        ]),
        ...["a", "b", "c"].flatMap((letter) =>
            probe(`FR6${letter}`, [
                new Paragraph({ ...frame(1000, 3000), children: [new TextRun(`FR6${letter} frame`)] }),
                prosePara(`FR6${letter}`, 200),
            ]),
        ),
        ...HR.flatMap((kind) => probe(`HR1${kind}`, headerRows(`HR1${kind}`, kind))),
        ...probe("FT1e", [prosePara("FT1e", 30), floating("FT1e")], { below: false }),
    ]),
];

await write({
    name: "word-stops-floats",
    sections,
    options: {
        endnotes: { 1: { children: [line("FR5b endnote")] } },
        styles: {
            paragraphStyles: [
                {
                    id: "FramedStyle",
                    name: "Framed Style",
                    basedOn: "Normal",
                    paragraph: {
                        frame: {
                            type: "absolute",
                            position: { x: 500, y: 500 },
                            width: 2000,
                            height: 800,
                            anchor: { horizontal: FrameAnchorType.MARGIN, vertical: FrameAnchorType.MARGIN },
                        },
                    },
                },
            ],
        },
    },
    injections: [
        // FT7a: no horzAnchor; FT7b: no vertAnchor; FT7c: lined up inline down the page
        (parts) => {
            const tables = parts.get("word/document.xml")!.split("<w:tbl>");
            const fix = (name: string, change: (xml: string) => string): void => {
                const index = tables.findIndex((part) => part.includes(`>${name} row 1<`));
                tables[index] = change(tables[index]);
            };
            fix("FT7a", (xml) => xml.replace(/ w:horzAnchor="[^"]*"/, ""));
            fix("FT7b", (xml) => xml.replace(/ w:vertAnchor="[^"]*"/, ""));
            fix("FT7c", (xml) => xml.replace(/ w:tblpY="[^"]*"/, ' w:tblpYSpec="inline"'));
            parts.set("word/document.xml", tables.join("<w:tbl>"));
        },
        // FR6a: no hAnchor; FR6b: no vAnchor; FR6c: yAlign inline
        (parts) => {
            let text = parts.get("word/document.xml")!;
            const fix = (name: string, change: (xml: string) => string): void => {
                const at = text.indexOf(`>${name} frame<`);
                const start = text.lastIndexOf("<w:framePr", at);
                const end = text.indexOf("/>", start) + 2;
                text = text.slice(0, start) + change(text.slice(start, end)) + text.slice(end);
            };
            fix("FR6a", (xml) => xml.replace(/ w:hAnchor="[^"]*"/, ""));
            fix("FR6b", (xml) => xml.replace(/ w:vAnchor="[^"]*"/, ""));
            fix("FR6c", (xml) => xml.replace(/ w:y="[^"]*"/, ' w:yAlign="inline"'));
            parts.set("word/document.xml", text);
        },
    ],
});
