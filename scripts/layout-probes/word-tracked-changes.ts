/**
 * Probes of how Word lays out tracked changes where `word-watertight-markup.docx` (MK1 to MK6) didn't show it: which
 * paragraph's formatting a paragraph joined to the next by a deleted mark takes, deleted marks with no paragraph after
 * them to join, numbered paragraphs, deleted pictures, breaks, tabs and footnote references, moved text, and deleted and
 * inserted rows and cells. Each line's text names its probe, as in `word-watertight-markup.docx`, and lines above and
 * below each probe mark it off. Calibri 11 on A4 with 1440 margins, single spaced, no space before or after.
 * word-tracked-changes.py reads it.
 *
 * MK7: a deleted paragraph mark between paragraphs of different formatting. Which paragraph's alignment, spacing and
 *      style the joined paragraph takes: the first right-aligned with 400 before and 600 after, and the second plain
 *      (MK7a); the first deleted too (MK7b); the second right-aligned (MK7c); the first empty (MK7d); the first in a style
 *      of 16 points with 600 after (MK7e); the second in that style (MK7f)
 * MK8: a deleted paragraph mark with no paragraph after it to join: before a table (MK8a), at the end of a table cell
 *      (MK8b), the mark of a section break (MK8c, before a landscape section), and the document's last paragraph (MK8d)
 * MK9: numbered paragraphs: the second of four items deleted (MK9a), an item before a plain paragraph (MK9b), and a
 *      plain paragraph before an item (MK9c)
 * MK10: deleted content other than text: a picture an inch tall (MK10a), a page break (MK10b), a tab (MK10c), a line
 *       break (MK10d), a footnote reference before another (MK10e), and text moved from one paragraph to another (MK10f)
 * MK11: rows and cells: every row deleted (MK11a), a deleted row of a cell merged down (MK11b), the row it starts in
 *       deleted (MK11c), an inserted row (MK11d), a deleted cell (MK11e), an inserted cell (MK11f), and a deleted header
 *       row of a table across pages (MK11g). Whether a deleted row's text counts in the widths of a table sized to its
 *       text (MK11h), whether a deleted row's long word widens its column in a table whose cells have widths (MK11i), and
 *       whether deleted text counts in the widths of a table sized to its text (MK11j)
 *
 * Two more documents set the view of tracked changes a document asks Word to open in (`w:revisionView`), with a
 * deletion, an insertion and a deleted paragraph mark: `word-tracked-view-insdel.docx` turns off insertions and
 * deletions (MK12), and `word-tracked-view-markup.docx` turns off markup (MK13).
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore insdel
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import {
    AlignmentType,
    DeletedTextRun,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    ImageRun,
    InsertedTextRun,
    LevelFormat,
    PageBreak,
    PageOrientation,
    Packer,
    Paragraph,
    Tab,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    VerticalMergeType,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number, from = 0): string =>
    Array.from({ length: count }, (_, i) => WORDS[((i + from) * 7) % WORDS.length]).join(" ");

const DATE = "2026-10-02T09:00:00Z";
const REVISION = { author: "Watertight", date: DATE };
let id = 0;
const revision = () => ({ id: id++, ...REVISION });
const deleted = () => ({ deletion: revision() });

// Formatting that differs from the plain paragraphs': right-aligned, with space before and after
const SET_APART: Options = { alignment: AlignmentType.RIGHT, spacing: { before: 400, after: 600 } };

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

const WIDTH = 9026;
/** A table of one column the width of the text, with no borders or margins, so each row is a line */
const table = (rows: readonly TableRow[]): Table =>
    new Table({
        width: { size: WIDTH, type: WidthType.DXA },
        columnWidths: [WIDTH],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [...rows],
    });
const cell = (width: number, children: readonly Paragraph[], options: Partial<ConstructorParameters<typeof TableCell>[0]> = {}) =>
    new TableCell({ ...options, width: { size: width, type: WidthType.DXA }, children: [...children] });
/** A table of columns of these widths, with no borders or margins */
const grid = (widths: readonly number[], rows: readonly TableRow[]): Table =>
    new Table({
        width: { size: widths.reduce((total, width) => total + width, 0), type: WidthType.DXA },
        columnWidths: [...widths],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [...rows],
    });

/** A probe's paragraphs between a line above and a line below */
const between = (probe: string, ...children: readonly (Paragraph | Table)[]): readonly (Paragraph | Table)[] => [
    line(`${probe} above`),
    ...children,
    line(`${probe} below`),
];

/** A numbered paragraph of list `instance` */
const item = (text: string, instance: number, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, numbering: { reference: "probe", level: 0, instance }, children: [new TextRun(text)] });

// A word about 3000 twips long in Calibri 11, twice the width of MK11i's first column
// cspell:disable-next-line
const LONG_WORD = "Llanfairpwllgwyngyllgogerychwyrndrobwll";

// Moved text, written as runs in imprint (moved from) and emboss (moved to), which INJECTIONS wraps in w:moveFrom and w:moveTo
const MOVED = "alpha beta gamma";

const sections: ISectionOptions[] = [
    {
        children: [
            ...between("MK7a", new Paragraph({ ...SET_APART, run: deleted(), children: [new TextRun("MK7a first")] }), line("MK7a second")),
            ...between(
                "MK7b",
                new Paragraph({ ...SET_APART, run: deleted(), children: [new DeletedTextRun({ text: "MK7b first", ...revision() })] }),
                line("MK7b second"),
            ),
            ...between("MK7c", new Paragraph({ run: deleted(), children: [new TextRun("MK7c first")] }), line("MK7c second", SET_APART)),
            ...between("MK7d", new Paragraph({ ...SET_APART, run: deleted(), children: [] }), line("MK7d second")),
            ...between("MK7e", new Paragraph({ style: "Big", run: deleted(), children: [new TextRun("MK7e first")] }), line("MK7e second")),
            ...between(
                "MK7f",
                new Paragraph({ run: deleted(), children: [new TextRun("MK7f first")] }),
                line("MK7f second", { style: "Big" }),
            ),
        ],
    },
    {
        children: [
            ...between(
                "MK8a",
                new Paragraph({ run: deleted(), children: [new TextRun("MK8a first")] }),
                table([new TableRow({ children: [cell(WIDTH, [line("MK8a cell")])] })]),
            ),
            ...between(
                "MK8b",
                table([
                    new TableRow({
                        children: [
                            cell(WIDTH, [
                                new Paragraph({ run: deleted(), children: [new TextRun("MK8b one")] }),
                                new Paragraph({ run: deleted(), children: [new TextRun("MK8b two")] }),
                            ]),
                        ],
                    }),
                    new TableRow({ children: [cell(WIDTH, [line("MK8b next row")])] }),
                ]),
            ),
        ],
    },
    {
        children: [
            ...between("MK9a", item("MK9a one", 1), item("MK9a two", 1, { run: deleted() }), item("MK9a three", 1), item("MK9a four", 1)),
            ...between("MK9b", item("MK9b item", 2, { run: deleted() }), line("MK9b plain")),
            ...between("MK9c", new Paragraph({ run: deleted(), children: [new TextRun("MK9c plain")] }), item("MK9c item", 3)),
        ],
    },
    {
        children: [
            ...between(
                "MK10a",
                new Paragraph({
                    children: [
                        new TextRun("MK10a text "),
                        // Deleted by INJECTIONS, as DeletedTextRun writes a picture as a run in its run
                        new ImageRun({ type: "png", data: pixel(), transformation: { width: 96, height: 96 } }),
                        new TextRun(" end"),
                    ],
                }),
            ),
            ...between(
                "MK10c",
                new Paragraph({
                    children: [
                        new TextRun("MK10c left"),
                        new DeletedTextRun({ ...revision(), children: [new Tab()] }),
                        new TextRun("right"),
                    ],
                }),
            ),
            ...between(
                "MK10d",
                new Paragraph({
                    children: [new TextRun("MK10d before"), new DeletedTextRun({ ...revision(), break: 1 }), new TextRun("MK10d after")],
                }),
            ),
            ...between(
                "MK10e",
                new Paragraph({
                    children: [
                        new TextRun("MK10e text"),
                        new DeletedTextRun({ ...revision(), children: [new FootnoteReferenceRun(1)] }),
                        new TextRun(" more"),
                        new FootnoteReferenceRun(2),
                        new TextRun(" end"),
                    ],
                }),
            ),
            ...between(
                "MK10f",
                new Paragraph({
                    children: [new TextRun("MK10f from"), new TextRun({ text: ` ${MOVED}`, imprint: true }), new TextRun(" end")],
                }),
                new Paragraph({
                    children: [new TextRun("MK10f to"), new TextRun({ text: ` ${MOVED}`, emboss: true }), new TextRun(" end")],
                }),
            ),
        ],
    },
    {
        children: [
            ...between(
                "MK10b",
                new Paragraph({
                    children: [
                        new TextRun("MK10b before"),
                        new DeletedTextRun({ ...revision(), children: [new PageBreak()] }),
                        new TextRun("MK10b after"),
                    ],
                }),
            ),
        ],
    },
    {
        children: [
            ...between(
                "MK11a",
                table([1, 2].map((row) => new TableRow({ ...deleted(), children: [cell(WIDTH, [line(`MK11a row ${row}`)])] }))),
            ),
            ...between(
                "MK11b",
                grid(
                    [3000, 6026],
                    [1, 2, 3].map(
                        (row) =>
                            new TableRow({
                                ...(row === 2 ? deleted() : {}),
                                children: [
                                    cell(3000, row === 1 ? [line("MK11b merged")] : [new Paragraph({})], {
                                        verticalMerge: row === 1 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
                                    }),
                                    cell(6026, [line(`MK11b row ${row}`)]),
                                ],
                            }),
                    ),
                ),
            ),
            ...between(
                "MK11c",
                grid(
                    [3000, 6026],
                    [1, 2, 3].map(
                        (row) =>
                            new TableRow({
                                ...(row === 1 ? deleted() : {}),
                                children: [
                                    cell(3000, row === 1 ? [line("MK11c merged")] : [new Paragraph({})], {
                                        verticalMerge: row === 1 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
                                    }),
                                    cell(6026, [line(`MK11c row ${row}`)]),
                                ],
                            }),
                    ),
                ),
            ),
            ...between(
                "MK11d",
                table(
                    [1, 2, 3].map(
                        (row) =>
                            new TableRow({
                                ...(row === 2 ? { insertion: revision() } : {}),
                                children: [cell(WIDTH, [line(`MK11d row ${row}`)])],
                            }),
                    ),
                ),
            ),
            ...between(
                "MK11e",
                grid(
                    [3000, 3000, 3026],
                    [
                        new TableRow({
                            children: [
                                cell(3000, [line("MK11e left")]),
                                cell(3000, [line("MK11e middle")], { deletion: revision() }),
                                cell(3026, [line("MK11e right")]),
                            ],
                        }),
                    ],
                ),
            ),
            ...between(
                "MK11f",
                grid(
                    [3000, 3000, 3026],
                    [
                        new TableRow({
                            children: [
                                cell(3000, [line("MK11f left")]),
                                cell(3000, [line("MK11f middle")], { insertion: revision() }),
                                cell(3026, [line("MK11f right")]),
                            ],
                        }),
                    ],
                ),
            ),
        ],
    },
    {
        children: [
            ...between(
                "MK11h",
                new Table({
                    borders: TableBorders.NONE,
                    rows: [
                        new TableRow({
                            children: [new TableCell({ children: [line("MK11h a")] }), new TableCell({ children: [line("MK11h b")] })],
                        }),
                        new TableRow({
                            ...deleted(),
                            children: [
                                new TableCell({ children: [line(`MK11h ${prose(12)}`)] }),
                                new TableCell({ children: [line("MK11h c")] }),
                            ],
                        }),
                    ],
                }),
            ),
            ...between(
                "MK11i",
                grid(
                    [1500, 7526],
                    [
                        new TableRow({ children: [cell(1500, [line("MK11i a")]), cell(7526, [line("MK11i b")])] }),
                        new TableRow({ ...deleted(), children: [cell(1500, [line(`MK11i ${LONG_WORD}`)]), cell(7526, [line("MK11i c")])] }),
                    ],
                ),
            ),
            ...between(
                "MK11j",
                new Table({
                    borders: TableBorders.NONE,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun("MK11j a"),
                                                new DeletedTextRun({ text: ` ${prose(12)}`, ...revision() }),
                                            ],
                                        }),
                                    ],
                                }),
                                new TableCell({ children: [line("MK11j b")] }),
                            ],
                        }),
                    ],
                }),
            ),
        ],
    },
    {
        // MK11g: 70 rows, so the table goes on to a second page, whose first row shows whether the deleted header row is repeated
        children: [
            ...between(
                "MK11g",
                table([
                    new TableRow({ ...deleted(), tableHeader: true, children: [cell(WIDTH, [line("MK11g header")])] }),
                    ...Array.from({ length: 70 }, (_, row) => new TableRow({ children: [cell(WIDTH, [line(`MK11g row ${row + 1}`)])] })),
                ]),
            ),
        ],
    },
    {
        // MK8c: the paragraph that ends this section, which docx writes empty, has its mark deleted (INJECTIONS)
        children: [line("MK8c first section")],
    },
    {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [line("MK8c second section")],
    },
    {
        children: [line("MK8d above"), new Paragraph({ run: deleted(), children: [new TextRun("MK8d last")] })],
    },
];

/**
 * The XML docx can't write, which replaces a marker it can. Each is [what docx writes, what replaces it], in document.xml.
 */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    // MK10a: the picture in the line, deleted
    [
        /(MK10a text <\/w:t><\/w:r>)(<w:r><w:drawing>.*?<\/w:drawing><\/w:r>)/,
        `$1<w:del w:id="905" w:author="Watertight" w:date="${DATE}">$2</w:del>`,
    ],
    // MK8c: the mark of the empty paragraph that ends the section, deleted
    [
        /(MK8c first section<\/w:t><\/w:r><\/w:p><w:p><w:pPr>)(<w:sectPr)/,
        `$1<w:rPr><w:del w:id="900" w:author="Watertight" w:date="${DATE}"/></w:rPr>$2`,
    ],
    // MK10f: the run moved from, and the run moved to, with the ranges that pair them
    [
        /<w:r><w:rPr><w:imprint\/><\/w:rPr>(<w:t xml:space="preserve"> alpha beta gamma<\/w:t>)<\/w:r>/,
        `<w:moveFromRangeStart w:id="901" w:author="Watertight" w:date="${DATE}" w:name="move901"/>` +
            `<w:moveFrom w:id="902" w:author="Watertight" w:date="${DATE}"><w:r>$1</w:r></w:moveFrom><w:moveFromRangeEnd w:id="901"/>`,
    ],
    [
        /<w:r><w:rPr><w:emboss\/><\/w:rPr>(<w:t xml:space="preserve"> alpha beta gamma<\/w:t>)<\/w:r>/,
        `<w:moveToRangeStart w:id="903" w:author="Watertight" w:date="${DATE}" w:name="move901"/>` +
            `<w:moveTo w:id="904" w:author="Watertight" w:date="${DATE}"><w:r>$1</w:r></w:moveTo><w:moveToRangeEnd w:id="903"/>`,
    ],
];

const STYLES = {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    paragraphStyles: [
        { id: "Big", name: "Big", basedOn: "Normal", next: "Normal", run: { size: 32 }, paragraph: { spacing: { after: 600 } } },
    ],
};

const NUMBERING = {
    config: [
        {
            reference: "probe",
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
    ],
};

/** The text of a view probe: a deletion of 40 words in a paragraph (as MK1a), an insertion of 40 (as MK2a), and a deleted mark */
const viewProbe = (probe: string): ISectionOptions => ({
    children: [
        new Paragraph({
            children: [
                new TextRun(`${probe}a ${prose(60)} `),
                new DeletedTextRun({ text: `${prose(40, 60)} `, ...revision() }),
                new TextRun(prose(60, 100)),
            ],
        }),
        new Paragraph({
            children: [
                new TextRun(`${probe}b ${prose(60)} `),
                new InsertedTextRun({ text: `${prose(40, 60)} `, ...revision() }),
                new TextRun(prose(60, 100)),
            ],
        }),
        new Paragraph({ run: deleted(), children: [new TextRun(`${probe}c first`)] }),
        line(`${probe}c second`),
    ],
});

const write = async (name: string, doc: Document, inject: (part: string, xml: string) => string): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    for (const part of ["word/document.xml", "word/settings.xml"]) {
        zip.file(part, inject(part, await zip.file(part)!.async("string")));
    }
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

const main = async (): Promise<void> => {
    await write(
        "word-tracked-changes",
        new Document({
            styles: STYLES,
            numbering: NUMBERING,
            footnotes: { 1: { children: [line("MK10e deleted note")] }, 2: { children: [line("MK10e kept note")] } },
            sections,
        }),
        (part, xml) =>
            part === "word/document.xml"
                ? INJECTIONS.reduce((text, [marker, replacement]) => {
                      if (!marker.test(text)) {
                          throw new Error(`No ${marker} to replace`);
                      }
                      return text.replace(marker, replacement);
                  }, xml)
                : xml,
    );
    // The view a document asks for comes after w:displayBackgroundShape, which docx writes first, in the settings' order
    for (const [name, probe, view] of [
        ["word-tracked-view-insdel", "MK12", 'w:insDel="0"'],
        ["word-tracked-view-markup", "MK13", 'w:markup="0"'],
    ] as const) {
        await write(name, new Document({ styles: STYLES, sections: [viewProbe(probe)] }), (part, xml) => {
            if (part !== "word/settings.xml") {
                return xml;
            }
            if (!xml.includes("<w:displayBackgroundShape/>")) {
                throw new Error("No w:displayBackgroundShape to put the view after");
            }
            return xml.replace("<w:displayBackgroundShape/>", `<w:displayBackgroundShape/><w:revisionView ${view}/>`);
        });
    }
};

void main();
