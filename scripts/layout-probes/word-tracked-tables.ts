/**
 * Probes of how Word draws a deleted table row's borders, and counts the rows of a table style's parts around it, where
 * `word-tracked-changes.docx` (MK11) didn't show it. Each table has its own page, between a line above and a line below,
 * and each of its rows is a line of Calibri 11 with no cell margins, named for its probe and its place in the table. A4
 * with 1440 margins, single spaced, no space before or after. word-tracked-tables.py reads it.
 *
 * MK14a, MK14b: borders of half a point, the third of five rows deleted (MK14a), and the same table without it (MK14b)
 * MK14c, MK14d: borders of 3 points, the third of five rows deleted (MK14c), and the same table without it (MK14d)
 * MK14e, MK14f: borders of 3 points, the first of five rows deleted (MK14e), and the last (MK14f)
 * MK14g: no borders but the deleted third row's own, 3 points above and below it
 * MK14h, MK14i: 100 twips between cells and no borders, the third of five rows deleted (MK14h), and the same table
 *               without it (MK14i)
 * MK14j: a table style whose first row is 16 points, the first of three rows deleted: whether the second takes it
 * MK14k: a table style whose last row is 16 points, the last of three rows deleted: whether the second takes it
 * MK14l: a table style whose bands of one row are 16 and 10 points, the second of five rows deleted: whether the rows
 *        after it are in the bands they would be in with it laid out
 *
 * docx can't write the table styles, so this script adds them to styles.xml: see `TABLE_STYLES`.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    BorderStyle,
    Document,
    type IBorderOptions,
    type ISectionOptions,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type TableOptions = Partial<ConstructorParameters<typeof Table>[0]>;
type CellOptions = Partial<ConstructorParameters<typeof TableCell>[0]>;

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });

const DATE = "2026-10-02T09:00:00Z";
let id = 0;
const deleted = () => ({ deletion: { id: id++, author: "Watertight", date: DATE } });

const WIDTH = 9026;

const border = (size: number, color: string): IBorderOptions => ({ style: BorderStyle.SINGLE, size, color });
/** Every border of a table, the same */
const borders = (size: number, color: string) => {
    const one = border(size, color);
    return { top: one, bottom: one, left: one, right: one, insideHorizontal: one, insideVertical: one };
};
const THIN = borders(4, "auto");
const THICK = borders(24, "000000");

/**
 * A table of one column the width of the text, with no cell margins, so each row is a line: a row for each of `rows`,
 * named for its probe and its number, which is deleted when it is in `removed`
 */
const table = (
    probe: string,
    rows: readonly number[],
    removed: readonly number[],
    options: TableOptions = {},
    cellOptions: (row: number) => CellOptions = () => ({}),
): Table =>
    new Table({
        width: { size: WIDTH, type: WidthType.DXA },
        columnWidths: [WIDTH],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        ...options,
        rows: rows.map(
            (row) =>
                new TableRow({
                    ...(removed.includes(row) ? deleted() : {}),
                    children: [
                        new TableCell({
                            ...cellOptions(row),
                            width: { size: WIDTH, type: WidthType.DXA },
                            children: [line(`${probe} row ${row}`)],
                        }),
                    ],
                }),
        ),
    });

/** A probe's table on a page of its own, between a line above and a line below */
const page = (probe: string, probeTable: Table): ISectionOptions => ({
    children: [line(`${probe} above`), probeTable, line(`${probe} below`)],
});

const ALL = [1, 2, 3, 4, 5];
const WITHOUT_THIRD = [1, 2, 4, 5];
// Only the parts of the table style each probe is of
const LOOK_NONE = { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, noHBand: true, noVBand: true };

const sections: ISectionOptions[] = [
    page("MK14a", table("MK14a", ALL, [3], { borders: THIN })),
    page("MK14b", table("MK14b", WITHOUT_THIRD, [], { borders: THIN })),
    page("MK14c", table("MK14c", ALL, [3], { borders: THICK })),
    page("MK14d", table("MK14d", WITHOUT_THIRD, [], { borders: THICK })),
    page("MK14e", table("MK14e", ALL, [1], { borders: THICK })),
    page("MK14f", table("MK14f", ALL, [5], { borders: THICK })),
    page(
        "MK14g",
        table("MK14g", ALL, [3], {}, (row) => (row === 3 ? { borders: { top: border(24, "000000"), bottom: border(24, "000000") } } : {})),
    ),
    page("MK14h", table("MK14h", ALL, [3], { cellSpacing: { value: 100, type: WidthType.DXA } })),
    page("MK14i", table("MK14i", WITHOUT_THIRD, [], { cellSpacing: { value: 100, type: WidthType.DXA } })),
    page("MK14j", table("MK14j", [1, 2, 3], [1], { style: "ProbeFirstRow", tableLook: { ...LOOK_NONE, firstRow: true } })),
    page("MK14k", table("MK14k", [1, 2, 3], [3], { style: "ProbeLastRow", tableLook: { ...LOOK_NONE, lastRow: true } })),
    page("MK14l", table("MK14l", ALL, [2], { style: "ProbeBands", tableLook: { ...LOOK_NONE, noHBand: false } })),
];

const size = (type: string, halfPoints: number): string =>
    `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${halfPoints}"/></w:rPr></w:tblStylePr>`;
const tableStyle = (styleId: string, parts: string): string =>
    `<w:style w:type="table" w:styleId="${styleId}"><w:name w:val="${styleId}"/><w:basedOn w:val="TableNormal"/>` +
    `<w:tblPr><w:tblStyleRowBandSize w:val="1"/></w:tblPr>${parts}</w:style>`;

/** Table styles docx can't write, added to styles.xml: a part of each in 16 points, and the second band in 10 */
const TABLE_STYLES = [
    tableStyle("ProbeFirstRow", size("firstRow", 32)),
    tableStyle("ProbeLastRow", size("lastRow", 32)),
    tableStyle("ProbeBands", size("band1Horz", 32) + size("band2Horz", 20)),
].join("");

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    // tblLook's parts as 1 and 0, as the document Word opened has them, rather than as docx writes them, true and false
    const xml = await zip.file("word/document.xml")!.async("string");
    zip.file(
        "word/document.xml",
        xml.replace(/<w:tblLook [^>]*>/g, (look) => look.replaceAll('"true"', '"1"').replaceAll('"false"', '"0"')),
    );
    const styles = await zip.file("word/styles.xml")!.async("string");
    zip.file("word/styles.xml", styles.replace("</w:styles>", `${TABLE_STYLES}</w:styles>`));
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-tracked-tables.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
