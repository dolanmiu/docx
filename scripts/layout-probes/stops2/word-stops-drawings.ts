/**
 * Probes of pictures that text flows around (`wp:anchor`), where docx/layout stops after #3667 and #3671 followed
 * `word-floats.docx` (F1 to F40) and `word-floats2.docx` (G1 to G29); and of a picture floating in the header that the
 * body's text goes round, which docx/layout leaves out without stopping (`word-watertight-pages.docx` PG4).
 *
 * Each picture is grey, square or as the probe says, with square wrapping on both sides and 0.125 inches from the text
 * unless it says, in justified prose, so each line's ends show its room. Each probe starts a page. Calibri 11 on A4 with
 * inch margins. The pictures are named by their probe in their alternative text (`wp:docPr`).
 *
 * DR1a to DR1c: a picture of 1 inch in a table cell (a), in a footnote (b), in docx's text box (c)
 *   ("a drawing that text flows around in a table cell, footnote, endnote or text box")
 * DR2a to DR2e: two pictures of 1.5 inches that may not overlap (allowOverlap="0"), the second over the first: 1 inch to
 *   its right (a), 1 inch below it (b), on it (c), three over each other (d), and the first may overlap but not the
 *   second (e) ("drawings that text flows around that may not overlap, overlapping"; G3 had one case)
 * DR3a, DR3b: a picture placed against the character it is anchored at, 0.5 inches from it (a), lined up right of it (b)
 * DR4a to DR4d: a picture 30% as wide as the inside margin (wp14:sizeRelH insideMargin) (a), the outside margin (b), and
 *   as tall as 20% of the inside margin (c) and the outside margin (d) ("a drawing sized by a share of what isn't
 *   followed yet")
 * DR5a to DR5d: placed 0.5 inches from the inside margin (a) and the outside margin (b) across, and down (c, d), on an
 *   odd page ("a drawing placed against what isn't followed yet")
 * DR6a to DR6d: lined up inside (a) and outside (b) down the page, and down the margin (c, d)
 *   ("a drawing lined up in a way not yet followed")
 * DR7: a picture 1.5 inches tall placed 10 inches down the page, beside a page's footnotes
 * DR8: a picture placed 0.2 inches below the top of the page's text, top and bottom wrapping, its paragraph the last on
 *   the page, whose lines go round it and move the paragraph on ("a drawing whose paragraph goes on to the next page as the text before it goes
 *   round it")
 * DR9: a picture moving with its paragraph, 0.5 inches above it, with 0.5 inches from the text above it, its paragraph
 *   the first on a page ("a drawing that would go above the page's text, with a distance from the text above it")
 * DR10a to DR10c: a picture of 2 inches moving with its paragraph, which is 3 lines from the bottom of the page: in the
 *   second of 2 columns (a), at the top of a page after a page break (b), above a footnote (c)
 * DR11a, DR11b: a table sized to its text beside a picture of 1 inch on the left (a), and a table 4000 wide indented 1000
 *   below a picture of 1 inch on the left that it would go past (b)
 * DR12a, DR12b: a heading kept with the next beside a picture, with a picture of its own (a), and before a table (b)
 * DR13: two columns evened out by a continuous section break, a picture placed from the top of the page beside the text
 *   before the columns
 * DR14: a picture beside text of the section before on its page: a continuous section break, then a paragraph whose
 *   picture is placed from the top of the page
 * DR15: a picture placed by its simple position (simplePos="1", the offsets elsewhere)
 * DR16: a word with soft hyphens beside a picture 4.5 inches wide, 1.2 inches from the margin, which fits beside it only
 *   in part
 * DH1a to DH1e: a picture of 2 inches floating in the header, 3 inches down the page and 4.5 across, as PG4: with square
 *   wrapping on both sides (a, PG4 again), on the left only (b), top and bottom (c), in the first page's header (d),
 *   and in the footer, 8 inches down (e)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-drawings.ts [folder]
 */
import {
    AlignmentType,
    Footer,
    Header,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    type ISectionOptions,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    Textbox,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    WidthType,
} from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, footnote, line, para, probe, prose, softHyphens, write } from "./kit";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQImWNoaGgAAAMEAYEezv+mAAAAAElFTkSuQmCC", "base64");
const EMU = 914400;
const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED };

type Float = {
    readonly name: string;
    readonly size?: number;
    readonly height?: number;
    readonly x?: number;
    readonly y?: number;
    readonly across?: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    readonly down?: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    readonly alignAcross?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    readonly alignDown?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    readonly overlap?: boolean;
    readonly side?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
    readonly wrap?: (typeof TextWrappingType)[keyof typeof TextWrappingType];
};
/** A floating picture, its size in inches, placed in inches from what it is placed against */
const floating = ({
    name,
    size = 1,
    height = size,
    x = 2,
    y = 0.2,
    across,
    down,
    alignAcross,
    alignDown,
    overlap = true,
    side,
    wrap,
}: Float): ImageRun =>
    new ImageRun({
        type: "png",
        data: PNG,
        altText: { name, description: name, title: name },
        transformation: { width: size * 96, height: height * 96 },
        floating: {
            horizontalPosition: alignAcross
                ? { relative: across ?? HorizontalPositionRelativeFrom.MARGIN, align: alignAcross }
                : { relative: across ?? HorizontalPositionRelativeFrom.MARGIN, offset: x * EMU },
            verticalPosition: alignDown
                ? { relative: down ?? VerticalPositionRelativeFrom.PARAGRAPH, align: alignDown }
                : { relative: down ?? VerticalPositionRelativeFrom.PARAGRAPH, offset: y * EMU },
            allowOverlap: overlap,
            wrap: { type: wrap ?? TextWrappingType.SQUARE, side: side ?? TextWrappingSide.BOTH_SIDES },
            margins: { left: EMU / 8, right: EMU / 8, top: 0, bottom: 0 },
        },
    });

/** A justified paragraph of prose with pictures anchored at its start */
const anchoredIn = (name: string, words: number, ...pictures: ImageRun[]): Paragraph =>
    new Paragraph({ ...JUSTIFIED, children: [...pictures, new TextRun(`${name} ${prose(words)}`)] });

/** Changes the XML of the drawing named in its alternative text */
const drawingNamed = (name: string, change: (xml: string) => string) => (parts: Map<string, string>) => {
    for (const [path, text] of parts) {
        const at = text.indexOf(`name="${name}"`);
        if (at < 0 || !path.endsWith(".xml")) {
            continue;
        }
        const start = text.lastIndexOf("<wp:anchor", at);
        const end = text.indexOf("</wp:anchor>", at) + "</wp:anchor>".length;
        parts.set(path, text.slice(0, start) + change(text.slice(start, end)) + text.slice(end));
        return;
    }
    throw new Error(`No drawing ${name}`);
};
const positionH = (relativeFrom: string, inner: string) => (xml: string) =>
    xml.replace(/<wp:positionH [^>]*>.*?<\/wp:positionH>/, `<wp:positionH relativeFrom="${relativeFrom}">${inner}</wp:positionH>`);
const positionV = (relativeFrom: string, inner: string) => (xml: string) =>
    xml.replace(/<wp:positionV [^>]*>.*?<\/wp:positionV>/, `<wp:positionV relativeFrom="${relativeFrom}">${inner}</wp:positionV>`);
const relativeSize = (element: "sizeRelH" | "sizeRelV", from: string, share: number) => (xml: string) => {
    const inner =
        element === "sizeRelH" ? `<wp14:pctWidth>${share * 1000}</wp14:pctWidth>` : `<wp14:pctHeight>${share * 1000}</wp14:pctHeight>`;
    return xml.replace("</wp:anchor>", `<wp14:${element} relativeFrom="${from}">${inner}</wp14:${element}></wp:anchor>`);
};

const SOFT = "­";
const sections: ISectionOptions[] = [
    {
        properties: PAGE,
        children: [
            ...probe("DR1a", [
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [new TableRow({ children: [cell([anchoredIn("DR1a cell", 120, floating({ name: "DR1a", x: 1 }))])] })],
                }),
            ]),
            ...probe("DR1b", [
                new Paragraph({
                    children: [new TextRun(`DR1b ${prose(20)}`), footnote(anchoredIn("DR1b note", 120, floating({ name: "DR1b", x: 1 })))],
                }),
            ]),
            ...probe("DR1c", [
                new Paragraph({
                    children: [
                        new TextRun("DR1c "),
                        new Textbox({
                            style: { width: "400pt", height: "auto" },
                            children: [anchoredIn("DR1c box", 80, floating({ name: "DR1c", x: 1 }))],
                        }),
                    ],
                }),
            ]),
            ...probe("DR2a", [
                anchoredIn(
                    "DR2a",
                    250,
                    floating({ name: "DR2a1", size: 1.5, x: 1, overlap: false }),
                    floating({ name: "DR2a2", size: 1.5, x: 2, overlap: false }),
                ),
            ]),
            ...probe("DR2b", [
                anchoredIn(
                    "DR2b",
                    250,
                    floating({ name: "DR2b1", size: 1.5, x: 1, overlap: false }),
                    floating({ name: "DR2b2", size: 1.5, x: 1, y: 1.2, overlap: false }),
                ),
            ]),
            ...probe("DR2c", [
                anchoredIn(
                    "DR2c",
                    250,
                    floating({ name: "DR2c1", size: 1.5, x: 1, overlap: false }),
                    floating({ name: "DR2c2", size: 1.5, x: 1, overlap: false }),
                ),
            ]),
            ...probe("DR2d", [
                anchoredIn(
                    "DR2d",
                    300,
                    floating({ name: "DR2d1", size: 1.5, x: 1, overlap: false }),
                    floating({ name: "DR2d2", size: 1.5, x: 1.5, y: 0.5, overlap: false }),
                    floating({ name: "DR2d3", size: 1.5, x: 2, y: 1, overlap: false }),
                ),
            ]),
            ...probe("DR2e", [
                anchoredIn(
                    "DR2e",
                    250,
                    floating({ name: "DR2e1", size: 1.5, x: 1, overlap: true }),
                    floating({ name: "DR2e2", size: 1.5, x: 2, overlap: false }),
                ),
            ]),
            ...probe("DR3a", [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [
                        new TextRun(`DR3a ${prose(12)} `),
                        floating({ name: "DR3a", x: 0.5, across: HorizontalPositionRelativeFrom.CHARACTER }),
                        new TextRun(prose(200)),
                    ],
                }),
            ]),
            ...probe("DR3b", [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [
                        new TextRun(`DR3b ${prose(12)} `),
                        floating({
                            name: "DR3b",
                            across: HorizontalPositionRelativeFrom.CHARACTER,
                            alignAcross: HorizontalPositionAlign.RIGHT,
                        }),
                        new TextRun(prose(200)),
                    ],
                }),
            ]),
            ...["a", "b", "c", "d"].flatMap((letter) =>
                probe(`DR4${letter}`, [anchoredIn(`DR4${letter}`, 250, floating({ name: `DR4${letter}`, x: 1 }))]),
            ),
            ...["a", "b", "c", "d"].flatMap((letter) =>
                probe(`DR5${letter}`, [anchoredIn(`DR5${letter}`, 250, floating({ name: `DR5${letter}`, x: 1 }))]),
            ),
            ...["a", "b", "c", "d"].flatMap((letter, index) =>
                probe(`DR6${letter}`, [
                    anchoredIn(
                        `DR6${letter}`,
                        250,
                        floating({
                            name: `DR6${letter}`,
                            x: 1,
                            down: index < 2 ? VerticalPositionRelativeFrom.PAGE : VerticalPositionRelativeFrom.MARGIN,
                            alignDown: index % 2 === 0 ? VerticalPositionAlign.INSIDE : VerticalPositionAlign.OUTSIDE,
                        }),
                    ),
                ]),
            ),
            ...probe("DR7", [
                ...fill("DR7", 20),
                new Paragraph({ children: [new TextRun("DR7 reference"), footnote(...fill("DR7 note", 8))] }),
                anchoredIn("DR7 anchor", 200, floating({ name: "DR7", size: 1.5, x: 3, y: 10, down: VerticalPositionRelativeFrom.PAGE })),
            ]),
            ...probe("DR8", [
                ...fill("DR8", 46),
                anchoredIn(
                    "DR8 anchor",
                    80,
                    floating({
                        name: "DR8",
                        size: 1.5,
                        x: 0,
                        y: 0.2,
                        down: VerticalPositionRelativeFrom.MARGIN,
                        wrap: TextWrappingType.TOP_AND_BOTTOM,
                    }),
                ),
            ]),
            ...probe("DR9", [
                new Paragraph({
                    pageBreakBefore: true,
                    ...JUSTIFIED,
                    children: [floating({ name: "DR9", x: 2, y: -0.5 }), new TextRun(`DR9 first ${prose(200)}`)],
                }),
            ]),
        ],
    },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
        children: [
            line("DR10a above"),
            ...fill("DR10a", 98),
            anchoredIn("DR10a anchor", 60, floating({ name: "DR10a", size: 2, x: 0 })),
            line("DR10a below"),
        ],
    },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE },
        children: [
            ...probe("DR10b", [
                ...fill("DR10b", 48),
                new Paragraph({
                    pageBreakBefore: true,
                    ...JUSTIFIED,
                    children: [floating({ name: "DR10b", size: 2, x: 0 }), new TextRun(`DR10b anchor ${prose(60)}`)],
                }),
            ]),
            ...probe("DR10c", [
                ...fill("DR10c", 30),
                new Paragraph({ children: [new TextRun("DR10c reference"), footnote(...fill("DR10c note", 10))] }),
                ...fill("DR10c more", 4),
                anchoredIn("DR10c anchor", 60, floating({ name: "DR10c", size: 2, x: 0 })),
            ]),
            ...probe("DR11a", [
                anchoredIn("DR11a", 10, floating({ name: "DR11a", size: 1, x: 0 })),
                new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell("DR11a a"), cell("DR11a b")] })] }),
                para("DR11a after", 100, JUSTIFIED),
            ]),
            ...probe("DR11b", [
                anchoredIn("DR11b", 10, floating({ name: "DR11b", size: 1, x: 0 })),
                new Table({
                    indent: { size: 1000, type: WidthType.DXA },
                    width: { size: 4000, type: WidthType.DXA },
                    columnWidths: [4000],
                    borders: ALL_BORDERS,
                    rows: [new TableRow({ children: [cell("DR11b indented table")] })],
                }),
                para("DR11b after", 100, JUSTIFIED),
            ]),
            ...probe("DR12a", [
                ...fill("DR12a", 40),
                anchoredIn("DR12a", 30, floating({ name: "DR12a1", size: 1.5, x: 0 })),
                new Paragraph({
                    keepNext: true,
                    children: [floating({ name: "DR12a2", size: 1, x: 5 }), new TextRun("DR12a heading kept")],
                }),
                para("DR12a after", 100, JUSTIFIED),
            ]),
            ...probe("DR12b", [
                ...fill("DR12b", 40),
                new Paragraph({
                    keepNext: true,
                    children: [floating({ name: "DR12b", size: 1, x: 5 }), new TextRun("DR12b heading kept")],
                }),
                new Table({
                    borders: ALL_BORDERS,
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    rows: Array.from({ length: 12 }, (_, index) => new TableRow({ children: [cell(`DR12b row ${index + 1}`)] })),
                }),
            ]),
            ...probe(
                "DR13",
                [
                    anchoredIn(
                        "DR13 before",
                        40,
                        floating({ name: "DR13", size: 2, x: 3, y: 0.2, down: VerticalPositionRelativeFrom.MARGIN }),
                    ),
                ],
                { below: false },
            ),
        ],
    },
    { properties: { ...PAGE, type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } }, children: [...fill("DR13 column", 20)] },
    {
        properties: { ...PAGE, type: SectionType.CONTINUOUS },
        children: [line("DR13 below"), ...probe("DR14", [para("DR14 first section", 60, JUSTIFIED)], { below: false })],
    },
    {
        properties: { ...PAGE, type: SectionType.CONTINUOUS },
        children: [
            anchoredIn(
                "DR14 second section",
                100,
                floating({ name: "DR14", size: 1.5, x: 3, y: 0.3, down: VerticalPositionRelativeFrom.MARGIN }),
            ),
            line("DR14 below"),
            ...probe("DR15", [anchoredIn("DR15", 200, floating({ name: "DR15", size: 1.5, x: 2 }))]),
            ...probe("DR16", [
                new Paragraph({
                    ...JUSTIFIED,
                    children: [
                        floating({ name: "DR16", size: 4.5, x: 1.2 }),
                        new TextRun(`DR16 ${prose(8)} Donau${SOFT}dampf${SOFT}schiff${SOFT}fahrts${SOFT}gesell${SOFT}schaft ${prose(60)}`),
                    ],
                }),
            ]),
        ],
    },
    // DH1a to DH1e: the header's or footer's picture, which the body's text goes round
    ...(["a", "b", "c", "d", "e"] as const).map((letter): ISectionOptions => {
        const name = `DH1${letter}`;
        const picture = floating({
            name,
            size: 2,
            x: 4.5,
            y: letter === "e" ? 8 : 3,
            across: HorizontalPositionRelativeFrom.PAGE,
            down: VerticalPositionRelativeFrom.PAGE,
            side: letter === "b" ? TextWrappingSide.LEFT : TextWrappingSide.BOTH_SIDES,
            wrap: letter === "c" ? TextWrappingType.TOP_AND_BOTTOM : TextWrappingType.SQUARE,
        });
        const story = [new Paragraph({ children: [new TextRun(`${name} header `), picture] })];
        return {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE, ...(letter === "d" ? { titlePage: true } : {}) },
            headers:
                letter === "e"
                    ? { default: new Header({ children: [] }) }
                    : letter === "d"
                      ? { first: new Header({ children: story }), default: new Header({ children: [] }) }
                      : { default: new Header({ children: story }) },
            footers: letter === "e" ? { default: new Footer({ children: story }) } : { default: new Footer({ children: [] }) },
            children: [line(`${name} above`), para(name, 600, JUSTIFIED), line(`${name} below`)],
        };
    }),
];

await write({
    name: "word-stops-drawings",
    sections,
    injections: [
        softHyphens(),
        drawingNamed("DR4a", relativeSize("sizeRelH", "insideMargin", 30)),
        drawingNamed("DR4b", relativeSize("sizeRelH", "outsideMargin", 30)),
        drawingNamed("DR4c", relativeSize("sizeRelV", "insideMargin", 20)),
        drawingNamed("DR4d", relativeSize("sizeRelV", "outsideMargin", 20)),
        drawingNamed("DR5a", positionH("insideMargin", `<wp:posOffset>${EMU / 2}</wp:posOffset>`)),
        drawingNamed("DR5b", positionH("outsideMargin", `<wp:posOffset>${EMU / 2}</wp:posOffset>`)),
        drawingNamed("DR5c", positionV("insideMargin", `<wp:posOffset>${EMU / 2}</wp:posOffset>`)),
        drawingNamed("DR5d", positionV("outsideMargin", `<wp:posOffset>${EMU / 2}</wp:posOffset>`)),
        drawingNamed("DR15", (xml) =>
            xml
                .replace('simplePos="0"', 'simplePos="1"')
                .replace(/<wp:simplePos x="0" y="0"\/>/, `<wp:simplePos x="${EMU * 3}" y="${EMU * 4}"/>`),
        ),
        drawingNamed("DR9", (xml) => xml.replace(/distT="\d+"/, `distT="${EMU / 2}"`)),
    ],
});
