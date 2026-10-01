// Probes of how Word widens a column for a word longer than the width its cells give it, in tables whose cells all have
// widths, after `word-tables.docx` T7. Each table's first row names the table and its columns, and the borders show
// where each column starts and ends, which word-long-words.py reads from a PDF of it. Calibri 11, with docx's Normal
// Table style, so cells have margins of 108 twips. The page's text is 9026 twips wide.
//
// L1: a long word in the first of three columns, the others of long text, one of them with a long word of its own
// L2: the same with the long word in the middle column
// L3: a table narrower than the page, with no width of its own
// L4: the same with a width of its own, in twips
// L5: a table 100% wide
// L6: long words in two columns
// L7: a word longer than the page's text
// L8: a long word in a table laid out fixed
//
// Usage: npm run run-ts -- scripts/layout-probes/word-long-words.ts [path of the .docx]
import * as fs from "fs";
import { Document, type IPropertiesOptions, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, WidthType } from "docx";

type TableOptions = Omit<ConstructorParameters<typeof Table>[0], "rows">;

const LONG = "each entry of the log says what was found on the survey where it was found and what should be done about it";
const WORD = "extraordinarily";
// A column whose own longest word nearly fills it, so it has little width to give up
const NEARLY_FULL = "responsibilities and more";
const cell = (text: string): TableCell => new TableCell({ children: [new Paragraph(text)] });
const probe = (name: string, note: string, table: Table): (Paragraph | Table)[] => [
    new Paragraph(`${name}: ${note}`),
    table,
    new Paragraph(`${name} end`),
];
/** A table of a row naming its columns, and a row of the texts given */
const table = (name: string, texts: readonly string[], options: TableOptions): Table =>
    new Table({
        ...options,
        rows: [
            new TableRow({ children: texts.map((_, index) => cell(`${name}c${index + 1}`)) }),
            new TableRow({ children: texts.map((text) => cell(text)) }),
        ],
    });

export const probeDocument = (options: Partial<IPropertiesOptions> = {}): Document =>
    new Document({
        ...options,
        styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 0 } } } } },
        sections: [
            {
                children: [
                    ...probe(
                        "L1",
                        "900 6126 2000, a long word in the first",
                        table("L1", [WORD, LONG, NEARLY_FULL], { columnWidths: [900, 6126, 2000] }),
                    ),
                    ...probe(
                        "L2",
                        "6126 900 2000, a long word in the middle",
                        table("L2", [LONG, WORD, NEARLY_FULL], { columnWidths: [6126, 900, 2000] }),
                    ),
                    ...probe("L3", "900 3000, no width", table("L3", [WORD, LONG], { columnWidths: [900, 3000] })),
                    ...probe(
                        "L4",
                        "900 3000, width 3900 dxa",
                        table("L4", [WORD, LONG], { columnWidths: [900, 3000], width: { size: 3900, type: WidthType.DXA } }),
                    ),
                    ...probe(
                        "L5",
                        "900 8126, width 100%",
                        table("L5", [WORD, LONG], { columnWidths: [900, 8126], width: { size: 100, type: WidthType.PERCENTAGE } }),
                    ),
                    ...probe(
                        "L6",
                        "900 900 7226, long words in two",
                        table("L6", [WORD, `${WORD}${WORD.slice(0, 4)}`, LONG], { columnWidths: [900, 900, 7226] }),
                    ),
                    ...probe(
                        "L7",
                        "3000 6026, a word longer than the page",
                        table("L7", [WORD.repeat(8), LONG], { columnWidths: [3000, 6026] }),
                    ),
                    ...probe(
                        "L8",
                        "900 8126, layout fixed",
                        table("L8", [WORD, LONG], { columnWidths: [900, 8126], layout: TableLayoutType.FIXED }),
                    ),
                ],
            },
        ],
    });

if (process.argv[1]?.endsWith("word-long-words.ts")) {
    Packer.toBuffer(probeDocument()).then((buffer) => fs.writeFileSync(process.argv[2] ?? "My Document.docx", buffer));
}
