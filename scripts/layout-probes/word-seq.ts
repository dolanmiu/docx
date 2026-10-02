// How Word numbers SEQ fields (`SequentialIdentifier`), the caption numbers such as the 2 of "Figure 2", and whether it
// opens a document whose SEQ fields docx writes clean, with page numbers, without asking to update the fields. It writes
// two documents of the same probes:
//
// - word-seq.docx, with the SEQ fields dirty and `updateFields` on, as docx writes them without `pageNumbers`, so Word
//   numbers them itself
// - word-seq-clean.docx, with `pageNumbers` and without `updateFields`, so the SEQ fields, the table of contents and the
//   page references are written clean with the numbers docx works out, or blank. Word should open it without asking
//
// word-seq.py reads Word's PDF of word-seq, and checks each number docx wrote into word-seq-clean.docx against the one
// Word worked out. Word's PDF of word-seq-clean can't be used for that: Word updates its SEQ fields and page references
// when it saves the PDF. Each probe line is `<probe> <identifier> <number> end`, so a blank number shows as two spaces.
// Calibri 11 on A4.
//
// Q1: SEQ fields of two identifiers, one after the other
// Q2: \r, which starts the count again, \c, which repeats the number before, and \n, the next number
// Q3: \c before the first SEQ field of its identifier
// Q4: \h, which hides the number, with and without a format
// Q5: the formats of \*, at numbers \r gives, among them 0 and where roman numerals and letters run out, and \#
// Q6: an identifier written with other capitals
// Q7: \s, which starts the count again at headings of a level, with headings of levels 1 and 2
// Q8: a SEQ field in hidden text, in a paragraph of a hidden style
// Q9: an identifier in quotes, and a bookmark after the identifier
// Q10: a simple SEQ field (w:fldSimple) between complex ones
// Q11: SEQ fields in headings, and their entries in the table of contents
// Q12: a SEQ field in a footnote, between two in the text
// Q13: SEQ fields in the header and the footer, and of the same identifiers in the text on two pages
// Q14: a SEQ field in a text box, between two in the text. Last, as docx/layout stops at a text box
// cspell:ignore NUMPAGES
import * as fs from "fs";
import {
    Bookmark,
    Document,
    Footer,
    FootnoteReferenceRun,
    Header,
    HeadingLevel,
    Packer,
    PageBreak,
    PageReference,
    Paragraph,
    SequentialIdentifier,
    SimpleField,
    TableOfContents,
    TextRun,
    Textbox,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

type Child = TextRun | SequentialIdentifier | SimpleField | FootnoteReferenceRun | Bookmark | PageBreak;

/** A probe line: its name, an identifier's SEQ field with the switches, and "end" */
const seq = (probe: string, field: string, ...after: readonly Child[]): Paragraph =>
    new Paragraph({
        children: [new TextRun(`${probe} ${field.split(" ")[0]} `), new SequentialIdentifier(field), new TextRun(" end"), ...after],
    });

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], text: string, ...children: readonly Child[]): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(text), ...children] });

const body = (): readonly (Paragraph | TableOfContents | Textbox)[] => [
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    new Paragraph({ children: [new TextRun("QP the probes of text boxes are on page "), new PageReference("boxes"), new TextRun(" end")] }),

    heading(HeadingLevel.HEADING_1, "Q1 to Q6"),
    seq("Q1a", "Figure"),
    seq("Q1b", "Table"),
    seq("Q1c", "Figure"),
    seq("Q1d", "Table"),
    seq("Q1e", "Figure"),

    seq("Q2a", "Reset"),
    seq("Q2b", "Reset \\r 5"),
    seq("Q2c", "Reset"),
    seq("Q2d", "Reset \\c"),
    seq("Q2e", "Reset \\n"),
    seq("Q2f", "Reset \\r 0"),
    seq("Q2g", "Reset"),

    seq("Q3a", "Fresh \\c"),
    seq("Q3b", "Fresh"),
    seq("Q3c", "Fresh \\c"),

    seq("Q4a", "Hide \\h"),
    seq("Q4b", "Hide"),
    seq("Q4c", "Hide \\h \\* ARABIC"),
    seq("Q4d", "Hide \\h \\* MERGEFORMAT"),
    seq("Q4e", "Hide \\r 0 \\h"),
    seq("Q4f", "Hide"),

    // Each format at 4, and roman numerals and letters where they run out
    ...[
        ["Q5a", "ARABIC"],
        ["Q5b", "Arabic"],
        ["Q5c", "arabic"],
        ["Q5d", "ROMAN"],
        ["Q5e", "roman"],
        ["Q5f", "Roman"],
        ["Q5g", "ALPHABETIC"],
        ["Q5h", "alphabetic"],
        ["Q5i", "Alphabetic"],
        ["Q5j", "Ordinal"],
        ["Q5k", "CardText"],
        ["Q5l", "OrdText"],
        ["Q5m", "Hex"],
        ["Q5n", "DollarText"],
        ["Q5o", "ArabicDash"],
        ["Q5p", "Upper"],
    ].map(([probe, format]) => seq(probe, `Form \\r 4 \\* ${format}`)),
    seq("Q5q", "Form \\r 4 \\# 00"),
    ...[
        ["Q5r", 0, "ARABIC"],
        ["Q5s", 0, "ROMAN"],
        ["Q5t", 0, "ALPHABETIC"],
        ["Q5u", 26, "ALPHABETIC"],
        ["Q5v", 27, "ALPHABETIC"],
        ["Q5w", 53, "alphabetic"],
        ["Q5x", 780, "ALPHABETIC"],
        ["Q5y", 781, "ALPHABETIC"],
        ["Q5z", 1994, "ROMAN"],
        ["Q5A", 3999, "ROMAN"],
        ["Q5B", 4000, "ROMAN"],
        ["Q5C", 100000, "ARABIC"],
    ].map(([probe, value, format]) => seq(String(probe), `Form \\r ${value} \\* ${format}`)),

    seq("Q6a", "Cap"),
    seq("Q6b", "cap"),
    seq("Q6c", "Cap"),
    seq("Q6d", "CAP"),

    heading(HeadingLevel.HEADING_1, "Q7 chapter one"),
    seq("Q7a", "Sec \\s 1"),
    seq("Q7b", "Sec \\s 1"),
    seq("Q7c", "Sub \\s 2"),
    heading(HeadingLevel.HEADING_2, "Q7 section one"),
    seq("Q7d", "Sec \\s 1"),
    seq("Q7e", "Sub \\s 2"),
    seq("Q7f", "Sub \\s 2"),
    heading(HeadingLevel.HEADING_1, "Q7 chapter two"),
    seq("Q7g", "Sec \\s 1"),
    seq("Q7h", "Sub \\s 2"),
    seq("Q7i", "Sec"),
    seq("Q7j", "Sub"),
    heading(HeadingLevel.HEADING_2, "Q7 section two"),
    seq("Q7k", "Sub \\s 2"),
    seq("Q7l", "Sec \\s 1"),

    heading(HeadingLevel.HEADING_1, "Q8 to Q10"),
    seq("Q8a", "Vis"),
    new Paragraph({ style: "HiddenText", children: [new TextRun("Q8 hidden Vis "), new SequentialIdentifier("Vis")] }),
    seq("Q8b", "Vis"),

    seq("Q9a", '"Quo"'),
    seq("Q9b", "Quo"),
    seq("Q9c", "Bm"),
    seq("Q9d", "Bm target"),
    seq("Q9e", "Bm"),
    new Paragraph({
        children: [new Bookmark({ id: "target", children: [new TextRun("Q9f Bm "), new SequentialIdentifier("Bm")] }), new TextRun(" end")],
    }),
    seq("Q9g", "Bm"),
    seq("Q9h", "Bm target"),

    seq("Q10a", "Smp"),
    new Paragraph({ children: [new TextRun("Q10b Smp "), new SimpleField("SEQ Smp"), new TextRun(" end")] }),
    seq("Q10c", "Smp"),

    heading(HeadingLevel.HEADING_1, "Q11 chapter ", new SequentialIdentifier("Chap")),
    seq("Q11a", "Chap"),
    heading(HeadingLevel.HEADING_1, "Q11 chapter ", new SequentialIdentifier("Chap")),
    seq("Q11b", "Chap"),

    heading(HeadingLevel.HEADING_1, "Q12 and Q13"),
    seq("Q12a", "Note"),
    seq("Q12b", "Note", new FootnoteReferenceRun(1)),
    seq("Q12c", "Note"),
    seq("Q13a", "Head"),
    seq("Q13b", "Foot"),
    new Paragraph({ children: [new PageBreak()] }),
    seq("Q13c", "Head"),
    seq("Q13d", "Foot"),
    new Paragraph({ children: [new PageBreak()] }),

    heading(HeadingLevel.HEADING_1, "Q14 text boxes", new Bookmark({ id: "boxes", children: [] })),
    seq("Q14a", "Box"),
    new Textbox({
        style: { width: "3in", height: "0.6in" },
        children: [seq("Q14b", "Box")],
    }),
    seq("Q14c", "Box"),
];

const options = (clean: boolean): ConstructorParameters<typeof Document>[0] => ({
    ...(clean ? { pageNumbers: estimatePageNumbers } : { features: { updateFields: true } }),
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
        paragraphStyles: [{ id: "HiddenText", name: "Hidden Text", basedOn: "Normal", run: { vanish: true } }],
    },
    footnotes: { 1: { children: [seq("Q12 note", "Note")] } },
    sections: [
        {
            headers: { default: new Header({ children: [seq("Q13 header", "Head")] }) },
            footers: { default: new Footer({ children: [seq("Q13 footer", "Foot")] }) },
            children: [...body()],
        },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
for (const [name, clean] of [
    ["word-seq", false],
    ["word-seq-clean", true],
] as const) {
    Packer.toBuffer(new Document(options(clean))).then((buffer) => fs.writeFileSync(`build/word-probes/${name}.docx`, buffer));
}
