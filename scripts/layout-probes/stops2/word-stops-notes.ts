/**
 * Probes of footnotes and endnotes docx/layout stops at, after `word-watertight-stops.docx` SP1 to SP9 and
 * `word-watertight-notes.docx` FN1 to FN15 settled most of them. Two documents, as endnotes go at a document's end.
 *
 * word-stops-notes.docx:
 * NT2a, NT2b: a footnote of 120 lines from the last line of a section, before a continuous section break (a), and before
 *   a continuous section numbered from 1 (b), with PAGE and SECTIONPAGES in the footer
 *   ("a footnote continued across a continuous section break onto a page of its own")
 * NT3: a line at the foot of a page whose 3-line footnote starts on the next page, then two references on the next page
 *   to footnotes of 25 lines ("footnotes after one that starts on the next page that don't fit below its end")
 * NT4: 2 columns, a 30-line footnote referred to from line 45 of the second, then a continuous section break and 5 lines
 *   ("a footnote continued from columns before a section on the same page")
 * NT5: 2 columns, a 30-line footnote from line 40 of the first, and a 3-line one from line 10 of the second
 *   ("a footnote below one that continues on the next page in columns")
 * NT6: 2 columns, a table of 20 rows of one line in the first, and a 10-line footnote from line 50 of the second, which
 *   shortens the first ("a footnote in columns that moves its reference to the next page", with table rows)
 * NT7: a row of two cells 4 lines from the foot of a page: the first's third line refers to a 2-line footnote, the
 *   second is a paragraph of 6 lines kept together ("a footnote in a table row beside a cell whose lines it holds back")
 * NT8: a row that can't split, of 45 lines, with a 10-line footnote ("a table row and its footnote taller than a page")
 * NT9a to NT9c: a line whose footnote is 55 lines kept together, at the top of a page (a, SP5 again), in the middle of a
 *   page (b), and a footnote of two paragraphs of 30 lines, the first kept with the next (c)
 *   ("a line and its footnote taller than a page")
 * NT10a, NT10b: a 4-line paragraph kept with the next whose first line refers to a 40-line footnote, before a paragraph
 *   of 6 lines (a) and before one with a page break before it (b) ("a footnote continued below a paragraph kept with the
 *   next")
 * NT11: a row with a table in its cell, across a page, the row's other cell referring to a 5-line footnote
 * NT12: a cell merged down 3 rows whose 40 lines go on across a page, referring to a footnote on its 30th line
 * NT13a to NT13c: footnotes with paragraphs boxed by borders (a, two paragraphs with the same borders; b, a bottom
 *   border), and with automatic spacing before and after (c) ("a paragraph border in a footnote", "automatic spacing
 *   in a footnote")
 * NT14a to NT14e: sections with footnote properties of their own: numbered afresh on each page, 2 references a page for
 *   3 pages (a); numbered on from 5 in this section (b); put beneath the text, on a page half full (c); numbered in
 *   upper roman (d) and with chicago's symbols (e)
 * NT15: a footnote with a mark of its own, "*" (w:customMarkFollows), between two numbered ones
 * NT16: a section whose footnotes are in 2 columns of their own (w15:footnoteColumns), the text in one
 *
 * word-stops-endnotes.docx:
 * NE1: a last section of 2 columns whose endnotes, 120 lines, go on into the next column and page ("endnotes continued
 *   in columns")
 * NE2: endnotes at the end of each section (w:endnotePr w:pos sectEnd in the settings and the sections), three sections
 *   with two endnotes each ("endnotes at the end of each section")
 * NE3: an endnote separator with text in it (the separator's paragraph says "NE3 separator") ("an endnote separator
 *   with text in it, or of more than a paragraph")
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-notes.ts [folder]
 */
import { EndnoteReferenceRun, Footer, type ISectionOptions, PageNumber, Paragraph, SectionType, Table, TableRow, TextRun, VerticalMergeType, WidthType } from "docx";

import { ALL_BORDERS, PAGE, cell, fill, footnote, line, lines, prose, write } from "./kit";

const note = (count: number, name: string, options = {}): Paragraph[] => [lines(name, count, options, "note")];
const ref = (text: string, ...noteChildren: Paragraph[]): Paragraph => new Paragraph({ children: [new TextRun(text), footnote(...noteChildren)] });
const marker = (name: string): Paragraph => line(`${name} marker`);

/** A section's properties: the kit's page, with these */
const props = (extra: object = {}) => ({ ...PAGE, type: SectionType.NEXT_PAGE, ...extra });
const footerWithNumbers = new Footer({ children: [new Paragraph({ children: [new TextRun("page "), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" of section "), new TextRun({ children: [PageNumber.TOTAL_PAGES_IN_SECTION] })] })] });

const boxed = { top: { style: "single", size: 4, space: 4, color: "000000" }, bottom: { style: "single", size: 4, space: 4, color: "000000" }, left: { style: "single", size: 4, space: 4, color: "000000" }, right: { style: "single", size: 4, space: 4, color: "000000" } } as const;

const sections: ISectionOptions[] = [
    // NT2a
    { properties: props(), children: [line("NT2a above"), ...fill("NT2a", 30), ref("NT2a reference", ...note(120, "NT2a"))] },
    { properties: props({ type: SectionType.CONTINUOUS }), children: [...fill("NT2a after", 5), line("NT2a below")] },
    // NT2b
    { properties: props(), footers: { default: footerWithNumbers }, children: [line("NT2b above"), ...fill("NT2b", 30), ref("NT2b reference", ...note(120, "NT2b"))] },
    { properties: props({ type: SectionType.CONTINUOUS, page: { ...PAGE.page, pageNumbers: { start: 1 } } }), footers: { default: footerWithNumbers }, children: [...fill("NT2b after", 5), line("NT2b below")] },
    // NT3
    {
        properties: props(),
        footers: { default: new Footer({ children: [] }) },
        children: [
            line("NT3 above"),
            ...fill("NT3", 49),
            ref("NT3 last line", ...note(3, "NT3 first")),
            ref("NT3 next page", ...note(25, "NT3 second")),
            ...fill("NT3 more", 3),
            ref("NT3 third", ...note(25, "NT3 third")),
            ...fill("NT3 after", 20),
            line("NT3 below"),
        ],
    },
    // NT4
    { properties: props({ column: { count: 2, space: 720 } }), children: [line("NT4 above"), ...fill("NT4", 95), ref("NT4 reference", ...note(30, "NT4")), ...fill("NT4 more", 3)] },
    { properties: props({ type: SectionType.CONTINUOUS }), children: [...fill("NT4 after", 5), line("NT4 below")] },
    // NT5
    {
        properties: props({ column: { count: 2, space: 720 } }),
        children: [line("NT5 above"), ...fill("NT5", 39), ref("NT5 first", ...note(30, "NT5 first")), ...fill("NT5 more", 20), ref("NT5 second", ...note(3, "NT5 second")), ...fill("NT5 after", 60), line("NT5 below")],
    },
    // NT6
    {
        properties: props({ column: { count: 2, space: 720 } }),
        children: [
            line("NT6 above"),
            new Table({ width: { size: 4000, type: WidthType.DXA }, columnWidths: [4000], borders: ALL_BORDERS, rows: Array.from({ length: 20 }, (_, index) => new TableRow({ children: [cell(`NT6 row ${index + 1}`)] })) }),
            ...fill("NT6", 79),
            ref("NT6 reference", ...note(10, "NT6")),
            ...fill("NT6 after", 10),
            line("NT6 below"),
        ],
    },
    // NT7 to NT13
    {
        properties: props(),
        children: [
            line("NT7 above"),
            ...fill("NT7", 46),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({
                        children: [
                            cell([line("NT7 c1 line 1"), line("NT7 c1 line 2"), ref("NT7 c1 line 3", ...note(2, "NT7")), line("NT7 c1 line 4")]),
                            cell([lines("NT7 c2", 6, { keepLines: true })]),
                        ],
                    }),
                ],
            }),
            line("NT7 below"),
            line("NT8 above", { pageBreakBefore: true }),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [9026],
                borders: ALL_BORDERS,
                rows: [new TableRow({ cantSplit: true, children: [cell([lines("NT8 row", 44), ref("NT8 row reference", ...note(10, "NT8"))])] })],
            }),
            line("NT8 below"),
            line("NT9a above", { pageBreakBefore: true }),
            ref("NT9a reference", ...note(55, "NT9a", { keepLines: true })),
            ...fill("NT9a after", 5),
            line("NT9a below"),
            line("NT9b above", { pageBreakBefore: true }),
            ...fill("NT9b", 20),
            ref("NT9b reference", ...note(55, "NT9b", { keepLines: true })),
            ...fill("NT9b after", 5),
            line("NT9b below"),
            line("NT9c above", { pageBreakBefore: true }),
            ref("NT9c reference", lines("NT9c first", 30, { keepNext: true }, "note"), lines("NT9c second", 30, {}, "note")),
            ...fill("NT9c after", 5),
            line("NT9c below"),
            line("NT10a above", { pageBreakBefore: true }),
            ...fill("NT10a", 30),
            new Paragraph({ keepNext: true, children: [new TextRun(`NT10a kept ${prose(20)}`), footnote(...note(40, "NT10a")), new TextRun(` ${prose(30)}`)] }),
            line(`NT10a next ${prose(80)}`),
            line("NT10a below"),
            line("NT10b above", { pageBreakBefore: true }),
            ...fill("NT10b", 30),
            new Paragraph({ keepNext: true, children: [new TextRun(`NT10b kept ${prose(20)}`), footnote(...note(40, "NT10b")), new TextRun(` ${prose(30)}`)] }),
            new Paragraph({ pageBreakBefore: true, children: [new TextRun(`NT10b next ${prose(80)}`)] }),
            line("NT10b below"),
            line("NT11 above", { pageBreakBefore: true }),
            ...fill("NT11", 40),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                borders: ALL_BORDERS,
                rows: [
                    new TableRow({
                        children: [
                            cell([new Table({ borders: ALL_BORDERS, rows: Array.from({ length: 20 }, (_, index) => new TableRow({ children: [cell(`NT11 inner ${index + 1}`)] })) })]),
                            cell([ref("NT11 outer", ...note(5, "NT11"))]),
                        ],
                    }),
                ],
            }),
            line("NT11 below"),
            line("NT12 above", { pageBreakBefore: true }),
            ...fill("NT12", 20),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                borders: ALL_BORDERS,
                rows: [0, 1, 2].map(
                    (row) =>
                        new TableRow({
                            children: [
                                row === 0
                                    ? cell([lines("NT12 merged", 29), ref("NT12 merged 30", ...note(3, "NT12")), lines("NT12 merged rest", 10)], { verticalMerge: VerticalMergeType.RESTART })
                                    : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                                cell(`NT12 row ${row + 1}`),
                            ],
                        }),
                ),
            }),
            line("NT12 below"),
            line("NT13a above", { pageBreakBefore: true }),
            ref("NT13a reference", new Paragraph({ border: boxed, children: [new TextRun("NT13a note boxed 1")] }), new Paragraph({ border: boxed, children: [new TextRun("NT13a note boxed 2")] })),
            line("NT13a below"),
            line("NT13b above", { pageBreakBefore: true }),
            ref("NT13b reference", new Paragraph({ border: { bottom: boxed.bottom }, children: [new TextRun("NT13b note bottom border")] }), line("NT13b note after")),
            line("NT13b below"),
            line("NT13c above", { pageBreakBefore: true }),
            ref("NT13c reference", line("NT13c note auto 1", { spacing: { beforeAutoSpacing: true, afterAutoSpacing: true } } as object), line("NT13c note auto 2", { spacing: { beforeAutoSpacing: true, afterAutoSpacing: true } } as object)),
            line("NT13c below"),
        ],
    },
    // NT14a to NT14e, NT15, NT16: sections with note properties of their own, each injected after its marker
    ...["NT14a", "NT14b", "NT14c", "NT14d", "NT14e"].map(
        (name): ISectionOptions => ({
            properties: props(),
            children: [
                line(`${name} above`),
                marker(name),
                ...(name === "NT14a"
                    ? [0, 1, 2].flatMap((page) => [...fill(`${name} p${page + 1}`, 20), ref(`${name} p${page + 1} ref 1`, ...note(1, `${name} p${page + 1} a`)), ref(`${name} p${page + 1} ref 2`, ...note(1, `${name} p${page + 1} b`)), ...fill(`${name} p${page + 1} more`, 20)])
                    : name === "NT14c"
                      ? [...fill(name, 10), ref(`${name} ref`, ...note(2, name))]
                      : [...fill(name, 5), ref(`${name} ref 1`, ...note(1, `${name} 1`)), ref(`${name} ref 2`, ...note(1, `${name} 2`)), ref(`${name} ref 3`, ...note(1, `${name} 3`))]),
                line(`${name} below`),
            ],
        }),
    ),
    {
        properties: props(),
        children: [line("NT15 above"), ref("NT15 first", ...note(1, "NT15 first")), new Paragraph({ children: [new TextRun("NT15 own mark"), new TextRun("@@OWNMARK@@")] }), ref("NT15 third", ...note(1, "NT15 third")), line("NT15 below")],
    },
    { properties: props(), children: [line("NT16 above"), marker("NT16"), ...fill("NT16", 10), ref("NT16 ref 1", ...note(4, "NT16 a")), ref("NT16 ref 2", ...note(4, "NT16 b")), line("NT16 below")] },
];

/** Puts note properties into the section the marker paragraph is in, and takes the marker out */
const notesOf = (name: string, xml: string) => (parts: Map<string, string>) => {
    let text = parts.get("word/document.xml")!;
    const at = text.indexOf(`>${name} marker<`);
    const sectPr = text.indexOf("<w:sectPr", at);
    const open = text.indexOf(">", sectPr) + 1;
    // After the section's header and footer references, which come first
    let where = open;
    const references = /^<w:(header|footer)Reference [^>]*\/>/;
    for (let match = references.exec(text.slice(where)); match; match = references.exec(text.slice(where))) {
        where += match[0].length;
    }
    text = text.slice(0, where) + xml + text.slice(where);
    const start = text.lastIndexOf("<w:p>", at);
    const end = text.indexOf("</w:p>", at) + 6;
    parts.set("word/document.xml", text.slice(0, start) + text.slice(end));
};

await write({
    name: "word-stops-notes",
    sections,
    injections: [
        notesOf("NT14a", '<w:footnotePr><w:numRestart w:val="eachPage"/></w:footnotePr>'),
        notesOf("NT14b", '<w:footnotePr><w:numStart w:val="5"/></w:footnotePr>'),
        notesOf("NT14c", '<w:footnotePr><w:pos w:val="beneathText"/></w:footnotePr>'),
        notesOf("NT14d", '<w:footnotePr><w:numFmt w:val="upperRoman"/></w:footnotePr>'),
        notesOf("NT14e", '<w:footnotePr><w:numFmt w:val="chicago"/></w:footnotePr>'),
        notesOf("NT16", ""),
        // NT16's footnote columns are w15:footnoteColumns in the section's properties, at their end
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf(">NT16 ref 1<");
            const end = text.indexOf("</w:sectPr>", at);
            const withNamespace = text.includes('xmlns:w15="') ? text : text.replace("<w:document ", '<w:document xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" ');
            const shift = withNamespace.length - text.length;
            parts.set("word/document.xml", withNamespace.slice(0, end + shift) + '<w15:footnoteColumns w:val="2"/>' + withNamespace.slice(end + shift));
        },
        // NT15: a footnote with a mark of its own: a reference marked as followed by its own mark, then the mark
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text.replace(
                    '<w:r><w:t xml:space="preserve">@@OWNMARK@@</w:t></w:r>',
                    '<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:customMarkFollows="1" w:id="9999"/><w:t>*</w:t></w:r>',
                ),
            );
            const notes = parts.get("word/footnotes.xml")!;
            parts.set("word/footnotes.xml", notes.replace("</w:footnotes>", '<w:footnote w:id="9999"><w:p><w:r><w:t>* NT15 own mark note</w:t></w:r></w:p></w:footnote></w:footnotes>'));
        },
    ],
});

// word-stops-endnotes.docx
const endnoteBodies: Record<number, { children: Paragraph[] }> = {};
let endnoteCount = 0;
const endnote = (...children: Paragraph[]): EndnoteReferenceRun => {
    endnoteCount++;
    endnoteBodies[endnoteCount] = { children };
    return new EndnoteReferenceRun(endnoteCount);
};
const eref = (text: string, ...children: Paragraph[]): Paragraph => new Paragraph({ children: [new TextRun(text), endnote(...children)] });

await write({
    name: "word-stops-endnotes",
    options: { endnotes: endnoteBodies } as object,
    sections: [
        { properties: props(), children: [line("NE2 above"), line("NE2 section 1"), eref("NE2 s1 ref 1", line("NE2 s1 note 1")), eref("NE2 s1 ref 2", line("NE2 s1 note 2")), marker("NE2a")] },
        { properties: props(), children: [line("NE2 section 2"), eref("NE2 s2 ref 1", line("NE2 s2 note 1")), eref("NE2 s2 ref 2", line("NE2 s2 note 2")), marker("NE2b")] },
        { properties: props(), children: [line("NE2 section 3"), eref("NE2 s3 ref 1", line("NE2 s3 note 1")), eref("NE2 s3 ref 2", line("NE2 s3 note 2")), line("NE2 below"), marker("NE2c")] },
        { properties: props({ column: { count: 2, space: 720 } }), children: [line("NE1 above"), ...fill("NE1", 20), eref("NE1 ref 1", lines("NE1 note 1", 60, {}, "line")), eref("NE1 ref 2", lines("NE1 note 2", 60, {}, "line")), line("NE1 below"), marker("NE2d")] },
    ],
    injections: [
        notesOf("NE2a", '<w:endnotePr><w:pos w:val="sectEnd"/></w:endnotePr>'),
        notesOf("NE2b", '<w:endnotePr><w:pos w:val="sectEnd"/></w:endnotePr>'),
        notesOf("NE2c", '<w:endnotePr><w:pos w:val="sectEnd"/></w:endnotePr>'),
        notesOf("NE2d", '<w:endnotePr><w:pos w:val="sectEnd"/></w:endnotePr>'),
        (parts) => {
            const text = parts.get("word/settings.xml")!;
            parts.set("word/settings.xml", text.replace(/<w:endnotePr>/, '<w:endnotePr><w:pos w:val="sectEnd"/>'));
            // NE3: the separator says something
            const notes = parts.get("word/endnotes.xml")!;
            parts.set("word/endnotes.xml", notes.replace(/(<w:endnote w:type="separator"[^>]*>.*?<w:separator\/><\/w:r>)/, '$1<w:r><w:t xml:space="preserve"> NE3 separator</w:t></w:r>'));
        },
    ],
});
