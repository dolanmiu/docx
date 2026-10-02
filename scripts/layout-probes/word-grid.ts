/**
 * Probes of how Word lays out a document grid (`w:docGrid` of type `lines`, `linesAndChars` and `snapToChars`), which
 * docx/layout stopped at. Each probe starts a page, and each line's text names its probe, so the lines can be found in a
 * PDF saved from Word with pdftotext -bbox-layout, which word-grid.py reads. A4 with 1440 margins, so the text is 1440
 * to 15398 twips down the page and 9026 twips wide, no space before or after, single spaced. The grid is 360 twips (18
 * points) a line unless a probe says otherwise. The document's Normal is MS Mincho 10.5 for East Asian text and Times New
 * Roman 10.5 for Latin, as Japanese documents have it, and the probes give their fonts and sizes themselves.
 *
 * G1a to G1g: a line of each size from 6 to 40 points, by half points, in Times New Roman, Calibri, MS Mincho, Yu Mincho,
 *      SimSun, Microsoft YaHei and Malgun Gothic, each after a line of Times New Roman 8 to read it against: how many of
 *      the grid's lines each takes, and from what size
 * G2:  the first line of a page in each of 7 fonts and sizes: where its text is in its line of the grid
 * G3:  multiple line spacing of 0.5 to 3 lines on the grid, over fonts that take one line of it and two
 * G4:  exact and at-least line spacing on the grid
 * G5:  space before and after paragraphs on the grid: whether the lines after it are moved onto the grid's lines
 * G6:  space before and after in lines (`w:beforeLines`, `w:afterLines`) on grids of 360 and 312
 * G7:  `w:snapToGrid` off in a paragraph, in its style, and in a run
 * G8:  lines in a table's cells on the grid
 * G9:  a header, a footer and a footnote of a section with a grid. The sections after it have its header and footer too,
 *      as a section without its own has the one of the section before
 * G10: grids of 240, 312, 200 and 500 twips
 * G11: a picture in the line, two sizes in a line, a paragraph's borders, emphasis marks and `w:textAlignment` on the grid
 * G12: a continuous section with a grid between two without: whether its lines are on the grid of the page
 * G13: a grid of type `lines` without its pitch (`w:linePitch`)
 * G14: how many lines go on a page of the grid, single spaced and at 1.5 lines, and with a page whose text is 38.5 of the
 *      grid's lines tall
 *
 * CA: a grid of lines and characters (`linesAndChars`) with `w:charSpace` 4096 (a point), CB: with -1365 (a third of a
 * point less), CC: a grid that snaps to characters (`snapToChars`) with 4096, CD: with 0. In each, after a label:
 *   1: 100 ideographs of MS Mincho 10.5, 2: of MS Mincho 12, 3: words of i and m in Times New Roman 10.5, 4: ideographs
 *   with Latin words between them, 5: ideographs in a run with `w:snapToGrid` off, 6: indents of 2 characters left and
 *   first line, 7: justified ideographs and Latin words, 8: kana of MS PMincho, 9: half-width katakana, 10: Latin words
 *   and ideographs with `w:adjustRightInd` off, 11: ideographs in a paragraph with `w:snapToGrid` off
 *
 * word-grid2.docx, the second document this writes, has its Normal style at 12 points and the document's default at 10.5,
 * to show which the character grid is measured from: E1 snaps to characters with `w:charSpace` 0 and E2 is of lines and
 * characters with 4096, each with ideographs of MS Mincho 10.5 and 12.
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-grid.ts, which writes build/word-probes/word-grid.docx and
 * word-grid2.docx
 */
// cspell:ignore bbox IHDR IDAT IEND PMincho linesAndChars snapToChars charSpace linePitch beforeLines afterLines adjustRightInd
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    DocumentGridType,
    EmphasisMarkType,
    FootnoteReferenceRun,
    Footer,
    Header,
    type ISectionOptions,
    type IStylesOptions,
    ImageRun,
    LineRuleType,
    Packer,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Run = ConstructorParameters<typeof TextRun>[0] & object;
type Grid = NonNullable<NonNullable<ISectionOptions["properties"]>["grid"]>;

const LINES: Grid = { type: DocumentGridType.LINES, linePitch: 360 };
const pitch = (linePitch: number): Grid => ({ type: DocumentGridType.LINES, linePitch });

const IDEOGRAPH = "永";
const ideographs = (count: number): string => IDEOGRAPH.repeat(count);
const KANA = "あいうえおかきくけこさしすせそたちつてと";
const HALF_KATAKANA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ";

/** Line spacing of this many lines, as Word writes it in 240ths */
const multiple = (lines: number): Options["spacing"] => ({ line: Math.round(lines * 240), lineRule: LineRuleType.AUTO });

/** A run in a font, at a size in points, for both its Latin and East Asian text */
const inFont = (text: string, font: string, points: number, more: Run = {}): TextRun =>
    new TextRun({ text, font: { ascii: font, hAnsi: font, eastAsia: font, cs: font }, size: points * 2, ...more });
const tnr = (text: string, points = 12, more: Run = {}): TextRun => inFont(text, "Times New Roman", points, more);
const mincho = (text: string, points = 10.5, more: Run = {}): TextRun => inFont(text, "MS Mincho", points, more);

/** A paragraph of lines broken by line breaks, each naming its probe and its number */
const broken = (label: string, count: number, run: (text: string) => TextRun, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => [...(i > 0 ? [new TextRun({ break: 1 })] : []), run(`${label} ${i + 1}`)]).flat(),
    });

/** A small label before a probe of characters on a line */
const label = (text: string): Paragraph => new Paragraph({ children: [tnr(text, 8)] });

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
/** A picture in the line, this many points tall and 20 wide */
const picture = (points: number): ImageRun =>
    new ImageRun({ type: "png", data: PIXEL, transformation: { width: (20 * 96) / 72, height: (points * 96) / 72 } });

/**
 * Paragraph properties docx doesn't write, put in after the paragraph's style by its id, or before its mark's run
 * properties for `w:textAlignment`, which comes after the others in the schema
 */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/<w:pStyle w:val="SnapOff"\/>/g, '<w:pStyle w:val="SnapOff"/><w:snapToGrid w:val="0"/>'],
    [/<w:pStyle w:val="AdjustOff"\/>/g, '<w:pStyle w:val="AdjustOff"/><w:adjustRightInd w:val="0"/>'],
    [/(<w:pStyle w:val="AlignCenter"\/>(?:(?!<\/w:pPr>).)*?)(<w:rPr>|<\/w:pPr>)/g, '$1<w:textAlignment w:val="center"/>$2'],
    // G6: the space before and after in lines
    [/w:before="7771"/g, 'w:beforeLines="100"'],
    [/w:before="7772"/g, 'w:beforeLines="50"'],
    [/w:after="7773"/g, 'w:afterLines="100"'],
    // G13: a grid of lines without its pitch
    [/<w:docGrid w:type="lines" w:linePitch="3333"\/>/g, '<w:docGrid w:type="lines"/>'],
];
// G7: a style with snapToGrid off, whose paragraph properties docx writes empty
const STYLE_INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/(<w:style w:type="paragraph" w:styleId="SnapOffStyle">(?:(?!<\/w:style>).)*?<w:pPr>)/g, '$1<w:snapToGrid w:val="0"/>'],
];

/** The marker styles the injections find, which change nothing themselves */
const MARKER_STYLES: IStylesOptions["paragraphStyles"] = [
    { id: "SnapOff", name: "Snap Off", basedOn: "Normal" },
    { id: "AdjustOff", name: "Adjust Off", basedOn: "Normal" },
    { id: "AlignCenter", name: "Align Center", basedOn: "Normal" },
    { id: "SnapOffStyle", name: "Snap Off Style", basedOn: "Normal", paragraph: { spacing: { before: 0 } } },
];

// G1: the fonts of the ramps, with the text of their lines
const RAMP_FONTS: readonly (readonly [string, string])[] = [
    ["Times New Roman", "Hxg"],
    ["Calibri", "Hxg"],
    ["MS Mincho", ideographs(3)],
    ["Yu Mincho", ideographs(3)],
    ["SimSun", ideographs(3)],
    ["Microsoft YaHei", ideographs(3)],
    ["Malgun Gothic", "가나다"],
];
const RAMP_SIZES = Array.from({ length: 69 }, (_, i) => 6 + i / 2);

const ramp = ([font, text]: readonly [string, string], index: number): ISectionOptions => {
    const name = `G1${"abcdefg"[index]}`;
    return {
        properties: { grid: LINES },
        children: RAMP_SIZES.flatMap((size) => [
            new Paragraph({ children: [tnr(`${name} r${size}`, 8)] }),
            new Paragraph({ children: [inFont(`${name} ${size} ${text}`, font, size)] }),
        ]),
    };
};

/** A section of probes of lines, each a paragraph of 6 lines broken by line breaks */
const brokenProbes = (grid: Grid, probes: readonly (readonly [string, (text: string) => TextRun, Options?])[]): ISectionOptions => ({
    properties: { grid },
    children: probes.map(([name, run, options]) => broken(name, 6, run, options)),
});

/** 3 lines of Times New Roman 12 in a paragraph */
const three = (name: string, options: Options = {}): Paragraph => broken(name, 3, (text) => tnr(text), options);

const FOOTNOTES: Readonly<Record<number, { readonly children: readonly Paragraph[] }>> = {
    1: { children: [broken("G9 note", 4, (text) => tnr(text, 10))] },
};

const CHAR_PROBES = (name: string): readonly Paragraph[] => {
    const latin = (count: number): string => Array.from({ length: count }, (_, i) => (i % 2 === 0 ? "iiiiiiiiii" : "mmmmmmmmmm")).join(" ");
    const mixed = (count: number): string => Array.from({ length: count }, () => `${ideographs(5)}abc de`).join("");
    return [
        label(`${name}1`),
        new Paragraph({ children: [mincho(ideographs(100))] }),
        label(`${name}2`),
        new Paragraph({ children: [mincho(ideographs(100), 12)] }),
        label(`${name}3`),
        new Paragraph({ children: [tnr(latin(24), 10.5)] }),
        label(`${name}4`),
        new Paragraph({ children: [mincho(mixed(10))] }),
        label(`${name}5`),
        new Paragraph({ children: [mincho(ideographs(100), 10.5, { snapToGrid: false })] }),
        label(`${name}6`),
        new Paragraph({ indent: { left: 0, firstLine: 0 }, children: [mincho(ideographs(100))] }),
        label(`${name}7`),
        new Paragraph({ alignment: AlignmentType.BOTH, children: [mincho(mixed(10))] }),
        label(`${name}8`),
        new Paragraph({ children: [inFont(KANA.repeat(5), "MS PMincho", 10.5)] }),
        label(`${name}9`),
        new Paragraph({ children: [mincho(HALF_KATAKANA.repeat(8))] }),
        label(`${name}10`),
        new Paragraph({ style: "AdjustOff", children: [mincho(mixed(10))] }),
        label(`${name}11`),
        new Paragraph({ style: "SnapOff", children: [mincho(ideographs(100))] }),
    ];
};
// CA6 to CD6: indents of 2 characters, which docx writes as firstLineChars, and leftChars by injection
const CHAR_INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/<w:ind w:left="0" w:firstLine="0"\/>/g, '<w:ind w:leftChars="200" w:firstLineChars="200"/>'],
];

const sections: ISectionOptions[] = [
    ...RAMP_FONTS.map(ramp),

    // G2: the first line of a page in each font and size, followed by 2 more of it
    {
        properties: { grid: LINES },
        children: (
            [
                ["Times New Roman", 8],
                ["Times New Roman", 12],
                ["Times New Roman", 20],
                ["Calibri", 11],
                ["MS Mincho", 10.5],
                ["Yu Mincho", 10.5],
                ["MS Mincho", 20],
            ] as const
        ).map(
            ([font, size], i) =>
                new Paragraph({
                    pageBreakBefore: i > 0,
                    children: [0, 1, 2].flatMap((line) => [
                        ...(line > 0 ? [new TextRun({ break: 1 })] : []),
                        inFont(`G2${"abcdefg"[i]} ${line + 1} ${font.includes("Mincho") ? IDEOGRAPH : "Hxg"}`, font, size),
                    ]),
                }),
        ),
    },

    // G3a to G3i: Times New Roman 12 at 0.5, 0.8, 1, 1.08, 1.15, 1.5, 2, 2.5 and 3 lines. G3j, G3k: Times New Roman 20
    // at 1.5 and 0.8. G3l, G3m: Calibri 11 at 1.08 and 1.15. G3n, G3o: MS Mincho 10.5 at 1.5 and 2. G3p: Yu Mincho 10.5
    // at 1.15
    brokenProbes(LINES, [
        ...([0.5, 0.8, 1, 1.08, 1.15, 1.5, 2, 2.5, 3] as const).map(
            (lines, i) => [`G3${"abcdefghi"[i]}`, (text: string) => tnr(text), { spacing: multiple(lines) }] as const,
        ),
        ["G3j", (text) => tnr(text, 20), { spacing: multiple(1.5) }],
        ["G3k", (text) => tnr(text, 20), { spacing: multiple(0.8) }],
        ["G3l", (text) => inFont(text, "Calibri", 11), { spacing: multiple(1.08) }],
        ["G3m", (text) => inFont(text, "Calibri", 11), { spacing: multiple(1.15) }],
        ["G3n", (text) => mincho(`${text} ${IDEOGRAPH}`), { spacing: multiple(1.5) }],
        ["G3o", (text) => mincho(`${text} ${IDEOGRAPH}`), { spacing: multiple(2) }],
        ["G3p", (text) => inFont(`${text} ${IDEOGRAPH}`, "Yu Mincho", 10.5), { spacing: multiple(1.15) }],
    ]),

    // G4a to G4d: Times New Roman 12 exactly 10, 12, 20 and 30 points. G4e to G4i: at least 10, 12, 20, 30 and 40 points.
    // G4j: Times New Roman 20 at least 20 points
    brokenProbes(LINES, [
        ...([10, 12, 20, 30] as const).map(
            (points, i) =>
                [`G4${"abcd"[i]}`, (text: string) => tnr(text), { spacing: { line: points * 20, lineRule: LineRuleType.EXACT } }] as const,
        ),
        ...([10, 12, 20, 30, 40] as const).map(
            (points, i) =>
                [
                    `G4${"efghi"[i]}`,
                    (text: string) => tnr(text),
                    { spacing: { line: points * 20, lineRule: LineRuleType.AT_LEAST } },
                ] as const,
        ),
        ["G4j", (text) => tnr(text, 20), { spacing: { line: 400, lineRule: LineRuleType.AT_LEAST } }],
    ]),

    // G5: paragraphs of 3 lines of Times New Roman 12 with no space, 6 points before, 9 after, 13 before, 18 before, 6
    // after and 27 before, then a page whose first paragraph has 12 points before
    {
        properties: { grid: LINES },
        children: [
            three("G5a"),
            three("G5b", { spacing: { before: 120 } }),
            three("G5c", { spacing: { after: 180 } }),
            three("G5d", { spacing: { before: 260 } }),
            three("G5e", { spacing: { before: 360 } }),
            three("G5f", { spacing: { after: 120 } }),
            three("G5g", { spacing: { before: 540 } }),
            three("G5h"),
            three("G5i", { pageBreakBefore: true, spacing: { before: 240 } }),
            three("G5j"),
        ],
    },

    // G6a: paragraphs of 3 lines with 1 line before, half a line before, 1 line after, on the grid of 360. G6b: the same
    // on a grid of 312
    ...([360, 312] as const).map((linePitch, i): ISectionOptions => ({
        properties: { grid: pitch(linePitch) },
        children: [
            three(`G6${"ab"[i]}1`),
            three(`G6${"ab"[i]}2`, { spacing: { before: 7771 } }),
            three(`G6${"ab"[i]}3`, { spacing: { before: 7772 } }),
            three(`G6${"ab"[i]}4`, { spacing: { after: 7773 } }),
            three(`G6${"ab"[i]}5`),
        ],
    })),

    // G7a: Times New Roman 12 with snapToGrid off in the paragraph, G7b: Times New Roman 20, G7c: in its style. G7d: in
    // its runs, G7e: on, to read them against
    {
        properties: { grid: LINES },
        children: [
            broken("G7a", 6, (text) => tnr(text), { style: "SnapOff" }),
            broken("G7b", 6, (text) => tnr(text, 20), { style: "SnapOff" }),
            broken("G7c", 6, (text) => tnr(text), { style: "SnapOffStyle" }),
            broken("G7d", 6, (text) => tnr(text, 12, { snapToGrid: false })),
            broken("G7e", 6, (text) => tnr(text)),
        ],
    },

    // G8: a table of one column on the grid: rows of a line of Times New Roman 12, a row of 3 lines, a row of Times New
    // Roman 20, and a row of MS Mincho 10.5, then a paragraph after it
    {
        properties: { grid: LINES },
        children: [
            three("G8 before"),
            new Table({
                columnWidths: [4000],
                rows: [
                    ...[1, 2, 3, 4].map((i) => new Paragraph({ children: [tnr(`G8 row ${i}`)] })),
                    broken("G8 three", 3, (text) => tnr(text)),
                    new Paragraph({ children: [tnr("G8 big", 20)] }),
                    new Paragraph({ children: [mincho(`G8 mincho ${IDEOGRAPH}`)] }),
                    new Paragraph({ children: [tnr("G8 last")] }),
                ].map(
                    (paragraph) =>
                        new TableRow({ children: [new TableCell({ width: { size: 4000, type: WidthType.DXA }, children: [paragraph] })] }),
                ),
            }),
            three("G8 after"),
        ],
    },

    // G9: a header of 3 lines of Times New Roman 10 that would push the text down if it is on the grid, a footer of 2,
    // and a footnote of 4
    {
        properties: { grid: LINES, page: { margin: { top: 1440, header: 720, footer: 720 } } },
        headers: { default: new Header({ children: [broken("G9 head", 3, (text) => tnr(text, 10))] }) },
        footers: { default: new Footer({ children: [broken("G9 foot", 2, (text) => tnr(text, 10))] }) },
        children: [
            new Paragraph({ children: [tnr("G9 body 1"), new FootnoteReferenceRun(1)] }),
            ...[2, 3, 4, 5, 6].map((i) => new Paragraph({ children: [tnr(`G9 body ${i}`)] })),
        ],
    },

    // G10a, G10b: Times New Roman 12 and 10 on a grid of 240. G10c: MS Mincho 10.5 on 312. G10d: Times New Roman 10 on
    // 200. G10e: Times New Roman 12 on 500
    brokenProbes(pitch(240), [
        ["G10a", (text) => tnr(text)],
        ["G10b", (text) => tnr(text, 10)],
    ]),
    brokenProbes(pitch(312), [["G10c", (text) => mincho(`${text} ${IDEOGRAPH}`)]]),
    brokenProbes(pitch(200), [["G10d", (text) => tnr(text, 10)]]),
    brokenProbes(pitch(500), [["G10e", (text) => tnr(text)]]),

    // G11a: a 30-point picture beside Times New Roman 12. G11b: Times New Roman 12 with a word of 20. G11c: borders above
    // and below a paragraph of 3 lines. G11d: emphasis marks on MS Mincho 10.5. G11e: Times New Roman 12 with a word of
    // 20, centred (`w:textAlignment`)
    {
        properties: { grid: LINES },
        children: [
            ...[1, 2, 3, 4].map((i) => new Paragraph({ children: [tnr(`G11a ${i} `), picture(30)] })),
            ...[1, 2, 3, 4].map((i) => new Paragraph({ children: [tnr(`G11b ${i} `), tnr("big", 20)] })),
            three("G11c", {
                border: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 },
                },
            }),
            three("G11 after"),
            ...[1, 2, 3, 4].map(
                (i) =>
                    new Paragraph({
                        children: [mincho(`G11d ${i} `), mincho(ideographs(4), 10.5, { emphasisMark: { type: EmphasisMarkType.DOT } })],
                    }),
            ),
            ...[1, 2, 3, 4].map((i) => new Paragraph({ style: "AlignCenter", children: [tnr(`G11e ${i} `), tnr("big", 20)] })),
        ],
    },

    // G12: 4 lines without a grid, a continuous section of 4 on the grid, and a continuous section of 4 without
    { children: [broken("G12a", 4, (text) => tnr(text, 12), { spacing: { after: 70 } })] },
    { properties: { type: SectionType.CONTINUOUS, grid: LINES }, children: [broken("G12b", 4, (text) => tnr(text))] },
    { properties: { type: SectionType.CONTINUOUS }, children: [broken("G12c", 4, (text) => tnr(text))] },

    // G13: a grid of lines without its pitch
    brokenProbes({ type: DocumentGridType.LINES, linePitch: 3333 }, [["G13", (text) => tnr(text)]]),

    // G14a: 45 lines of Times New Roman 12 on the grid. G14b: at 1.5 lines. G14c: on a page whose text is 38.5 lines of the
    // grid tall
    { properties: { grid: LINES }, children: [broken("G14a", 45, (text) => tnr(text))] },
    { properties: { grid: LINES }, children: [broken("G14b", 30, (text) => tnr(text), { spacing: multiple(1.5) })] },
    {
        properties: { grid: LINES, page: { margin: { top: 1440, bottom: 16838 - 1440 - 38.5 * 360 } } },
        children: [broken("G14c", 45, (text) => tnr(text))],
    },

    // CA to CD: the grids of characters
    ...(
        [
            ["CA", DocumentGridType.LINES_AND_CHARS, 4096],
            ["CB", DocumentGridType.LINES_AND_CHARS, -1365],
            ["CC", DocumentGridType.SNAP_TO_CHARS, 4096],
            ["CD", DocumentGridType.SNAP_TO_CHARS, 0],
        ] as const
    ).map(([name, type, charSpace]): ISectionOptions => ({
        properties: { grid: { type, linePitch: 360, charSpace } },
        children: CHAR_PROBES(name),
    })),
];

const DEFAULTS: IStylesOptions["default"] = {
    document: {
        run: {
            font: { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "MS Mincho" },
            size: 21,
            language: { eastAsia: "ja-JP" },
        },
        paragraph: { spacing: { before: 0, after: 0, line: 240 } },
    },
};

const doc = new Document({
    styles: { default: DEFAULTS, paragraphStyles: MARKER_STYLES },
    footnotes: FOOTNOTES,
    sections,
});

// word-grid2: the Normal style at 12 points, over the document's default of 10.5
const doc2 = new Document({
    styles: { default: DEFAULTS, paragraphStyles: [{ id: "Normal", name: "Normal", run: { size: 24 } }] },
    sections: (
        [
            ["E1", DocumentGridType.SNAP_TO_CHARS, 0],
            ["E2", DocumentGridType.LINES_AND_CHARS, 4096],
        ] as const
    ).map(([name, type, charSpace]) => ({
        properties: { grid: { type, linePitch: 360, charSpace } },
        children: [
            label(`${name}a`),
            new Paragraph({ children: [mincho(ideographs(100))] }),
            label(`${name}b`),
            new Paragraph({ children: [mincho(ideographs(100), 12)] }),
        ],
    })),
});

const write = async (document: Document, name: string): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    const inject = (path: string, injections: readonly (readonly [RegExp, string])[]): Promise<void> =>
        zip
            .file(path)!
            .async("string")
            .then((xml) => {
                zip.file(
                    path,
                    injections.reduce((text, [marker, replacement]) => text.replace(marker, replacement), xml),
                );
            });
    await inject("word/document.xml", [...INJECTIONS, ...CHAR_INJECTIONS]);
    await inject("word/styles.xml", STYLE_INJECTIONS);
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    await write(doc, "word-grid");
    await write(doc2, "word-grid2");
};

void main();
