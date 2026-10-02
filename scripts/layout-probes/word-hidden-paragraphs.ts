/**
 * Probes of how Word lays out a paragraph whose text and mark are all hidden (`w:vanish`), where `word-breaks-and-tabs.ts`'s
 * HM3 left it open. HM3 showed such a paragraph takes no room between two plain ones, its space before and after too
 * (HM3e). Each line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext
 * -bbox-layout, which word-hidden-paragraphs.py reads. Calibri 11, single spaced, no space before or after, on A4 with
 * 1440 margins, so a page holds 51 lines. Most probes are between a line above and a line below, and "hidden" is a
 * paragraph whose mark and text are hidden.
 *
 * HP1: a hidden paragraph's own formatting, before a visible one: a left indent (HP1a), centred (HP1b), double line
 *      spacing (HP1c), top and bottom borders (HP1d), and a page break before (HP1e). Whether the next paragraph takes it
 * HP2: a hidden paragraph with no paragraph after it: before a table (HP2a), alone in a table cell (HP2b), last in a cell
 *      after a visible paragraph (HP2c), and first in a cell before one (HP2d)
 * HP3: a hidden paragraph at the end of a full page, with a bookmark, before a paragraph with one, and page references to
 *      both later on (HP3 refs): which page Word gives the bookmark in hidden text
 * HP4: page breaks, pictures and footnote references in hidden text: a hidden paragraph holding a hidden page break
 *      (HP4a), a hidden page break between visible text (HP4b), a hidden paragraph holding a hidden picture 40 points
 *      tall (HP4c), a hidden footnote reference in a visible paragraph (HP4d) and in a hidden one (HP4e)
 * HP5: a hidden paragraph in a list, between two numbered paragraphs: whether it takes a number
 * HP6: the space around a hidden paragraph: between one with 480 after and one with 240 before (HP6a, against HP6b without
 *      it), and between two paragraphs of a style with 240 before and after and contextual spacing, of another style
 *      (HP6c) and of the same (HP6d), against HP6e without it
 * HP7: a hidden paragraph whose text is a heading's, in Heading 1, and a run hidden by its character style (HP7b)
 * HP8: a hidden paragraph as the last of the document, after a full page: whether it makes a page of its own
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    AlignmentType,
    Bookmark,
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    HeadingLevel,
    ImageRun,
    type ISectionOptions,
    LevelFormat,
    LineRuleType,
    Packer,
    PageBreak,
    PageReference,
    Paragraph,
    type ParagraphChild,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import JSZip from "jszip";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
/** A paragraph whose mark and text are hidden */
const hidden = (text: string, options: Options = {}, ...after: ParagraphChild[]): Paragraph =>
    new Paragraph({ ...options, run: { vanish: true }, children: [new TextRun({ text, vanish: true }), ...after] });
/** A probe between a line above and a line below */
const probe = (name: string, ...children: (Paragraph | Table)[]): (Paragraph | Table)[] => [
    line(`${name} above`),
    ...children,
    line(`${name} below`),
];
const section = (...children: (Paragraph | Table | readonly (Paragraph | Table)[])[]): ISectionOptions => ({ children: children.flat() });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** The lines of a full page: 51 lines of Calibri 11 */
const fullPage = (name: string): Paragraph[] => Array.from({ length: 51 }, (_, i) => line(`${name} fill ${i + 1}`));

const border = { style: BorderStyle.SINGLE, size: 12, space: 4, color: "auto" };

const fixed = (...rows: readonly (readonly Paragraph[])[]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: rows.map(
            (children) =>
                new TableRow({ children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [...children] })] }),
        ),
    });

// A grey PNG of one pixel
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNoAAAAggCBd81ytgAAAABJRU5ErkJggg==", "base64");

/**
 * The XML docx can't write, which replaces what it writes: a page break, a picture and a footnote reference in hidden
 * text. The probe has no other page break, picture, or reference to footnotes 1 and 2.
 */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    [/<w:r><w:br w:type="page"\/><\/w:r>/g, '<w:r><w:rPr><w:vanish/></w:rPr><w:br w:type="page"/></w:r>'],
    [/<w:r>(<w:rPr>(?:(?!<\/w:rPr>).)*)<\/w:rPr><w:drawing>/g, "<w:r>$1<w:vanish/></w:rPr><w:drawing>"],
    [/<w:r><w:drawing>/g, "<w:r><w:rPr><w:vanish/></w:rPr><w:drawing>"],
    [
        /<w:r><w:rPr><w:rStyle w:val="FootnoteReference"\/><\/w:rPr><w:footnoteReference w:id="([12])"\/><\/w:r>/g,
        '<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/><w:vanish/></w:rPr><w:footnoteReference w:id="$1"/></w:r>',
    ],
];

const sections: ISectionOptions[] = [
    // HP1: a hidden paragraph's formatting, before a visible one of two lines
    section(
        probe("HP1a", hidden("HP1a hidden", { indent: { left: 1440 } }), line(`HP1a next ${prose(26)}`)),
        probe("HP1b", hidden("HP1b hidden", { alignment: AlignmentType.CENTER }), line("HP1b next")),
        probe("HP1c", hidden("HP1c hidden", { spacing: { line: 480, lineRule: LineRuleType.AUTO } }), line(`HP1c next ${prose(26)}`)),
        probe("HP1d", hidden("HP1d hidden", { border: { top: border, bottom: border } }), line("HP1d next")),
        probe("HP1e", hidden("HP1e hidden", { pageBreakBefore: true }), line("HP1e next")),
    ),

    // HP2: a hidden paragraph before a table, and in table cells
    section(
        probe("HP2a", hidden("HP2a hidden"), fixed([line("HP2a cell")])),
        probe("HP2b", fixed([hidden("HP2b hidden")], [line("HP2b next row")])),
        probe("HP2c", fixed([line("HP2c first"), hidden("HP2c hidden")], [line("HP2c next row")])),
        probe("HP2d", fixed([hidden("HP2d hidden"), line("HP2d last")], [line("HP2d next row")])),
    ),

    // HP3: a hidden paragraph with a bookmark at the end of a full page, then a paragraph with one
    section(
        ...fullPage("HP3"),
        new Paragraph({
            run: { vanish: true },
            children: [new Bookmark({ id: "hp3hidden", children: [new TextRun({ text: "HP3 hidden", vanish: true })] })],
        }),
        new Paragraph({ children: [new Bookmark({ id: "hp3next", children: [new TextRun("HP3 next")] })] }),
        line("HP3 below"),
    ),

    // HP4: page breaks, pictures and footnote references in hidden text
    section(probe("HP4a", hidden("HP4a hidden one", {}, new PageBreak(), new TextRun({ text: "HP4a hidden two", vanish: true })))),
    section(probe("HP4b", new Paragraph({ children: [new TextRun("HP4b one "), new PageBreak(), new TextRun("HP4b two")] }))),
    section(
        probe(
            "HP4c",
            hidden(
                "HP4c hidden",
                {},
                new ImageRun({ type: "png", data: PIXEL, transformation: { width: (20 * 96) / 72, height: (40 * 96) / 72 } }),
            ),
        ),
        probe("HP4d", new Paragraph({ children: [new TextRun("HP4d text"), new FootnoteReferenceRun(1), new TextRun(" end")] })),
        probe("HP4e", hidden("HP4e hidden", {}, new FootnoteReferenceRun(2))),
    ),

    // HP5: a hidden paragraph in a list; HP6: the space around a hidden paragraph; HP7: a hidden heading
    section(
        probe(
            "HP5",
            line("HP5 one", { numbering: { reference: "hp5", level: 0 } }),
            hidden("HP5 two", { numbering: { reference: "hp5", level: 0 } }),
            line("HP5 three", { numbering: { reference: "hp5", level: 0 } }),
        ),
        probe(
            "HP6a",
            line("HP6a first", { spacing: { after: 480 } }),
            hidden("HP6a hidden"),
            line("HP6a next", { spacing: { before: 240 } }),
        ),
        probe("HP6b", line("HP6b first", { spacing: { after: 480 } }), line("HP6b next", { spacing: { before: 240 } })),
        probe("HP6c", line("HP6c first", { style: "Spaced" }), hidden("HP6c hidden"), line("HP6c next", { style: "Spaced" })),
        probe(
            "HP6d",
            line("HP6d first", { style: "Spaced" }),
            hidden("HP6d hidden", { style: "Spaced" }),
            line("HP6d next", { style: "Spaced" }),
        ),
        probe("HP6e", line("HP6e first", { style: "Spaced" }), line("HP6e next", { style: "Spaced" })),
        probe("HP7a", hidden("HP7a hidden heading", { heading: HeadingLevel.HEADING_1 })),
        probe("HP7b", new Paragraph({ run: { vanish: true }, children: [new TextRun({ text: "HP7b hidden", style: "HiddenRun" })] })),
    ),

    // HP3's page references; HP8: a hidden paragraph last in the document, after a full page
    section(
        new Paragraph({
            children: [
                new TextRun("HP3 refs hidden "),
                new PageReference("hp3hidden"),
                new TextRun(" next "),
                new PageReference("hp3next"),
                new TextRun(" end"),
            ],
        }),
    ),
    section(...fullPage("HP8"), hidden("HP8 hidden")),
];

const doc = new Document({
    features: { updateFields: true },
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            {
                id: "Spaced",
                name: "Spaced",
                basedOn: "Normal",
                paragraph: { spacing: { before: 240, after: 240 }, contextualSpacing: true },
            },
        ],
        characterStyles: [{ id: "HiddenRun", name: "Hidden Run", run: { vanish: true } }],
    },
    numbering: {
        config: [
            {
                reference: "hp5",
                levels: [
                    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                ],
            },
        ],
    },
    footnotes: {
        1: { children: [line("HP4d note")] },
        2: { children: [line("HP4e note")] },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) => text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-hidden-paragraphs.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
