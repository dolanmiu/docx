/**
 * Probes of what Word does where docx/layout still stops and no task covers it, for the watertight inventory, with two
 * follow-ups of round 8. Each probe starts a page, and each line's text names its probe, so the lines can be found in a
 * PDF saved from Word with pdftotext -bbox-layout, which word-watertight.py reads. Calibri 11, single spaced, no space
 * before or after, on A4 with 1440 margins: 51 lines to a page. Footnotes are in 11 points too, so a footnote's line is as
 * tall as a body line. "fill" lines are one-line paragraphs; a probe named with a number has its reference on that line.
 *
 * SP1: a footnote continued on the next page in a section of 2 columns, referred to from line 48 of the first column,
 *      and of the second
 * SP2: a footnote longer than a page at the end of a section, before a section on a new page numbered from 1: which
 *      section its pages are in
 * SP3: a footnote that would break in a paragraph kept together, after one kept with the next, in a table row of 3
 *      lines, and in a table with a header row after its first rows
 * SP4: a footnote of a line kept with a 6-line paragraph, which doesn't fit with both
 * SP5: a line whose footnote is a paragraph kept together, taller than a page
 * SP6: footnotes from two continuous sections of 2 columns on one page
 * SP7: footnotes in 2 columns of 2000 and 6306 twips
 * SP8: a footnote in a section that starts in the next column, beside a first column that goes down further than the
 *      footnote leaves room for
 * SP9: a footnote from the last lines of the second column, which makes the first column shorter and moves its reference
 * SP10: a section that starts in the next column, of columns of other widths than the section before
 * SP11: a continuous section break after a section that started in the second of 3 columns
 * SP12: a paragraph kept together, taller than a column, in columns of 2000 and 6306 twips
 * SP13: a line kept with the next, before a paragraph kept together taller than a column
 * SP14: a table whose rows give its columns different widths: 3000 and 6026 in one row, 4000 and 5026 in the next
 * SP15: long words in tables whose cells have widths: longer than the page, and in a table wider than its cells
 * SP16: a table sized to its text that goes on from a column of 6306 twips into one of 2000
 * SP17: long words in cells merged across columns, in tables given no widths, of 3000 to 6000 twips
 * SP18: justified lines whose last word fits only with their spaces 3% to 33% narrower: how far Word squeezes them
 * SP19: a table style's 16-point bold first row, with tblLook firstRow on and off, where Normal has no size of its own,
 *       as in Word's templates (word-watertight-tables.ts TB8 had Normal's own 11 points, which won)
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Column,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    Packer,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Child = Paragraph | Table;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks, each "<probe> <word> <n>" */
const lines = (probe: string, count: number, options: Options = {}, word = "line"): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from(
            { length: count },
            (_, i) => new TextRun({ text: `${probe} ${word} ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
        ),
    });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
const footnote = (...children: Child[]): FootnoteReferenceRun => {
    footnoteId++;
    // A footnote can have a table in it, though the option's type only names paragraphs
    footnotes[footnoteId] = { children: children as Paragraph[] };
    return new FootnoteReferenceRun(footnoteId);
};
const withNote = (text: string, note: FootnoteReferenceRun, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun(text), note] });

const TWO = { count: 2, space: 720 };
const THREE = { count: 3, space: 720 };
const NARROW_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 2000, space: 720 }), new Column({ width: 6306 })] };
const WIDE_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 6306, space: 720 }), new Column({ width: 2000 })] };

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

/** A table of rows of cells, each given a width, or none for a table sized to its text */
const table = (
    rows: readonly (readonly { readonly text: string; readonly width?: number; readonly span?: number }[])[],
    options: Partial<ConstructorParameters<typeof Table>[0]> = {},
): Table =>
    new Table({
        borders,
        ...options,
        rows: rows.map(
            (cells) =>
                new TableRow({
                    children: cells.map(
                        ({ text, width, span }) =>
                            new TableCell({
                                ...(width === undefined ? {} : { width: { size: width, type: WidthType.DXA } }),
                                ...(span === undefined ? {} : { columnSpan: span }),
                                children: [line(text)],
                            }),
                    ),
                }),
        ),
    });

// A word of m's about this many twips wide in Calibri 11, whose m is 175.8 twips
const word = (twips: number): string => "m".repeat(Math.round(twips / 175.78));

/**
 * SP18: a justified paragraph whose first line's last word, "coast", fits only with the line's spaces this much narrower,
 * as the width tables measure Calibri, which matches Word's to 0.1% (TX17). One word before it has character spacing to
 * tune the width to a twentieth of a point
 */
const squeezed = (probe: string, share: number): Paragraph => {
    const width = 9026 / 20;
    const font = { font: "Calibri", size: 11 };
    const space = measureTextWidth(" ", font);
    const head = `${probe} ${Math.round(share * 100)}`;
    const filler = Array.from({ length: 40 }, (_, i) => WORDS[(i * 3) % WORDS.length]);
    // As many words as fit before the tuned word and "coast", leaving them less than a word's width over
    let count = filler.length;
    const text = (n: number): string => [head, ...filler.slice(0, n)].join(" ");
    while (count > 0 && measureTextWidth(`${text(count)} survey coast`, font) > width) {
        count--;
    }
    const spaces = count + 2;
    // "coast" overflows by this much, which the spaces would have to give up
    const over = share * spaces * space;
    const natural = measureTextWidth(`${text(count)} survey coast`, font) - width;
    // Character spacing on the 6 letters of "survey", in twips, to make the overflow `over`
    const spacing = Math.round(((over - natural) * 20) / 6);
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
            new TextRun(`${text(count)} `),
            new TextRun({ text: "survey", characterSpacing: spacing }),
            new TextRun(` coast ${prose(30)}`),
        ],
    });
};

const sections: ISectionOptions[] = [
    // SP1a, SP1b: a 12-line footnote referred to from line 48 of the first column, and of the second
    {
        properties: { column: TWO },
        children: [...fill("SP1a", 47), withNote("SP1a ref", footnote(lines("SP1a note", 12))), ...fill("SP1a after", 70)],
    },
    {
        properties: { column: TWO },
        children: [...fill("SP1b", 98), withNote("SP1b ref", footnote(lines("SP1b note", 12))), ...fill("SP1b after", 30)],
    },

    // SP2: a 120-line footnote from line 6 of a section's last page, then a section on a new page numbered from 1
    { children: [...fill("SP2", 5), withNote("SP2 ref", footnote(lines("SP2 note", 120)))] },
    {
        properties: { page: { pageNumbers: { start: 1 } } },
        children: Array.from(
            { length: 10 },
            (_, i) =>
                new Paragraph({
                    children: [
                        new TextRun({
                            children: [`SP2 next ${i + 1} page `, PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES_IN_SECTION],
                        }),
                    ],
                }),
        ),
    },

    // SP3a: room for 2 note lines below line 48, and a note of a 4-line paragraph kept together, then 4 lines
    {
        children: [
            ...fill("SP3a", 47),
            withNote("SP3a ref", footnote(lines("SP3a kept", 4, { keepLines: true }), lines("SP3a note", 4))),
            ...fill("SP3a after", 20),
        ],
    },
    // SP3b: room for 3 below line 47, and a note of 2 lines kept with the next, then 4 lines
    {
        children: [
            ...fill("SP3b", 46),
            withNote("SP3b ref", footnote(lines("SP3b kept", 2, { keepNext: true }), lines("SP3b note", 4))),
            ...fill("SP3b after", 20),
        ],
    },
    // SP3c: room for 3 below line 47, and a note of a line, then a table of 3 rows of 3 lines. docx puts the note's
    // number at the start of its first paragraph, so a note can't start with a table
    {
        children: [
            ...fill("SP3c", 46),
            withNote(
                "SP3c ref",
                footnote(
                    line("SP3c head"),
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        rows: [1, 2, 3].map(
                            (row) =>
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            width: { size: 9026, type: WidthType.DXA },
                                            children: [lines(`SP3c row ${row}`, 3)],
                                        }),
                                    ],
                                }),
                        ),
                    }),
                ),
            ),
            ...fill("SP3c after", 20),
        ],
    },
    // SP3d: room for 4 below line 46, and a note of a line, then a table of a header row and 6 rows
    {
        children: [
            ...fill("SP3d", 45),
            withNote(
                "SP3d ref",
                footnote(
                    line("SP3d head"),
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        rows: Array.from(
                            { length: 7 },
                            (_, row) =>
                                new TableRow({
                                    tableHeader: row === 0,
                                    children: [
                                        new TableCell({
                                            width: { size: 9026, type: WidthType.DXA },
                                            children: [line(row === 0 ? "SP3d header" : `SP3d row ${row}`)],
                                        }),
                                    ],
                                }),
                        ),
                    }),
                ),
            ),
            ...fill("SP3d after", 20),
        ],
    },

    // SP4: a line kept with a 6-line paragraph, on line 45, with an 8-line note
    {
        children: [
            ...fill("SP4", 44),
            withNote("SP4 kept", footnote(lines("SP4 note", 8)), { keepNext: true }),
            lines("SP4 next", 6),
            ...fill("SP4 after", 20),
        ],
    },

    // SP5: a line at the top of a page whose note is a 55-line paragraph kept together
    { children: [withNote("SP5 ref", footnote(lines("SP5 note", 55, { keepLines: true }))), ...fill("SP5 after", 20)] },

    // SP6: two continuous sections of 2 columns, each with a 2-line note, then one column
    {
        properties: { column: TWO },
        children: [...fill("SP6 first", 6), withNote("SP6 first ref", footnote(lines("SP6 first note", 2))), ...fill("SP6 first after", 3)],
    },
    {
        properties: { type: SectionType.CONTINUOUS, column: TWO },
        children: [
            ...fill("SP6 second", 6),
            withNote("SP6 second ref", footnote(lines("SP6 second note", 2))),
            ...fill("SP6 second after", 3),
        ],
    },
    { properties: { type: SectionType.CONTINUOUS }, children: fill("SP6 end", 5) },

    // SP7: notes of 3 lines from line 5 of the narrow first column and line 5 of the wide second
    {
        properties: { column: NARROW_FIRST },
        children: [
            ...fill("SP7", 4),
            withNote("SP7 narrow ref", footnote(line(`SP7 narrow note ${prose(25)}`))),
            ...fill("SP7 narrow", 50),
            withNote("SP7 wide ref", footnote(line(`SP7 wide note ${prose(25)}`))),
            ...fill("SP7 wide", 10),
        ],
    },

    // SP8: 45 lines in the first column, then a section that starts in the second, with a 10-line note from its first line
    { properties: { column: TWO }, children: fill("SP8 first", 45) },
    {
        properties: { type: SectionType.NEXT_COLUMN, column: TWO },
        children: [withNote("SP8 next ref", footnote(lines("SP8 note", 10))), ...fill("SP8 next", 5)],
    },

    // SP9: a 3-line note from line 50 of the second column, after a full first column
    {
        properties: { column: TWO },
        children: [...fill("SP9", 100), withNote("SP9 ref", footnote(lines("SP9 note", 3))), ...fill("SP9 after", 10)],
    },

    // SP10: 5 lines in 2 columns of the same width, then a section starting in the next column, of 2000 and 6306 twips
    { properties: { column: TWO }, children: fill("SP10 first", 5) },
    { properties: { type: SectionType.NEXT_COLUMN, column: NARROW_FIRST }, children: [line(`SP10 next ${prose(120)}`)] },

    // SP11: 5 lines in 3 columns, a section starting in the second, then a continuous section of one column
    { properties: { column: THREE }, children: fill("SP11 first", 5) },
    { properties: { type: SectionType.NEXT_COLUMN, column: THREE }, children: fill("SP11 next", 10) },
    { properties: { type: SectionType.CONTINUOUS }, children: fill("SP11 end", 5) },

    // SP12: a 120-line paragraph kept together, in columns of 2000 and 6306 twips
    {
        properties: { column: NARROW_FIRST },
        children: [line("SP12 top"), lines("SP12", 120, { keepLines: true }), ...fill("SP12 after", 5)],
    },

    // SP13: 10 lines, a line kept with the next, then a 60-line paragraph kept together, in 2 columns
    {
        properties: { column: TWO },
        children: [
            ...fill("SP13", 10),
            line("SP13 kept", { keepNext: true }),
            lines("SP13", 60, { keepLines: true }),
            ...fill("SP13 after", 5),
        ],
    },

    // SP14: rows of 3000 and 6026, and 4000 and 5026, sized as Word sizes them (a) and fixed (b)
    {
        children: [
            ...(["SP14a", "SP14b"] as const).flatMap((probe) => [
                line(`${probe} above`),
                table(
                    [
                        [
                            { text: `${probe} row 1 left ${prose(12)}`, width: 3000 },
                            { text: `${probe} row 1 right ${prose(20)}`, width: 6026 },
                        ],
                        [
                            { text: `${probe} row 2 left ${prose(12)}`, width: 4000 },
                            { text: `${probe} row 2 right ${prose(20)}`, width: 5026 },
                        ],
                    ],
                    {
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [3000, 6026],
                        ...(probe === "SP14b" ? { layout: TableLayoutType.FIXED } : {}),
                    },
                ),
            ]),
            line("SP14 below"),
        ],
    },

    // SP15a: a word longer than the page in a cell of 3000; SP15b: a table 9000 wide of cells of 2000 and 4000 with a
    // word of 3000; SP15c: a word of 6000 across 2 columns of 2000, cells given widths
    {
        children: [
            line("SP15a above"),
            table(
                [
                    [
                        { text: `SP15a ${word(12000)}`, width: 3000 },
                        { text: "SP15a right two words", width: 6026 },
                    ],
                ],
                { width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026] },
            ),
            line("SP15b above"),
            table(
                [
                    [
                        { text: `SP15b ${word(3000)}`, width: 2000 },
                        { text: "SP15b right two words", width: 4000 },
                    ],
                ],
                { width: { size: 9000, type: WidthType.DXA }, columnWidths: [2000, 4000] },
            ),
            line("SP15c above"),
            table(
                [
                    [
                        { text: `SP15c ${word(6000)}`, width: 4000, span: 2 },
                        { text: "SP15c right", width: 5026 },
                    ],
                    [
                        { text: "SP15c one", width: 2000 },
                        { text: "SP15c two", width: 2000 },
                        { text: "SP15c three", width: 5026 },
                    ],
                ],
                { width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 2000, 5026] },
            ),
            line("SP15 below"),
        ],
    },

    // SP16: 40 lines, then a table sized to its text that goes on from the wide first column into the narrow second
    {
        properties: { column: WIDE_FIRST },
        children: [
            ...fill("SP16", 40),
            table(Array.from({ length: 20 }, (_, row) => [{ text: `SP16 row ${row + 1}` }, { text: `SP16 text ${prose(10)}` }])),
            ...fill("SP16 after", 5),
        ],
    },

    // SP17: tables given no widths with a long word across "one" and "two words", and across 3 columns
    {
        children: [
            ...[3000, 4000, 5000, 6000].flatMap((twips) => [
                line(`SP17 two ${twips} above`),
                table([[{ text: word(twips), span: 2 }], [{ text: "one" }, { text: "two words" }]]),
            ]),
            ...[4000, 6000].flatMap((twips) => [
                line(`SP17 three ${twips} above`),
                table([[{ text: word(twips), span: 3 }], [{ text: "one" }, { text: "two words" }, { text: "three short words" }]]),
            ]),
            line("SP17 below"),
        ],
    },

    // SP18: justified lines whose last word needs their spaces this much narrower
    { children: [0.03, 0.06, 0.1, 0.15, 0.2, 0.25, 0.33].map((share) => squeezed("SP18", share)) },

    // SP19: 5 one-line rows of a table whose style's first row is 16 points bold, with tblLook firstRow on and off
    {
        children: (["SP19a", "SP19b"] as const).flatMap((probe) => [
            line(`${probe} above`),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                style: "WatertightFirstRow",
                tableLook: { firstRow: probe === "SP19a" },
                rows: Array.from(
                    { length: 5 },
                    (_, row) =>
                        new TableRow({
                            children: [
                                new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [line(`${probe} row ${row + 1}`)] }),
                            ],
                        }),
                ),
            }),
            line(`${probe} below`),
        ]),
    },
];

/** SP19's table style, which docx can't write, added to styles.xml */
const FIRST_ROW_STYLE = [
    '<w:style w:type="table" w:styleId="WatertightFirstRow"><w:name w:val="Watertight First Row"/><w:basedOn w:val="TableNormal"/>',
    '<w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>',
    '<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:tblStylePr></w:style>',
].join("");

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    footnotes,
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const styles = await zip.file("word/styles.xml")!.async("string");
    zip.file("word/styles.xml", styles.replace("</w:styles>", `${FIRST_ROW_STYLE}</w:styles>`));
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-stops.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
