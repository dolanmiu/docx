// cspell:ignore bbox
// Probes of Word's layout rules. Each probe starts a section on a new page, and each line's text names its probe, so the
// lines can be found in a PDF saved from Word with pdftotext -bbox-layout. Calibri 11, single spaced, no space after.
import * as fs from "fs";
import {
    BorderStyle,
    Document,
    Footer,
    FootnoteReferenceRun,
    Header,
    HeightRule,
    type ISectionOptions,
    Packer,
    PageBreak,
    Paragraph,
    SectionType,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

const border = (size: number) => ({ style: BorderStyle.SINGLE, size, color: "000000" });
const borders = (size: number) => ({
    top: border(size),
    bottom: border(size),
    left: border(size),
    right: border(size),
    insideHorizontal: border(size),
    insideVertical: border(size),
});
const table = (
    rows: readonly { text: string; height?: { value: number; rule: (typeof HeightRule)[keyof typeof HeightRule] }; cell?: Paragraph }[],
    options: { borders?: ReturnType<typeof borders>; margins?: { top: number; bottom: number } | "default" } = {},
): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        ...(options.borders === undefined ? { borders: TableBorders.NONE } : { borders: options.borders }),
        ...(options.margins === "default"
            ? {}
            : { margins: { top: options.margins?.top ?? 0, bottom: options.margins?.bottom ?? 0, left: 0, right: 0 } }),
        rows: rows.map(
            ({ text, height, cell }) =>
                new TableRow({ ...(height ? { height } : {}), children: [new TableCell({ children: [cell ?? line(text)] })] }),
        ),
    });
const rows = (probe: string, count: number) => Array.from({ length: count }, (_, i) => ({ text: `${probe} row ${i + 1}` }));

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
const footnote = (paragraph: Paragraph): FootnoteReferenceRun => {
    footnoteId++;
    footnotes[footnoteId] = { children: [paragraph] };
    return new FootnoteReferenceRun(footnoteId);
};

const emptyHeader = new Header({ children: [new Paragraph("")] });
const emptyFooter = new Footer({ children: [new Paragraph("")] });

const FONTS = [
    ["TNR", "Times New Roman"],
    ["Cal", "Calibri"],
    ["Cam", "Cambria"],
    ["Ari", "Arial"],
    ["Cou", "Courier New"],
] as const;
const SIZES = [8, 9, 10, 10.5, 11, 11.5, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 36];

const sections: ISectionOptions[] = [
    // P0: space before the first paragraph of the document
    { children: [line("P0 first of document before 1440", { spacing: { before: 1440 } }), line("P0 next")] },

    // P1: the space between two paragraphs, contextual spacing, and around a table
    {
        children: [
            line("P1 top"),
            line("P1a first after 400", { spacing: { after: 400 } }),
            line("P1a second before 200", { spacing: { before: 200 } }),
            line("P1b first after 200", { spacing: { after: 200 } }),
            line("P1b second before 400", { spacing: { before: 400 } }),
            line("P1c first after 400 contextual", { spacing: { after: 400 }, contextualSpacing: true }),
            line("P1c second before 400 contextual", { spacing: { before: 400 }, contextualSpacing: true }),
            line("P1d first after 400 contextual", { spacing: { after: 400 }, contextualSpacing: true }),
            line("P1d second before 200", { spacing: { before: 200 } }),
            line("P1e first after 400", { spacing: { after: 400 } }),
            line("P1e second before 200 contextual", { spacing: { before: 200 }, contextualSpacing: true }),
            line("P1f first after 400 contextual", { spacing: { after: 400 }, contextualSpacing: true }),
            line("P1f second before 200 contextual other style", { spacing: { before: 200 }, contextualSpacing: true, style: "Other" }),
            line("P1g above after 400", { spacing: { after: 400 } }),
            table(rows("P1g", 2)),
            line("P1g below before 400", { spacing: { before: 400 } }),
            line("P1h above"),
            table(rows("P1h", 2)),
            line("P1h below"),
            line("P1 end"),
        ],
    },

    // P2: the space before a paragraph at the top of a page, after each kind of break
    {
        children: [
            line("P2 top"),
            new Paragraph({ children: [new TextRun("P2a with page break"), new PageBreak()] }),
            line("P2a after page break before 1440", { spacing: { before: 1440 } }),
            line("P2b page break before, before 1440", { pageBreakBefore: true, spacing: { before: 1440 } }),
        ],
    },
    { children: [line("P2c top"), ...fill("P2c", 49), line("P2c natural break before 1440", { spacing: { before: 1440 } })] },
    { children: [line("P2d section start before 1440", { spacing: { before: 1440 } })] },

    // P3: widow and orphan control, unset, off and on, with a paragraph of 4 lines after k lines
    ...(["unset", "off", "on"] as const).flatMap((mode) =>
        [47, 48, 49, 50, 51].map((k) => ({
            children: [
                line(`P3 ${mode} ${k} top`),
                ...fill(`P3 ${mode} ${k}`, k - 1),
                lines(`P3 ${mode} ${k}`, 4, mode === "unset" ? {} : { widowControl: mode === "on" }),
                line(`P3 ${mode} ${k} after`),
            ],
        })),
    ),

    // P5: the height of table rows with borders, cell margins and set heights
    {
        children: [
            line("P5 top"),
            line("P5a above"),
            table(rows("P5a", 3)),
            line("P5a below"),
            line("P5b above"),
            table(rows("P5b", 3), { borders: borders(4) }),
            line("P5b below"),
            line("P5c above"),
            table(rows("P5c", 3), { borders: borders(24) }),
            line("P5c below"),
            line("P5d above"),
            table(rows("P5d", 3), { margins: { top: 100, bottom: 100 } }),
            line("P5d below"),
            line("P5 end"),
        ],
    },
    {
        children: [
            line("P5 top 2"),
            line("P5e above"),
            table(rows("P5e", 3), { borders: borders(24), margins: { top: 100, bottom: 100 } }),
            line("P5e below"),
            line("P5f above"),
            table([
                { text: "P5f atLeast 600", height: { value: 600, rule: HeightRule.ATLEAST } },
                { text: "P5f exact 600", height: { value: 600, rule: HeightRule.EXACT } },
                { text: "P5f auto" },
            ]),
            line("P5f below"),
            line("P5g above"),
            // A table as docx writes it without borders or margins given
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                rows: rows("P5g", 3).map(({ text }) => new TableRow({ children: [new TableCell({ children: [line(text)] })] })),
            }),
            line("P5g below"),
            line("P5 end 2"),
        ],
    },

    // P6: the line pitch of each font and size, 3 lines each, with the paragraph mark in the same font
    {
        children: [
            line("P6 top"),
            ...FONTS.flatMap(([short, font]) =>
                SIZES.flatMap((size) =>
                    [1, 2, 3].map(
                        (i) =>
                            new Paragraph({
                                run: { font, size: size * 2 },
                                children: [new TextRun({ text: `P6 ${short} ${size} ${i}`, font, size: size * 2 })],
                            }),
                    ),
                ),
            ),
        ],
    },
    // P6m: text smaller and larger than its paragraph mark (Calibri 11), one line and two lines
    {
        children: [
            line("P6m top"),
            ...[8, 16].flatMap((size) => [
                ...[1, 2, 3].map((i) => new Paragraph({ children: [new TextRun({ text: `P6m ${size} one ${i}`, size: size * 2 })] })),
                ...[1, 2, 3].map(
                    (i) =>
                        new Paragraph({
                            children: [
                                new TextRun({ text: `P6m ${size} two ${i}a`, size: size * 2 }),
                                new TextRun({ text: `P6m ${size} two ${i}b`, size: size * 2, break: 1 }),
                            ],
                        }),
                ),
            ]),
            line("P6m end"),
        ],
    },

    // P7a: three one-line footnotes on a full page
    {
        children: [
            line("P7a top"),
            new Paragraph({
                children: [
                    new TextRun("P7a refs"),
                    footnote(line("P7a note one")),
                    new TextRun(" more"),
                    footnote(line("P7a note two")),
                    new TextRun(" more"),
                    footnote(line("P7a note three")),
                ],
            }),
            ...fill("P7a", 60),
        ],
    },
    // P7b: an 8-line footnote whose reference is on line k
    ...[40, 44, 47].map((k) => ({
        children: [
            line(`P7b ${k} top`),
            ...fill(`P7b ${k}`, k - 2),
            new Paragraph({ children: [new TextRun(`P7b ${k} ref`), footnote(lines(`P7b ${k} note`, 8))] }),
            ...fill(`P7b ${k} after`, 20),
        ],
    })),
    // P7c: a one-line footnote whose reference is on line k
    ...[47, 48, 49, 50].map((k) => ({
        children: [
            line(`P7c ${k} top`),
            ...fill(`P7c ${k}`, k - 2),
            new Paragraph({ children: [new TextRun(`P7c ${k} ref`), footnote(line(`P7c ${k} note`))] }),
            ...fill(`P7c ${k} after`, 10),
        ],
    })),

    // P8: a table row of one cell with 4 lines, after k lines, and whether it breaks with widow control
    ...[47, 48, 49, 50].map((k) => ({
        children: [line(`P8 ${k} top`), ...fill(`P8 ${k}`, k - 1), table([{ text: "", cell: lines(`P8 ${k}`, 4) }]), line(`P8 ${k} after`)],
    })),

    // P9: columns before a continuous section break
    { children: [line("P9 top")] },
    { properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } }, children: fill("P9a", 21) },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("P9a after")] },
    { properties: { type: SectionType.CONTINUOUS, column: { count: 3, space: 360 } }, children: fill("P9b", 20) },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("P9b after")] },

    // P10: a paragraph of only spaces, smaller or larger than its mark (Calibri 11), between two lines
    {
        children: [
            line("P10 top"),
            ...(
                [
                    ["a empty", []],
                    ["b letter 8", [new TextRun({ text: "x", size: 16 })]],
                    ["c space 8", [new TextRun({ text: " ", size: 16 })]],
                    ["d spaces 8", [new TextRun({ text: "   ", size: 16 })]],
                    ["e space 2", [new TextRun({ text: " ", size: 4 })]],
                    ["f space 20", [new TextRun({ text: " ", size: 40 })]],
                ] as const
            ).flatMap(([name, children]) => [
                line(`P10${name} above`),
                new Paragraph({ children: [...children] }),
                line(`P10${name} below`),
            ]),
        ],
    },

    // P4: headers and footers of n lines, which push the body. Last, as later sections would take on their headers
    ...[1, 3, 6, 10].map((n) => ({
        headers: { default: new Header({ children: [lines(`P4 header ${n}`, n)] }) },
        footers: { default: emptyFooter },
        children: [line(`P4 header ${n} top`), ...fill(`P4 header ${n}`, 60)],
    })),
    ...[1, 3, 6, 10].map((n) => ({
        headers: { default: emptyHeader },
        footers: { default: new Footer({ children: [lines(`P4 footer ${n}`, n)] }) },
        children: [line(`P4 footer ${n} top`), ...fill(`P4 footer ${n}`, 60)],
    })),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [{ id: "Other", name: "Other", basedOn: "Normal" }],
    },
    footnotes,
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-rules.docx", buffer));
