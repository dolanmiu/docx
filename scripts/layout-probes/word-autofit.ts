// Probes of how Word sizes the columns of tables whose cells have no widths, which it sizes to their text. Each table's
// first row names the table and column, and the borders show where each column starts and ends.
import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

type TableOptions = ConstructorParameters<typeof Table>[0];
type CellOptions = Partial<ConstructorParameters<typeof TableCell>[0]>;

const LONG = "each entry of the log says what was found on the survey where it was found and what should be done about it";
const HALF = "each entry of the log says what was found on the survey";
const cell = (text: string, options: CellOptions = {}): TableCell => new TableCell({ ...options, children: [new Paragraph(text)] });
const probe = (name: string, note: string, table: Table): (Paragraph | Table)[] => [
    new Paragraph(`${name}: ${note}`),
    table,
    new Paragraph(`${name} end`),
];
/** A table of a row naming its columns, and a row of the texts given */
const table = (name: string, texts: readonly string[], options: Omit<TableOptions, "rows"> = {}, cells: CellOptions[] = []): Table =>
    new Table({
        ...options,
        rows: [
            new TableRow({ children: texts.map((_, index) => cell(`${name}c${index + 1}`, cells[index])) }),
            new TableRow({ children: texts.map((text, index) => cell(text, cells[index])) }),
        ],
    });

const SHORT = ["one", "two words", "three short words"];
const pct = (size: number) => ({ width: { size, type: WidthType.PERCENTAGE } });

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 0 } } } } },
    sections: [
        {
            children: [
                // Text that fits on one line in each column
                ...probe("A1", "short text, no widths", table("A1", SHORT)),
                ...probe("A2", "short text, width 100%", table("A2", SHORT, pct(100))),
                ...probe("A3", "short text, width 50%", table("A3", SHORT, pct(50))),
                ...probe("A4", "short text, width 9026 dxa", table("A4", SHORT, { width: { size: 9026, type: WidthType.DXA } })),
                ...probe("A5", "a long word and short text, no widths", table("A5", ["extraordinarily", "one", "two words"])),
                // Text that doesn't fit: how the room is shared between columns with different amounts of text
                ...probe("B1", "short, long, twice as long", table("B1", ["1.1", LONG, `${LONG} ${LONG}`])),
                ...probe("B2", "short, half, long, twice as long", table("B2", ["1.1", HALF, LONG, `${LONG} ${LONG}`])),
                ...probe("B3", "a long word, long, half", table("B3", ["extraordinarily", LONG, HALF])),
                ...probe("B4", "half, long", table("B4", [HALF, LONG])),
                ...probe("B5", "half, long, width 100%", table("B5", [HALF, LONG], pct(100))),
                // Some cells with widths and some without
                ...probe(
                    "C1",
                    "2000 wide, long, twice as long",
                    table("C1", ["1.1", LONG, `${LONG} ${LONG}`], {}, [{ width: { size: 2000, type: WidthType.DXA } }]),
                ),
                ...probe(
                    "C2",
                    "500 wide with a long word, long",
                    table("C2", ["extraordinarily", LONG], {}, [{ width: { size: 500, type: WidthType.DXA } }]),
                ),
                ...probe(
                    "C3",
                    "2000 wide, short, short",
                    table("C3", ["1.1", "two words", "three short words"], {}, [{ width: { size: 2000, type: WidthType.DXA } }]),
                ),
                // A cell across two columns
                ...probe(
                    "D1",
                    "a long title across two columns, short text",
                    new Table({
                        rows: [
                            new TableRow({ children: [cell("D1c1"), cell("D1c2"), cell("D1c3")] }),
                            new TableRow({ children: [cell(LONG, { columnSpan: 2 }), cell("one")] }),
                            new TableRow({ children: [cell("one"), cell("two words"), cell("three")] }),
                        ],
                    }),
                ),
            ],
        },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-autofit.docx", buffer));
