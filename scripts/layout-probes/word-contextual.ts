// Probes of contextual spacing in Word, after word-rules.ts (P1) and word-rules2.ts (Q1). Each line's text names its
// probe, so word-contextual.py can find the lines in pdftotext's layout of a PDF saved from Word, which gives each its
// position. Calibri 11, single spaced, on A4 with 1440 margins. Every probe line has no space after unless it says so.
//
// word-contextual.docx, where Normal has 200 after, so the empty paragraph docx writes at the end of each section has
// 200 after and none before:
//
// X1: contextual spacing next to the empty paragraph that ends a section, which has Normal's style. The sections are
// continuous, so each probe's lines are on one page. a: contextual on the section's last paragraph, b: on the next
// section's first, c: on a last paragraph of another style
//
// word-contextual-adding.docx, with doNotUseHTMLParagraphAutoSpacing, which adds the space after a paragraph and before
// the next, rather than taking the larger of them:
//
// Y1: the space between two paragraphs, contextual on neither (a), the first (b, c), the second (d, e) and both (f)
//
// Word's results (Word 16 for Mac, saved as PDFs, Best for printing, 2026-10-01), in twips, with LibreOffice 26.8's:
//
// | Probe | Word | LibreOffice |
// | ----- | ---- | ----------- |
// | X1a   | 0    | 400         |
// | X1b   | 0    | 400         |
// | X1c   | 400  | 400         |
// | Y1a   | 600  | 600         |
// | Y1b   | 200  | 200         |
// | Y1c   | 400  | 400         |
// | Y1d   | 400  | 600         |
// | Y1e   | 200  | 600         |
// | Y1f   | 0    | 0           |
//
// In X1, the empty paragraph's 200 after is never on the page: it only takes from the next section's space before, as at
// the top of a page. In Y1, contextual spacing leaves out the paragraph's own space, its space after or its space before.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-contextual.ts [output directory, build/word-probes by default]
import * as fs from "fs";
import * as path from "path";

import { Document, ISectionOptions, Packer, Paragraph, SectionType, TextRun } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { after: 0, ...options.spacing }, children: [new TextRun(text)] });

const contextual = { contextualSpacing: true };

// X1: each probe ends a section, and the next section starts on the same page
const sectionBreaks: ISectionOptions[] = [
    { children: [line("X1 top"), line("X1a last after 400 contextual", { spacing: { after: 400 }, ...contextual })] },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("X1a next"), line("X1b last")] },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [
            line("X1b first before 400 contextual", { spacing: { before: 400 }, ...contextual }),
            line("X1c last after 400 contextual other style", { spacing: { after: 400 }, style: "Other", ...contextual }),
        ],
    },
    { properties: { type: SectionType.CONTINUOUS }, children: [line("X1c next"), line("X1 end")] },
];

// Y1: the paragraphs of each probe follow each other, and a line with no space around it follows each probe
const adding: ISectionOptions[] = [
    {
        children: [
            line("Y1 top"),
            line("Y1a first after 400", { spacing: { after: 400 } }),
            line("Y1a second before 200", { spacing: { before: 200 } }),
            line("Y1b first after 400 contextual", { spacing: { after: 400 }, ...contextual }),
            line("Y1b second before 200", { spacing: { before: 200 } }),
            line("Y1c first after 200 contextual", { spacing: { after: 200 }, ...contextual }),
            line("Y1c second before 400", { spacing: { before: 400 } }),
            line("Y1d first after 400", { spacing: { after: 400 } }),
            line("Y1d second before 200 contextual", { spacing: { before: 200 }, ...contextual }),
            line("Y1e first after 200", { spacing: { after: 200 } }),
            line("Y1e second before 400 contextual", { spacing: { before: 400 }, ...contextual }),
            line("Y1f first after 400 contextual", { spacing: { after: 400 }, ...contextual }),
            line("Y1f second before 200 contextual", { spacing: { before: 200 }, ...contextual }),
            line("Y1 end"),
        ],
    },
];

const document = (sections: ISectionOptions[], adds: boolean): Document =>
    new Document({
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 200, line: 240 } } } },
            paragraphStyles: [{ id: "Other", name: "Other", basedOn: "Normal" }],
        },
        ...(adds ? { compatibility: { doNotUseHTMLParagraphAutoSpacing: true } } : {}),
        sections,
    });

const out = process.argv[2] ?? "build/word-probes";
fs.mkdirSync(out, { recursive: true });
Promise.all([
    Packer.toBuffer(document(sectionBreaks, false)).then((buffer) => fs.writeFileSync(path.join(out, "word-contextual.docx"), buffer)),
    Packer.toBuffer(document(adding, true)).then((buffer) => fs.writeFileSync(path.join(out, "word-contextual-adding.docx"), buffer)),
]);
