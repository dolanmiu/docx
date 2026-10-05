/**
 * Probes of hidden paragraph marks and of tracked changes, where docx/layout stops after `word-breaks-and-tabs.docx`
 * (HM1 to HM7), `word-hidden-paragraphs.docx` (HP1 to HP8), `word-watertight-markup.docx` (MK1 to MK6),
 * `word-tracked-changes.docx` (MK7 to MK13) and `word-tracked-tables.docx` (MK14). docx can't write a hidden or deleted
 * paragraph mark, a moved one, or deleted section breaks, so each is a marker replaced in the XML.
 *
 * Hidden (word-stops-marks.docx, HD):
 * HD1a to HD1h: two paragraphs joined by a hidden mark that differ in: a, size (11 and 16); b, font (Calibri and Times
 *   New Roman); c, a right indent of 2000; d, a first line indent of 720; e, space before 240 on the second; f, line
 *   spacing 1.5 on the second; g, tab stops of their own; h, borders on the second ("a hidden paragraph mark between
 *   paragraphs formatted differently but for their alignment, left indent and space"; HM1g to HM1i showed some)
 * HD2: a hidden mark between two paragraphs of a cell of a table given no widths, whose words decide the column's width
 *   ("...between paragraphs of text in a table whose columns Word sizes to their text"; HM7 not explained)
 * HD3: a hidden mark at the end of a content control's paragraph ("a hidden paragraph mark at the edge of a content
 *   control")
 * HD4a, HD4b: a paragraph with nothing shown and its mark hidden at the end of the header (a) and of a footnote (b)
 * HD5: a paragraph with nothing shown and its mark hidden before a table... and before a content control of a block (b)
 * HD6: a hidden mark before a paragraph with nothing shown and its mark hidden
 * HD7: a paragraph kept with the next before a hidden paragraph, at the foot of a page
 * HD8: two paragraphs with the same borders around a hidden paragraph without them
 * HD9a, HD9b: a footnote reference in hidden text, between two footnotes (a), and an endnote reference (b): whether the
 *   notes after it are numbered as though it were there
 * HD10: a hidden section break: a paragraph ending a section whose mark is hidden
 *
 * Tracked changes (TR), laid out as Word shows them with markup in balloons, as MK1 settled:
 * TR1a to TR1d: in a cell of a table given no widths: a deleted picture of 2 inches (a), a deleted tab (b), a deleted
 *   line break (c), and a deleted footnote reference (d) ("a deleted picture, tab, break or note reference in a table
 *   whose columns Word sizes to their text")
 * TR2: a field (PAGE) whose instruction is half deleted ("a field partly deleted in a tracked change")
 * TR3a, TR3b: a footnote reference moved (w:moveFrom, w:moveTo), each end referring to a footnote of its own, as Word
 *   writes a moved reference (a), and a deleted endnote reference (b)
 * TR4c: a deleted row in a table with single borders and space between its cells of 40
 * TR4a, TR4b: a deleted row whose cells have borders of 3 points where the rows around it have half a point (a), and a deleted row with a
 *   numbered paragraph and a footnote reference in it (b)
 * TR5: a table with a header of two rows and a style of the probe's own with first-row formatting (bold 14 points, a
 *   bottom border of 2.25 points), its second header row deleted
 * TR6: a cell merged down from a deleted row, with text in it
 * TR7: a paragraph moved with its mark (w:moveFrom on the mark), to after the paragraph after it
 * TR8: a deleted mark at the end of a content control's paragraph
 * TR9: a deleted mark before a paragraph with nothing shown and its mark hidden
 * TR10a, TR10b: a deleted section break with no paragraph after it (the document's last but one paragraph), and a deleted
 *   section break between sections with other headers, page numbers and starts
 * TR11: a deleted mark between two paragraphs of a cell of a table given no widths
 *
 * The documents, each of related probes, so one that Word can't open doesn't lose the others:
 * word-stops-hidden.docx: HD1a to HD1h, HD2, HD5 to HD8
 * word-stops-hidden-edges.docx: HD3, HD4a, HD4b, HD9a, HD9b, HD10
 * word-stops-tracked.docx: TR1a to TR1d, TR2, TR4a to TR4c, TR5, TR6, TR11
 * word-stops-tracked-edges.docx: TR3b, TR8, TR9, TR10a, TR10b
 * word-stops-moves.docx: TR3a, TR7
 *
 * Word 16 for Mac couldn't open the batch's word-stops-marks.docx, which had all of them ("Word experienced an error
 * trying to open the file"). Its parts were valid against the schemas. What Word may not take: TR3a's moved reference
 * and its source referred to the same footnote, and its move and TR7's had none of the range marks Word writes around a
 * move (w:moveFromRangeStart and the like), and TR7's had no destination. They are now written as Word writes moves, in
 * a document of their own all the same.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-marks.ts [folder]
 */
import {
    EndnoteReferenceRun,
    Header,
    LevelFormat,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TabStopType,
    TextRun,
    VerticalMergeType,
    WidthType,
} from "docx";

import { ALL_BORDERS, PAGE, cell, fill, footnote, injectIntoParagraph, line, marker, picture, probe, prose, replaceMarkerRun, withProperty, write } from "./kit";

const DATE = 'w:author="probe" w:date="2026-10-04T00:00:00Z"';
const HIDDEN_MARK = { rPr: "<w:vanish/>" };
// Each tracked change has an id of its own
let changeId = 9000;
const nextId = (): number => ++changeId;
const deletedMark = () => ({ rPr: `<w:del w:id="${nextId()}" ${DATE}/>` });
const boxed = Object.fromEntries(["top", "bottom", "left", "right"].map((side) => [side, { style: "single", size: 4, space: 4, color: "000000" }]));

const hdCases = [
    { name: "HD1a", second: { run: { size: 32 } } },
    { name: "HD1b", second: { run: { font: "Times New Roman" } } },
    { name: "HD1c", second: { paragraph: { indent: { right: 2000 } } } },
    { name: "HD1d", second: { paragraph: { indent: { firstLine: 720 } } } },
    { name: "HD1e", second: { paragraph: { spacing: { before: 240 } } } },
    { name: "HD1f", second: { paragraph: { spacing: { line: 360 } } } },
    { name: "HD1g", second: { paragraph: { tabStops: [{ type: TabStopType.LEFT, position: 3000 }] } } },
    { name: "HD1h", second: { paragraph: { border: boxed } } },
] as const;

const joined = (name: string, second: { readonly run?: object; readonly paragraph?: object }, inject = "HID"): Paragraph[] => [
    new Paragraph({ children: [new TextRun(`${name} first ${prose(20)}`), marker(`${inject}_${name}`)] }),
    new Paragraph({ ...(second.paragraph ?? {}), children: [new TextRun({ text: `${name} second\t${prose(30)}`, ...(second.run ?? {}) })] }),
];

/** Takes out of the footnotes part those no reference in the body refers to, which the kit writes for every document */
const onlyReferencedNotes = (parts: Map<string, string>): void => {
    const notes = parts.get("word/footnotes.xml");
    if (notes === undefined) {
        return;
    }
    const referenced = new Set([...parts.get("word/document.xml")!.matchAll(/<w:footnoteReference [^>]*w:id="(-?\d+)"/g)].map(([, id]) => id));
    parts.set(
        "word/footnotes.xml",
        notes.replace(/<w:footnote w:id="(\d+)">.*?<\/w:footnote>/gs, (note, id: string) => (referenced.has(id) ? note : "")),
    );
};

/** Adds footnotes of the ids given to the footnotes part, each a paragraph of text */
const addNotes =
    (notes: Readonly<Record<number, string>>) =>
    (parts: Map<string, string>): void => {
        const xml = Object.entries(notes)
            .map(([id, text]) => `<w:footnote w:id="${id}"><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:footnote>`)
            .join("");
        parts.set("word/footnotes.xml", parts.get("word/footnotes.xml")!.replace("</w:footnotes>", `${xml}</w:footnotes>`));
    };

/** A section break's mark: docx writes the section's properties in an empty paragraph after its marker's */
const sectionMark =
    (name: string, mark: string) =>
    (parts: Map<string, string>): void => {
        let text = parts.get("word/document.xml")!;
        const at = text.indexOf(`@@${name}@@`);
        const start = text.lastIndexOf("<w:p>", at);
        const end = text.indexOf("</w:p>", at) + 6;
        text = text.slice(0, start) + text.slice(end);
        const sectPr = text.indexOf("<w:sectPr", start);
        parts.set("word/document.xml", `${text.slice(0, sectPr)}<w:rPr>${mark}</w:rPr>${text.slice(sectPr)}`);
    };

/** A paragraph in a content control, its mark hidden or deleted, in place of the paragraph of a marker */
const inControl =
    (name: string, mark: string, id: number) =>
    (parts: Map<string, string>): void => {
        const text = parts.get("word/document.xml")!;
        const at = text.indexOf(`@@${name}@@`);
        const start = text.lastIndexOf("<w:p>", at);
        const end = text.indexOf("</w:p>", at) + 6;
        const probeName = name.split("_")[1];
        const sdt = `<w:sdt><w:sdtPr><w:alias w:val="${probeName}"/><w:id w:val="${id}"/></w:sdtPr><w:sdtContent><w:p><w:pPr><w:rPr>${mark}</w:rPr></w:pPr><w:r><w:t>${probeName} in the control</w:t></w:r></w:p></w:sdtContent></w:sdt>`;
        parts.set("word/document.xml", text.slice(0, start) + sdt + text.slice(end));
    };

/** Deletes the rows whose text is given, with w:del in their properties */
const deletedRows =
    (...names: readonly string[]) =>
    (parts: Map<string, string>): void => {
        let text = parts.get("word/document.xml")!;
        for (const name of names) {
            const at = text.indexOf(name);
            const row = text.lastIndexOf("<w:tr>", at);
            text = withProperty(text, "w:trPr", `<w:del w:id="${nextId()}" ${DATE}/>`, row + "<w:tr>".length, text.indexOf("<w:tc>", row));
        }
        parts.set("word/document.xml", text);
    };

/** A table style with formatting of its own for the first row, as Word's built-in styles have, for TR5 */
const PROBE_TABLE_STYLE =
    '<w:style w:type="table" w:styleId="ProbeTable"><w:name w:val="Probe Table"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr><w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:tcPr><w:tcBorders><w:bottom w:val="single" w:sz="18" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr></w:tblStylePr></w:style>';

const NUMBERS = { config: [{ reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] };

// Each document's sections are made when it is written, so a footnote's paragraph is marked once, by its own document

// word-stops-hidden.docx: hidden marks between paragraphs of the body
await write({
    name: "word-stops-hidden",
    sections: [
        {
            properties: PAGE,
            children: [
                ...hdCases.flatMap(({ name, second }) => probe(name, joined(name, second))),
                ...probe("HD2", [
                    new Table({
                        borders: ALL_BORDERS,
                        rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("HD2 alpha beta"), marker("HID_HD2")] }), line("HD2 gamma delta epsilon zeta")]), cell("HD2 other")] })],
                    }),
                ]),
                ...probe("HD5", [new Paragraph({ children: [marker("HID_HD5")] }), new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell("HD5 table")] })] })]),
                ...probe("HD6", [new Paragraph({ children: [new TextRun("HD6 first"), marker("HID_HD6")] }), new Paragraph({ children: [marker("HID_HD6b")] }), line(`HD6 last ${prose(20)}`)]),
                ...probe("HD7", [...fill("HD7", 47), line("HD7 kept", { keepNext: true }), new Paragraph({ children: [marker("HID_HD7")] }), line(`HD7 after ${prose(40)}`)]),
                ...probe("HD8", [
                    new Paragraph({ border: boxed, children: [new TextRun("HD8 boxed 1")] }),
                    new Paragraph({ children: [marker("HID_HD8")] }),
                    new Paragraph({ border: boxed, children: [new TextRun("HD8 boxed 2")] }),
                ]),
            ],
        },
    ],
    injections: [onlyReferencedNotes, ...[...hdCases.map(({ name }) => name), "HD2", "HD5", "HD6", "HD6b", "HD7", "HD8"].map((name) => injectIntoParagraph(`HID_${name}`, HIDDEN_MARK))],
});

// word-stops-hidden-edges.docx: hidden marks in a content control, a header and a footnote, hidden note references, and
// a hidden section break
await write({
    name: "word-stops-hidden-edges",
    options: { endnotes: { 1: { children: [line("HD9b note one")] }, 2: { children: [line("HD9b note two")] } } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("HD3", [new Paragraph({ children: [marker("SDT_HD3")] }), line(`HD3 after ${prose(20)}`)]),
                ...probe("HD4b", [new Paragraph({ children: [new TextRun("HD4b reference"), footnote(line("HD4b note"), new Paragraph({ children: [marker("HID_HD4b")] }))] })]),
                ...probe("HD9a", [
                    new Paragraph({ children: [new TextRun("HD9a one"), footnote(line("HD9a note one"))] }),
                    new Paragraph({ children: [new TextRun("HD9a hidden"), marker("HIDREF_HD9a")] }),
                    new Paragraph({ children: [new TextRun("HD9a three"), footnote(line("HD9a note three"))] }),
                ]),
                ...probe("HD9b", [new Paragraph({ children: [new TextRun("HD9b hidden"), new EndnoteReferenceRun(1), marker("HIDE_LAST_HD9b")] }), new Paragraph({ children: [new TextRun("HD9b two"), new EndnoteReferenceRun(2)] })]),
                ...probe("HD10", [line("HD10 first section"), new Paragraph({ children: [marker("HIDSECT_HD10")] })], { below: false }),
            ],
        },
        { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: [line("HD10 second section"), line("HD10 below")] },
        // HD4a: the header's last paragraph shows nothing and its mark is hidden, in a section of its own
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            headers: { default: new Header({ children: [line("HD4a header"), new Paragraph({ children: [marker("HID_HD4a")] })] }) },
            children: [...probe("HD4a", [line(`HD4a ${prose(30)}`)])],
        },
    ],
    injections: [
        onlyReferencedNotes,
        injectIntoParagraph("HID_HD4b", HIDDEN_MARK, "word/footnotes.xml"),
        (parts) => {
            const header = [...parts.keys()].find((path) => /word\/header\d*\.xml$/.test(path) && parts.get(path)!.includes("@@HID_HD4a@@"))!;
            injectIntoParagraph("HID_HD4a", HIDDEN_MARK, header)(parts);
        },
        sectionMark("HIDSECT_HD10", "<w:vanish/>"),
        inControl("SDT_HD3", "<w:vanish/>", 907),
        // HD9a: a footnote reference in hidden text
        replaceMarkerRun("HIDREF_HD9a", '<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/><w:vanish/></w:rPr><w:footnoteReference w:id="9100"/></w:r>'),
        addNotes({ 9100: "HD9a hidden note" }),
        // HD9b: the endnote reference before the marker is hidden
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf("@@HIDE_LAST_HD9b@@");
            const start = text.lastIndexOf("<w:r>", text.lastIndexOf("<w:endnoteReference", at));
            parts.set("word/document.xml", text.slice(0, start) + text.slice(start).replace(/<w:rPr>/, "<w:rPr><w:vanish/>"));
            replaceMarkerRun("HIDE_LAST_HD9b", "")(parts);
        },
    ],
});

// word-stops-tracked.docx: deletions in tables sized to their text, a partly deleted field, and deleted rows
await write({
    name: "word-stops-tracked",
    options: { numbering: NUMBERS } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("TR1a", [new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TR1a word "), marker("DELPIC_TR1a"), picture(144, 20)] })]), cell("TR1a other")] })] })]),
                ...probe("TR1b", [new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TR1b word"), marker("DELTAB_TR1b"), new TextRun("after")] })]), cell("TR1b other")] })] })]),
                ...probe("TR1c", [new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TR1c alphabetical"), marker("DELBR_TR1c"), new TextRun("ab")] })]), cell("TR1c other")] })] })]),
                ...probe("TR1d", [new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TR1d word"), marker("DELNOTE_TR1d")] })]), cell("TR1d other")] })] })]),
                ...probe("TR2", [new Paragraph({ children: [new TextRun("TR2 page "), marker("FIELD_TR2"), new TextRun(` ${prose(20)}`)] })]),
                ...probe("TR4a", [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        rows: [1, 2, 3].map((row) => new TableRow({ children: [cell(`TR4a row ${row}${row === 2 ? " deleted" : ""}`, row === 2 ? { borders: { top: { style: "single", size: 24, color: "000000" }, bottom: { style: "single", size: 24, color: "000000" } } } : {})] })),
                    }),
                ]),
                ...probe("TR4b", [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        rows: [1, 2, 3].map(
                            (row) =>
                                new TableRow({
                                    children: [
                                        cell(row === 2 ? [new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("TR4b row 2 deleted"), footnote(line("TR4b note"))] })] : `TR4b row ${row}`),
                                    ],
                                }),
                        ),
                    }),
                ]),
                ...probe("TR4c", [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        cellSpacing: { value: 40, type: WidthType.DXA },
                        rows: [1, 2, 3].map((row) => new TableRow({ children: [cell(`TR4c row ${row}${row === 2 ? " deleted" : ""}`)] })),
                    }),
                ]),
                ...probe("TR5", [
                    new Table({
                        style: "ProbeTable",
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        rows: [1, 2, 3, 4].map((row) => new TableRow({ tableHeader: row <= 2, children: [cell(`TR5 row ${row}${row === 2 ? " deleted" : ""}`)] })),
                    }),
                ]),
                ...probe("TR6", [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [4513, 4513],
                        borders: ALL_BORDERS,
                        rows: [1, 2, 3].map(
                            (row) =>
                                new TableRow({
                                    children: [
                                        row === 1 ? cell("TR6 merged from the deleted row\nTR6 merged line 2", { verticalMerge: VerticalMergeType.RESTART }) : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                                        cell(`TR6 row ${row}${row === 1 ? " deleted" : ""}`),
                                    ],
                                }),
                        ),
                    }),
                ]),
                ...probe("TR11", [
                    new Table({
                        borders: ALL_BORDERS,
                        rows: [new TableRow({ children: [cell([new Paragraph({ children: [new TextRun("TR11 alpha beta"), marker("DEL_TR11")] }), line("TR11 gamma delta epsilon zeta")]), cell("TR11 other")] })],
                    }),
                ]),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        (parts) => {
            const styles = parts.get("word/styles.xml")!;
            parts.set("word/styles.xml", styles.replace("</w:styles>", `${PROBE_TABLE_STYLE}</w:styles>`));
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf("TR5 row 1");
            parts.set("word/document.xml", withProperty(text, "w:tblPr", '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/>', text.lastIndexOf("<w:tbl>", at)));
        },
        injectIntoParagraph("DEL_TR11", deletedMark()),
        // TR1: deleted picture, tab, break and footnote reference in a cell
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf("@@DELPIC_TR1a@@");
            const start = text.indexOf("<w:r>", at);
            const end = text.indexOf("</w:r>", start) + 6;
            parts.set("word/document.xml", text.slice(0, start) + `<w:del w:id="${nextId()}" ${DATE}>${text.slice(start, end)}</w:del>` + text.slice(end));
            replaceMarkerRun("DELPIC_TR1a", "")(parts);
        },
        replaceMarkerRun("DELTAB_TR1b", `<w:del w:id="${nextId()}" ${DATE}><w:r><w:tab/></w:r></w:del>`),
        replaceMarkerRun("DELBR_TR1c", `<w:del w:id="${nextId()}" ${DATE}><w:r><w:br/></w:r></w:del>`),
        replaceMarkerRun("DELNOTE_TR1d", `<w:del w:id="${nextId()}" ${DATE}><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="9101"/></w:r></w:del>`),
        addNotes({ 9101: "TR1d deleted note" }),
        replaceMarkerRun(
            "FIELD_TR2",
            `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PA</w:instrText></w:r><w:del w:id="${nextId()}" ${DATE}><w:r><w:delInstrText xml:space="preserve">GE </w:delInstrText></w:r></w:del><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>9</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`,
        ),
        // TR4a, TR4b, TR4c, TR5, TR6: the rows named "deleted" are deleted
        deletedRows("TR4a row 2 deleted", "TR4b row 2 deleted", "TR4c row 2 deleted", "TR5 row 2 deleted", "TR6 row 1 deleted"),
    ],
});

// word-stops-tracked-edges.docx: a deleted endnote reference, deleted marks in a content control and before a hidden
// paragraph, and deleted section breaks
await write({
    name: "word-stops-tracked-edges",
    options: { endnotes: { 1: { children: [line("TR3b kept note")] }, 2: { children: [line("TR3b deleted note")] } } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("TR3b", [new Paragraph({ children: [new TextRun("TR3b deleted endnote"), marker("DELEND_TR3b"), new TextRun(" and kept"), new EndnoteReferenceRun(1)] })]),
                ...probe("TR8", [new Paragraph({ children: [marker("SDTDEL_TR8")] }), line(`TR8 after ${prose(20)}`)]),
                ...probe("TR9", [new Paragraph({ children: [new TextRun("TR9 first"), marker("DEL_TR9")] }), new Paragraph({ children: [marker("HID_TR9")] }), line(`TR9 last ${prose(20)}`)]),
                ...probe("TR10b", [line("TR10b first section"), new Paragraph({ children: [marker("DELSECT_TR10b")] })], { below: false }),
            ],
        },
        {
            properties: { page: { ...PAGE.page, pageNumbers: { start: 7 } }, type: SectionType.ODD_PAGE },
            headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun("TR10b header "), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
            children: [line("TR10b second section"), line("TR10b below")],
        },
        // TR10a: a section the same as the last, whose break is deleted, with no paragraph after it in the document
        { properties: { ...PAGE, type: SectionType.NEXT_PAGE }, children: [...probe("TR10a", [line(`TR10a ${prose(20)}`), new Paragraph({ children: [marker("DELSECT_TR10a")] })], { below: false })] },
        { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: [] },
    ],
    injections: [
        onlyReferencedNotes,
        // The deleted endnote is the second, after the kept one the reference after it refers to
        replaceMarkerRun("DELEND_TR3b", `<w:del w:id="${nextId()}" ${DATE}><w:r><w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr><w:endnoteReference w:id="2"/></w:r></w:del>`),
        inControl("SDTDEL_TR8", `<w:del w:id="${nextId()}" ${DATE}/>`, 910),
        injectIntoParagraph("DEL_TR9", deletedMark()),
        injectIntoParagraph("HID_TR9", HIDDEN_MARK),
        sectionMark("DELSECT_TR10a", `<w:del w:id="${nextId()}" ${DATE}/>`),
        sectionMark("DELSECT_TR10b", `<w:del w:id="${nextId()}" ${DATE}/>`),
    ],
});

/** A move's source or destination around the XML given, between the range marks Word writes around it, named by the move */
const moveRange = (kind: "moveFrom" | "moveTo", move: string, xml: string): string => {
    const range = nextId();
    return `<w:${kind}RangeStart w:id="${range}" ${DATE} w:name="${move}"/>${xml}<w:${kind}RangeEnd w:id="${range}"/>`;
};

// word-stops-moves.docx: a footnote reference moved, and a paragraph moved with its mark, written as Word writes moves: in
// ranges named by the move, the moved reference referring to a footnote of its own at each end
await write({
    name: "word-stops-moves",
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("TR3a", [new Paragraph({ children: [new TextRun("TR3a from"), marker("MOVEFROM_TR3a"), new TextRun(" middle "), marker("MOVETO_TR3a"), new TextRun(" to")] })]),
                ...probe("TR7", [new Paragraph({ children: [marker("MOVEDFROM_TR7")] }), line(`TR7 second ${prose(10)}`), new Paragraph({ children: [marker("MOVEDTO_TR7")] }), line(`TR7 third ${prose(10)}`)]),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        replaceMarkerRun("MOVEFROM_TR3a", moveRange("moveFrom", "probeMove1", `<w:moveFrom w:id="${nextId()}" ${DATE}><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="9102"/></w:r></w:moveFrom>`)),
        replaceMarkerRun("MOVETO_TR3a", moveRange("moveTo", "probeMove1", `<w:moveTo w:id="${nextId()}" ${DATE}><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="9103"/></w:r></w:moveTo>`)),
        addNotes({ 9102: "TR3a moved note", 9103: "TR3a moved note" }),
        // TR7: the first paragraph, its text and its mark, moved to after the second
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const moved = (kind: "moveFrom" | "moveTo"): string =>
                `<w:p><w:pPr><w:rPr><w:${kind} w:id="${nextId()}" ${DATE}/></w:rPr></w:pPr>${moveRange(kind, "probeMove2", `<w:${kind} w:id="${nextId()}" ${DATE}><w:r><w:t xml:space="preserve">TR7 moved ${prose(10)}</w:t></w:r></w:${kind}>`)}</w:p>`;
            const replaced = text
                .replace(/<w:p><w:r><w:t xml:space="preserve">@@MOVEDFROM_TR7@@<\/w:t><\/w:r><\/w:p>/, moved("moveFrom"))
                .replace(/<w:p><w:r><w:t xml:space="preserve">@@MOVEDTO_TR7@@<\/w:t><\/w:r><\/w:p>/, moved("moveTo"));
            if (replaced.includes("@@MOVED")) {
                throw new Error("No marker MOVEDFROM_TR7 or MOVEDTO_TR7");
            }
            parts.set("word/document.xml", replaced);
        },
    ],
});
