/**
 * Probes of the footnotes and endnotes docx/layout still stops at after `word-stops-notes.docx` and
 * `word-stops-endnotes.docx` (NT2 to NT16, NE1 to NE3), written to reach the stops those didn't, and to settle what
 * their PDFs left open. Each document is small and of related probes, so one Word can't open doesn't lose the others.
 *
 * word-stops-notes2.docx, footnotes continued (NT2c to NT9e, NT21):
 * NT2c: a footnote of 120 lines from a section's last line, before a continuous section whose footer is 3 lines taller,
 *   both with PAGE and SECTIONPAGES in the footer ("a footnote continued across a continuous section break onto a page
 *   of its own": which section's footer the pages of the rest have, which changes how much of it is on them)
 * NT2d: a line at the top of a page whose footnote of 95 lines kept together starts on the next page, then a continuous
 *   section ("a footnote continued across a continuous section break onto a page of its own", after a line whose footnote
 *   starts on the next page)
 * NT3b: a line at the top of a page whose footnote of 95 lines kept together starts on the next page, then a line with a
 *   footnote of 10 lines ("footnotes after one that starts on the next page that don't fit below its end")
 * NT4b: 2 columns from a new page, the first line referring to a footnote of 120 lines, then a line and a continuous
 *   section of 5 lines ("a footnote continued from columns before a section on the same page")
 * NT5b: 2 columns from a new page, the first line referring to a footnote of 120 lines and the second to one of 2 ("a
 *   footnote below one that continues on the next page in columns")
 * NT4b's and NT5b's lines above them end the page before, as their first lines are their references
 * NT6b: 2 columns, a table of 49 rows of a line filling the first, 46 lines in the second, then a footnote of 3 lines from
 *   its line 47, as `word-watertight-notes.docx` FN1 with table rows ("a footnote in columns that moves its reference to
 *   the next page")
 * NT8b: a row that can't split, of 45 lines, at the top of a page, with a footnote of 10 lines kept together ("a table
 *   row and its footnote taller than a page")
 * NT8c: a row of 5 lines at the top of a page, its first line referring to a footnote of 50 lines kept together (the
 *   same, for a row that can split)
 * NT9d: a line at the top of a page referring to two footnotes of 30 lines kept together ("a line and its footnote taller
 *   than a page")
 * NT21: a line at a page's foot whose footnote of 40 lines continues, then a page break in the next paragraph's first run
 *   (w:br w:type="page"), rather than a page break before it as NT10b had
 *
 * word-stops-note-numbers.docx, footnotes numbered and placed (NT16b to NT20d):
 * NT16b to NT16e: footnotes in columns of their own (w15:footnoteColumns): 2 columns of footnotes of 5 and 3 lines (b),
 *   one of 9 lines (c), 3 columns of three footnotes of 2 lines (d), and a footnote of 70 lines that continues (e)
 * NT18: a section numbering its footnotes afresh in each section, with 2, then a section numbering them on through the
 *   document, with 2 ("notes numbered on through the document after a section that numbers its own afresh")
 * NT19a, NT19b: footnotes numbered afresh on each page in a section that starts on the page of the one before
 *   (continuous), with 2 footnotes in each section on the page (a), and in both sections (b)
 * NT20a to NT20d: footnotes below the text: after a last paragraph with 12 points after it (a), a footnote of 60 lines
 *   below the text, which continues (b), after a table (c), and in a section of 2 columns (d)
 *
 * word-stops-endnotes-columns1.docx to word-stops-endnotes-columns3.docx (NE4a to NE4c): endnotes after text in columns,
 * each at a document's end: a footnote of a line after 24 lines in 2 columns (a), endnotes of 40 lines after 10 lines
 * in 2 columns (b), and endnotes of 12 lines after 30 lines in 3 columns (c) ("endnotes after text in columns")
 * word-stops-endnotes-own.docx (NE5): an endnote with a mark of its own, "*", between two numbered ones
 * word-stops-endnotes-sections.docx (NE6): endnotes at the end of each section, as the settings say (w:endnotePr w:pos
 * sectEnd in the settings only), three sections with two endnotes each, the second section with w:noEndnote
 * word-stops-endnotes-separator.docx (NE7): an endnote separator of two paragraphs, the second "NE7 second paragraph",
 * and a continuation separator with "NE7 before" before its separator
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-notes2.ts [folder]
 */
import {
    EndnoteReferenceRun,
    Footer,
    type ISectionOptions,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { ALL_BORDERS, PAGE, cell, fill, footnote, line, lines, prose, withProperty, write } from "./kit";

const note = (count: number, name: string, options = {}): Paragraph[] => [lines(name, count, options, "note")];
const ref = (text: string, ...noteChildren: Paragraph[]): Paragraph =>
    new Paragraph({ children: [new TextRun(text), footnote(...noteChildren)] });
const marker = (name: string): Paragraph => line(`${name} marker`);
const props = (extra: object = {}) => ({ ...PAGE, type: SectionType.NEXT_PAGE, ...extra });
const TWO = { column: { count: 2, space: 720 } };
const pages = (name: string, extra: readonly Paragraph[] = []): Footer =>
    new Footer({
        children: [
            ...extra,
            new Paragraph({
                children: [
                    new TextRun(`${name} page `),
                    new TextRun({ children: [PageNumber.CURRENT] }),
                    new TextRun(" of section "),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES_IN_SECTION] }),
                ],
            }),
        ],
    });

/** Takes out of the footnotes part those no reference in the body refers to, which the kit writes for every document */
const onlyReferencedNotes = (parts: Map<string, string>): void => {
    const notes = parts.get("word/footnotes.xml");
    if (notes === undefined) {
        return;
    }
    const referenced = new Set(
        [...parts.get("word/document.xml")!.matchAll(/<w:footnoteReference [^>]*w:id="(-?\d+)"/g)].map(([, id]) => id),
    );
    parts.set(
        "word/footnotes.xml",
        notes.replace(/<w:footnote w:id="(\d+)">.*?<\/w:footnote>/gs, (one, id: string) => (referenced.has(id) ? one : "")),
    );
};

/** Puts properties into the section the marker paragraph is in, after its header and footer references, and takes the marker out */
const intoSection = (name: string, xml: string) => (parts: Map<string, string>) => {
    let text = parts.get("word/document.xml")!;
    const at = text.indexOf(`>${name} marker<`);
    const sectPr = text.indexOf("<w:sectPr", at);
    let where = text.indexOf(">", sectPr) + 1;
    const references = /^<w:(header|footer)Reference [^>]*\/>/;
    for (let match = references.exec(text.slice(where)); match; match = references.exec(text.slice(where))) {
        where += match[0].length;
    }
    text = text.slice(0, where) + xml + text.slice(where);
    const start = text.lastIndexOf("<w:p>", at);
    const end = text.indexOf("</w:p>", at) + 6;
    parts.set("word/document.xml", text.slice(0, start) + text.slice(end));
};

/** Puts an element at the end of the properties of the section the marker paragraph is in, and takes the marker out */
const atSectionEnd = (name: string, xml: string) => (parts: Map<string, string>) => {
    let text = parts.get("word/document.xml")!;
    const at = text.indexOf(`>${name} marker<`);
    const end = text.indexOf("</w:sectPr>", at);
    text = text.slice(0, end) + xml + text.slice(end);
    const start = text.lastIndexOf("<w:p>", at);
    const close = text.indexOf("</w:p>", at) + 6;
    parts.set("word/document.xml", text.slice(0, start) + text.slice(close));
};

const withW15 = (parts: Map<string, string>): void => {
    const text = parts.get("word/document.xml")!;
    if (!text.includes('xmlns:w15="')) {
        parts.set(
            "word/document.xml",
            text.replace("<w:document ", '<w:document xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '),
        );
    }
};

// word-stops-notes2.docx
await write({
    name: "word-stops-notes2",
    sections: [
        // NT2c
        {
            properties: props(),
            footers: { default: pages("NT2c") },
            children: [line("NT2c above"), ...fill("NT2c", 30), ref("NT2c reference", ...note(120, "NT2c"))],
        },
        {
            properties: props({ type: SectionType.CONTINUOUS }),
            footers: { default: pages("NT2c after", [line("NT2c footer 1"), line("NT2c footer 2"), line("NT2c footer 3")]) },
            children: [...fill("NT2c after", 5), line("NT2c below")],
        },
        // NT2d
        {
            properties: props(),
            children: [line("NT2d above"), ...fill("NT2d", 50), ref("NT2d reference", ...note(95, "NT2d", { keepLines: true }))],
        },
        {
            properties: props({ type: SectionType.CONTINUOUS }),
            children: [line("NT2d after", { pageBreakBefore: true }), ...fill("NT2d after", 5), line("NT2d below")],
        },
        // NT3b
        {
            properties: props(),
            children: [
                line("NT3b above"),
                ...fill("NT3b", 50),
                ref("NT3b reference", ...note(95, "NT3b", { keepLines: true })),
                ref("NT3b second", ...note(10, "NT3b second")),
                ...fill("NT3b after", 5),
                line("NT3b below"),
                // NT4b's line above, which ends this page, so its reference is the first line of its columns' page
                line("NT4b above"),
            ],
        },
        // NT4b
        {
            properties: props(TWO),
            children: [ref("NT4b reference", ...note(120, "NT4b")), line("NT4b more")],
        },
        {
            properties: props({ type: SectionType.CONTINUOUS }),
            children: [...fill("NT4b after", 5), line("NT4b below"), line("NT5b above")],
        },
        // NT5b
        {
            properties: props(TWO),
            children: [
                ref("NT5b reference", ...note(120, "NT5b")),
                ref("NT5b second", ...note(2, "NT5b second")),
                ...fill("NT5b more", 7),
                line("NT5b below"),
            ],
        },
        // NT6b
        {
            properties: props(TWO),
            children: [
                line("NT6b above"),
                new Table({
                    width: { size: 4153, type: WidthType.DXA },
                    columnWidths: [4153],
                    borders: ALL_BORDERS,
                    rows: Array.from({ length: 49 }, (_, index) => new TableRow({ children: [cell(`NT6b row ${index + 1}`)] })),
                }),
                ...fill("NT6b", 46),
                ref("NT6b reference", ...note(3, "NT6b")),
                ...fill("NT6b after", 10),
                line("NT6b below"),
            ],
        },
        // NT8b, NT8c, NT9d, NT21
        {
            properties: props(),
            children: [
                line("NT8b above"),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [
                        new TableRow({
                            cantSplit: true,
                            children: [cell([lines("NT8b row", 44), ref("NT8b row reference", ...note(10, "NT8b", { keepLines: true }))])],
                        }),
                    ],
                }),
                line("NT8b below"),
                line("NT8c above", { pageBreakBefore: true }),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [
                        new TableRow({
                            children: [cell([ref("NT8c row 1", ...note(50, "NT8c", { keepLines: true })), lines("NT8c row more", 4)])],
                        }),
                    ],
                }),
                line("NT8c below"),
                line("NT9d above", { pageBreakBefore: true }),
                new Paragraph({
                    children: [
                        new TextRun("NT9d reference"),
                        footnote(...note(30, "NT9d first", { keepLines: true })),
                        footnote(...note(30, "NT9d second", { keepLines: true })),
                    ],
                }),
                ...fill("NT9d after", 5),
                line("NT9d below"),
                line("NT21 above", { pageBreakBefore: true }),
                ...fill("NT21", 30),
                new Paragraph({
                    children: [new TextRun(`NT21 reference ${prose(20)}`), footnote(...note(40, "NT21")), new TextRun(` ${prose(30)}`)],
                }),
                new Paragraph({ children: [new TextRun("@@PAGEBREAK@@"), new TextRun(`NT21 next ${prose(80)}`)] }),
                line("NT21 below"),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text.replace('<w:r><w:t xml:space="preserve">@@PAGEBREAK@@</w:t></w:r>', '<w:r><w:br w:type="page"/></w:r>'),
            );
        },
    ],
});

// word-stops-note-numbers.docx
const noteSection = (name: string, children: readonly (Paragraph | Table)[], extra: object = {}, below = true): ISectionOptions => ({
    properties: props(extra),
    children: [line(`${name} above`), marker(name), ...children, ...(below ? [line(`${name} below`)] : [])],
});
await write({
    name: "word-stops-note-numbers",
    sections: [
        noteSection("NT16b", [...fill("NT16b", 10), ref("NT16b ref 1", ...note(5, "NT16b a")), ref("NT16b ref 2", ...note(3, "NT16b b"))]),
        noteSection("NT16c", [...fill("NT16c", 10), ref("NT16c ref", ...note(9, "NT16c"))]),
        noteSection("NT16d", [
            ...fill("NT16d", 10),
            ref("NT16d ref 1", ...note(2, "NT16d a")),
            ref("NT16d ref 2", ...note(2, "NT16d b")),
            ref("NT16d ref 3", ...note(2, "NT16d c")),
        ]),
        noteSection("NT16e", [...fill("NT16e", 40), ref("NT16e ref", ...note(70, "NT16e")), ...fill("NT16e after", 10)]),
        noteSection(
            "NT18",
            [marker("NT18a"), ref("NT18a ref 1", ...note(1, "NT18a 1")), ref("NT18a ref 2", ...note(1, "NT18a 2"))],
            {},
            false,
        ),
        {
            properties: props(),
            children: [
                marker("NT18b"),
                ref("NT18b ref 1", ...note(1, "NT18b 1")),
                ref("NT18b ref 2", ...note(1, "NT18b 2")),
                line("NT18 below"),
            ],
        },
        noteSection("NT19a", [ref("NT19a ref 1", ...note(1, "NT19a 1")), ref("NT19a ref 2", ...note(1, "NT19a 2"))]),
        {
            properties: props({ type: SectionType.CONTINUOUS }),
            children: [
                marker("NT19a2"),
                ref("NT19a ref 3", ...note(1, "NT19a 3")),
                ref("NT19a ref 4", ...note(1, "NT19a 4")),
                line("NT19a after"),
            ],
        },
        noteSection("NT19b", [ref("NT19b ref 1", ...note(1, "NT19b 1")), ref("NT19b ref 2", ...note(1, "NT19b 2"))]),
        {
            properties: props({ type: SectionType.CONTINUOUS }),
            children: [
                marker("NT19b2"),
                ref("NT19b ref 3", ...note(1, "NT19b 3")),
                ref("NT19b ref 4", ...note(1, "NT19b 4")),
                line("NT19b after"),
            ],
        },
        noteSection(
            "NT20a",
            [...fill("NT20a", 5), ref("NT20a ref", ...note(2, "NT20a")), line("NT20a spaced last", { spacing: { after: 240 } })],
            {},
            false,
        ),
        noteSection("NT20b", [...fill("NT20b", 20), ref("NT20b ref", ...note(60, "NT20b")), ...fill("NT20b after", 5)]),
        noteSection(
            "NT20c",
            [
                ...fill("NT20c", 5),
                ref("NT20c ref", ...note(2, "NT20c")),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [new TableRow({ children: [cell("NT20c last row")] })],
                }),
            ],
            {},
            false,
        ),
        noteSection("NT20d", [...fill("NT20d", 10), ref("NT20d ref", ...note(2, "NT20d")), ...fill("NT20d after", 10)], TWO),
    ],
    injections: [
        onlyReferencedNotes,
        withW15,
        ...(
            [
                ["NT16b", 2],
                ["NT16c", 2],
                ["NT16d", 3],
                ["NT16e", 2],
            ] as const
        ).map(([name, count]) => atSectionEnd(name, `<w15:footnoteColumns w:val="${count}"/>`)),
        intoSection("NT18a", '<w:footnotePr><w:numRestart w:val="eachSect"/></w:footnotePr>'),
        intoSection("NT18b", ""),
        intoSection("NT19a", ""),
        intoSection("NT19a2", '<w:footnotePr><w:numRestart w:val="eachPage"/></w:footnotePr>'),
        intoSection("NT19b", '<w:footnotePr><w:numRestart w:val="eachPage"/></w:footnotePr>'),
        intoSection("NT19b2", '<w:footnotePr><w:numRestart w:val="eachPage"/></w:footnotePr>'),
        ...["NT20a", "NT20b", "NT20c", "NT20d"].map((name) =>
            intoSection(name, '<w:footnotePr><w:pos w:val="beneathText"/></w:footnotePr>'),
        ),
    ],
});

// The endnote documents: endnotes go at a document's end, so each case is a document of its own
const endnotesOf = (bodies: Readonly<Record<number, readonly Paragraph[]>>): object => ({
    endnotes: Object.fromEntries(Object.entries(bodies).map(([id, children]) => [id, { children }])),
});
const eref = (text: string, id: number): Paragraph => new Paragraph({ children: [new TextRun(text), new EndnoteReferenceRun(id)] });

for (const [name, document, columns, before, noteLines] of [
    ["NE4a", "word-stops-endnotes-columns1", 2, 22, [1]],
    ["NE4b", "word-stops-endnotes-columns2", 2, 8, [20, 20]],
    ["NE4c", "word-stops-endnotes-columns3", 3, 28, [6, 6]],
] as const) {
    await write({
        name: document,
        options: endnotesOf(
            Object.fromEntries(noteLines.map((count, index) => [index + 1, [lines(`${name} note ${index + 1}`, count, {}, "line")]])),
        ),
        sections: [
            {
                properties: props({ column: { count: columns, space: 720 } }),
                children: [
                    line(`${name} above`),
                    ...fill(name, before),
                    ...noteLines.map((_, index) => eref(`${name} ref ${index + 1}`, index + 1)),
                    line(`${name} below`),
                ],
            },
        ],
    });
}

// NE5: an endnote with a mark of its own, between two numbered ones
await write({
    name: "word-stops-endnotes-own",
    options: endnotesOf({ 1: [line("NE5 first note")], 2: [line("NE5 third note")] }),
    sections: [
        {
            properties: props(),
            children: [
                line("NE5 above"),
                eref("NE5 first", 1),
                new Paragraph({ children: [new TextRun("NE5 own mark"), new TextRun("@@OWNMARK@@")] }),
                eref("NE5 third", 2),
                line("NE5 below"),
            ],
        },
    ],
    injections: [
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text.replace(
                    '<w:r><w:t xml:space="preserve">@@OWNMARK@@</w:t></w:r>',
                    '<w:r><w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr><w:endnoteReference w:customMarkFollows="1" w:id="9999"/><w:t>*</w:t></w:r>',
                ),
            );
            const notes = parts.get("word/endnotes.xml")!;
            parts.set(
                "word/endnotes.xml",
                notes.replace(
                    "</w:endnotes>",
                    '<w:endnote w:id="9999"><w:p><w:r><w:t>* NE5 own mark note</w:t></w:r></w:p></w:endnote></w:endnotes>',
                ),
            );
        },
    ],
});

// NE6: endnotes at the end of each section, as the settings say, the second section suppressing its own
await write({
    name: "word-stops-endnotes-sections",
    options: endnotesOf(Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, [line(`NE6 s${Math.ceil(id / 2)} note ${2 - (id % 2)}`)]]))),
    sections: [1, 2, 3].map((section): ISectionOptions => ({
        properties: props(),
        children: [
            ...(section === 1 ? [line("NE6 above")] : []),
            line(`NE6 section ${section}`),
            eref(`NE6 s${section} ref 1`, 2 * section - 1),
            eref(`NE6 s${section} ref 2`, 2 * section),
            ...(section === 3 ? [line("NE6 below")] : []),
            marker(`NE6s${section}`),
        ],
    })),
    injections: [
        intoSection("NE6s1", ""),
        atSectionEnd("NE6s2", ""),
        intoSection("NE6s3", ""),
        (parts) => {
            // The second section's own endnotes are suppressed (w:noEndnote), after its page numbering, as the schema has it
            let text = parts.get("word/document.xml")!;
            const at = text.indexOf(">NE6 s2 ref 2<");
            text = withProperty(text, "w:sectPr", "<w:noEndnote/>", text.indexOf("<w:sectPr", at));
            parts.set("word/document.xml", text);
            const settings = parts.get("word/settings.xml")!;
            parts.set(
                "word/settings.xml",
                settings.includes("<w:endnotePr>")
                    ? settings.replace("<w:endnotePr>", '<w:endnotePr><w:pos w:val="sectEnd"/>')
                    : withProperty(settings, "w:settings", '<w:endnotePr><w:pos w:val="sectEnd"/></w:endnotePr>', 0),
            );
        },
    ],
});

// NE7: an endnote separator of two paragraphs, and a continuation separator with text before its separator
await write({
    name: "word-stops-endnotes-separator",
    options: endnotesOf({ 1: [lines("NE7 note", 60, {}, "line")] }),
    sections: [{ properties: props(), children: [line("NE7 above"), ...fill("NE7", 20), eref("NE7 ref", 1), line("NE7 below")] }],
    injections: [
        (parts) => {
            const notes = parts.get("word/endnotes.xml")!;
            parts.set(
                "word/endnotes.xml",
                notes
                    .replace(
                        /(<w:endnote w:type="separator"[^>]*>.*?)(<\/w:endnote>)/s,
                        '$1<w:p><w:r><w:t xml:space="preserve">NE7 second paragraph</w:t></w:r></w:p>$2',
                    )
                    .replace(
                        /(<w:endnote w:type="continuationSeparator"[^>]*><w:p>(?:<w:pPr>.*?<\/w:pPr>)?)/s,
                        '$1<w:r><w:t xml:space="preserve">NE7 before </w:t></w:r>',
                    ),
            );
        },
    ],
});
