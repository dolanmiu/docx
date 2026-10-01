// More probes of how Word evens out columns before a continuous section break: how the space after the columns' last
// paragraphs goes with the space before the next section's first, and column breaks. Each probe starts on a new page with a
// line, then a continuous section of columns, then a continuous section of one column with a line after. Calibri 11, single
// spaced, no space before or after unless given, 51 lines to a page. Save it from Word as word-balance2.pdf, and read it with
// word-balance.py.
import * as fs from "fs";
import { ColumnBreak, Document, Packer, Paragraph, SectionType, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number, options: Options = {}): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`, options));
const after = (points: number): Options => ({ spacing: { after: points * 20 } });
const before = (points: number): Options => ({ spacing: { before: points * 20 } });

const probe = (name: string, children: Paragraph[], next: Options = {}, count = 2) => [
    { children: [line(`${name} top`)] },
    { properties: { type: SectionType.CONTINUOUS, column: { count, space: 720 } }, children },
    { properties: { type: SectionType.CONTINUOUS }, children: [line(`${name} after`, next)] },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections: [
        // S1: 4 lines with no space after, then a line with 12 points before
        ...probe("S1", fill("S1", 4), before(12)),
        // S2: 4 lines with 6 points after, then 12 before; S3: 12 after, then 6 before; S4: 6 after, then none before
        ...probe("S2", fill("S2", 4, after(6)), before(12)),
        ...probe("S3", fill("S3", 4, after(12)), before(6)),
        ...probe("S4", fill("S4", 4, after(6))),
        // S5: 5 lines, 3 and 2, with 24 points after the last, in the shorter column, then 12 before
        ...probe("S5", [...fill("S5", 4), line("S5 fill 5", after(24))], before(12)),
        // S6: 5 lines, with 24 points after the 3rd, the tallest column's last, then 12 before
        ...probe("S6", [...fill("S6", 2), line("S6 fill 3", after(24)), ...fill("S6 rest", 2)], before(12)),
        // S7: a line with 6 points after, in one column, then a line with 12 before in the next section, as a control
        { children: [line("S7 top", after(6))] },
        { properties: { type: SectionType.CONTINUOUS }, children: [line("S7 after", before(12))] },
        // C1: 10 lines and a column break at the end of the 10th, then 2 lines, in 3 columns
        ...probe(
            "C1",
            [...fill("C1", 9), new Paragraph({ children: [new TextRun("C1 fill 10"), new ColumnBreak()] }), ...fill("C1 rest", 2)],
            {},
            3,
        ),
        // C2: 3 lines and a column break, then 100 lines, which go on to the next page, whose columns have no break
        ...probe("C2", [
            ...fill("C2", 2),
            new Paragraph({ children: [new TextRun("C2 fill 3"), new ColumnBreak()] }),
            ...fill("C2 rest", 100),
        ]),
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-balance2.docx", buffer));
