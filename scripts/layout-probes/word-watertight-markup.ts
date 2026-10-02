/**
 * Probes of what tracked changes and comments do to where Word breaks lines, for the watertight inventory. Word may draw
 * a markup area beside the page and scale the page down to fit it in its PDF, so each probe is read by where its lines
 * end, not where they are, and each is beside the same text without the markup. Calibri 11 on A4 with 1440 margins,
 * single spaced, no space before or after. word-watertight.py reads it.
 *
 * MK1: 40 words deleted in a tracked change, against the text without them and with them as plain text
 * MK2: 40 words inserted in a tracked change, against the same as plain text
 * MK3: a paragraph whose mark is deleted in a tracked change: whether it joins the next
 * MK4: a comment on 10 words, against no comment
 * MK5: a tracked change of formatting (`w:rPrChange`), against none
 * MK6: a table row deleted in a tracked change: whether it takes room
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    CommentRangeEnd,
    CommentRangeStart,
    CommentReference,
    DeletedTextRun,
    Document,
    type ISectionOptions,
    InsertedTextRun,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number, from = 0): string =>
    Array.from({ length: count }, (_, i) => WORDS[((i + from) * 7) % WORDS.length]).join(" ");
const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });

const REVISION = { author: "Watertight", date: "2026-10-01T09:00:00Z" };
let id = 0;
const revision = () => ({ id: id++, ...REVISION });

// The text before, in and after the markup
const BEFORE = prose(60);
const MIDDLE = prose(40, 60);
const AFTER = prose(60, 100);

const sections: ISectionOptions[] = [
    {
        children: [
            new Paragraph({
                children: [new TextRun(`MK1a ${BEFORE} `), new DeletedTextRun({ text: `${MIDDLE} `, ...revision() }), new TextRun(AFTER)],
            }),
            line(`MK1b ${BEFORE} ${AFTER}`),
            line(`MK1c ${BEFORE} ${MIDDLE} ${AFTER}`),
        ],
    },
    {
        children: [
            new Paragraph({
                children: [new TextRun(`MK2a ${BEFORE} `), new InsertedTextRun({ text: `${MIDDLE} `, ...revision() }), new TextRun(AFTER)],
            }),
            line(`MK2b ${BEFORE} ${MIDDLE} ${AFTER}`),
        ],
    },
    {
        children: [
            new Paragraph({ run: { deletion: revision() }, children: [new TextRun("MK3 first")] }),
            line("MK3 second"),
            line("MK3 third"),
        ],
    },
    {
        children: [
            new Paragraph({
                children: [
                    new TextRun(`MK4a ${BEFORE} `),
                    new CommentRangeStart(0),
                    new TextRun(prose(10, 60)),
                    new CommentRangeEnd(0),
                    new TextRun({ children: [new CommentReference(0)] }),
                    new TextRun(` ${prose(30, 70)} ${AFTER}`),
                ],
            }),
            line(`MK4b ${BEFORE} ${MIDDLE} ${AFTER}`),
        ],
    },
    {
        children: [
            new Paragraph({
                children: [
                    new TextRun(`MK5a ${BEFORE} `),
                    new TextRun({ text: `${MIDDLE} `, bold: true, revision: { ...revision(), bold: false } }),
                    new TextRun(AFTER),
                ],
            }),
            new Paragraph({
                children: [new TextRun(`MK5b ${BEFORE} `), new TextRun({ text: `${MIDDLE} `, bold: true }), new TextRun(AFTER)],
            }),
        ],
    },
    {
        children: [
            line("MK6 above"),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                rows: Array.from(
                    { length: 5 },
                    (_, i) =>
                        new TableRow({
                            ...(i === 2 ? { deletion: revision() } : {}),
                            children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [line(`MK6 row ${i + 1}`)] })],
                        }),
                ),
            }),
            line("MK6 below"),
        ],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    comments: { children: [{ id: 0, author: "Watertight", date: new Date("2026-10-01T09:00:00Z"), children: [line("MK4 comment")] }] },
    sections,
});

Packer.toBuffer(doc).then((buffer) => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-markup.docx", buffer);
});
