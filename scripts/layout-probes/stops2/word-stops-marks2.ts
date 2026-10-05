/**
 * Probes of hidden paragraph marks and tracked changes where docx/layout still stops after `word-stops-hidden.docx`,
 * `-hidden-edges.docx`, `-tracked.docx`, `-tracked-edges.docx` and `-moves.docx` (round 25), for the next batch Word saves.
 *
 * Hidden (word-stops-hidden2.docx, HD):
 * HD11: a hidden mark before a content control's first paragraph, where HD3 showed one at its last joined ("a hidden
 *   paragraph mark at the edge of a content control")
 * HD12: a header of three lines, which pushes the body down, whose last paragraph shows nothing and has its mark hidden,
 *   where HD4a's header was too short to tell whether it takes a line ("a paragraph with nothing shown and its mark hidden
 *   at the end of a header, footer or note")
 * HD13: the document's last footnote ending in a paragraph with nothing shown and its mark hidden, with no note after it,
 *   where HD4b's was joined to the next note's first paragraph (as above)
 * HD14a, HD14b: a hidden section break whose paragraph shows text, before a continuous section otherwise alike (a), and
 *   one whose paragraph shows nothing, before a section on a new page (b) ("a hidden section break")
 * HD15a, HD15b: paragraphs joined by a hidden mark whose styles differ in the size of their text alone (a), and in their
 *   space before alone (b), where HM1g's differed in both ("a hidden paragraph mark between paragraphs of other styles, or
 *   formatted differently otherwise")
 * HD16a to HD16c: paragraphs joined by a hidden mark, the second of exact line spacing of 12 points (a), of at least 20
 *   points (b), and three of single, 1.5 and double spacing (c) ("a hidden paragraph mark between paragraphs of exact or at
 *   least line spacing, or more than two of other line spacing")
 *
 * Tracked changes (word-stops-tracked2.docx, TR), with markup in balloons, as round 25's:
 * TR12: a deleted mark before a content control's first paragraph, where TR8 showed one at its last joined ("a deleted
 *   paragraph mark at the edge of a content control")
 * TR13: a deleted section break of the fourth section, on a new page after the third, before a continuous fifth ("a deleted
 *   section break between sections that start differently, after the first")
 * TR14: a deleted section break before a table ("a deleted section break before something that isn't a paragraph")
 * TR15: a numbered paragraph in a deleted table row, between numbered paragraphs of its list: whether the one after it is
 *   2 or 3 ("a list in a deleted table row")
 * TR16a to TR16c: in a table with borders and space between its cells of 40, its first row deleted (a), its last (b), and a
 *   middle row with borders of 3 points of its own (c) ("a deleted row in a table with borders and space between its cells,
 *   at its top or bottom or with borders of its own")
 * TR17: a deleted endnote reference with a mark of its own, before a kept endnote ("an endnote with a mark of its own")
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-marks2.ts [folder]
 */
import { EndnoteReferenceRun, Header, LevelFormat, Paragraph, SectionType, Table, TableRow, TextRun, WidthType } from "docx";

import { ALL_BORDERS, PAGE, cell, footnote, injectIntoParagraph, line, marker, probe, prose, replaceMarkerRun, write } from "./kit";

const DATE = 'w:author="probe" w:date="2026-10-04T00:00:00Z"';
const HIDDEN_MARK = { rPr: "<w:vanish/>" };
let changeId = 9200;
const nextId = (): number => ++changeId;

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
        notes.replace(/<w:footnote w:id="(\d+)">.*?<\/w:footnote>/gs, (note, id: string) => (referenced.has(id) ? note : "")),
    );
};

/** Where text is in a part: an error where it isn't, which `write` skips when ONLY leaves its probe out */
const markerAt = (text: string, find: string): number => {
    const at = text.indexOf(find);
    if (at < 0) {
        throw new Error(`No marker ${find}`);
    }
    return at;
};

/** A section break's mark: docx writes the section's properties in an empty paragraph after its marker's */
const sectionMark =
    (name: string, mark: string, keepText = false) =>
    (parts: Map<string, string>): void => {
        let text = parts.get("word/document.xml")!;
        const at = markerAt(text, `@@${name}@@`);
        const start = text.lastIndexOf("<w:p>", at);
        const end = text.indexOf("</w:p>", at) + 6;
        // With its text, the marker's paragraph's runs go into the paragraph that ends the section
        const runs = keepText ? [...text.slice(start, end).matchAll(/<w:r>(?:(?!@@).)*?<\/w:r>/g)].map(([run]) => run).join("") : "";
        text = text.slice(0, start) + text.slice(end);
        const sectPr = text.indexOf("<w:sectPr", start);
        const close = text.indexOf("</w:pPr>", sectPr) + "</w:pPr>".length;
        text = `${text.slice(0, sectPr)}<w:rPr>${mark}</w:rPr>${text.slice(sectPr, close)}${runs}${text.slice(close)}`;
        parts.set("word/document.xml", text);
    };

/** A paragraph in a content control, after the paragraph of a marker, whose mark is hidden or deleted */
const controlAfter =
    (name: string, id: number) =>
    (parts: Map<string, string>): void => {
        const text = parts.get("word/document.xml")!;
        const at = markerAt(text, `@@${name}@@`);
        const start = text.lastIndexOf("<w:p>", at);
        const end = text.indexOf("</w:p>", at) + 6;
        const probeName = name.split("_")[1];
        const sdt = `<w:sdt><w:sdtPr><w:alias w:val="${probeName}"/><w:id w:val="${id}"/></w:sdtPr><w:sdtContent><w:p><w:r><w:t>${probeName} in the control</w:t></w:r></w:p></w:sdtContent></w:sdt>`;
        parts.set("word/document.xml", text.slice(0, start) + sdt + text.slice(end));
    };

/** Deletes the rows whose text is given, with w:del in their properties */
const deletedRows =
    (...names: readonly string[]) =>
    (parts: Map<string, string>): void => {
        let text = parts.get("word/document.xml")!;
        for (const name of names) {
            const at = markerAt(text, name);
            const row = text.lastIndexOf("<w:tr>", at);
            const properties = text.indexOf("<w:trPr>", row);
            const firstCell = text.indexOf("<w:tc>", row);
            text =
                properties >= 0 && properties < firstCell
                    ? text.slice(0, properties + 8) + `<w:del w:id="${nextId()}" ${DATE}/>` + text.slice(properties + 8)
                    : text.slice(0, row + 6) + `<w:trPr><w:del w:id="${nextId()}" ${DATE}/></w:trPr>` + text.slice(row + 6);
        }
        parts.set("word/document.xml", text);
    };

const STYLES = {
    paragraphStyles: [
        { id: "ProbeLarge", name: "Probe Large", run: { size: 32 } },
        { id: "ProbeSpaced", name: "Probe Spaced", paragraph: { spacing: { before: 240 } } },
    ],
};

const joined = (name: string, first: object, second: object, inject = `HID_${name}`): Paragraph[] => [
    new Paragraph({ ...first, children: [new TextRun(`${name} first ${prose(20)}`), marker(inject)] }),
    new Paragraph({ ...second, children: [new TextRun(`${name} second ${prose(30)}`)] }),
];

// word-stops-hidden2.docx
await write({
    name: "word-stops-hidden2",
    options: { styles: STYLES } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("HD11", [
                    new Paragraph({ children: [new TextRun("HD11 before"), marker("HID_HD11")] }),
                    new Paragraph({ children: [marker("SDT_HD11")] }),
                ]),
                ...probe("HD13", [
                    new Paragraph({
                        children: [
                            new TextRun("HD13 reference"),
                            footnote(line("HD13 note"), new Paragraph({ children: [marker("HID_HD13")] })),
                        ],
                    }),
                ]),
                ...probe(
                    "HD14a",
                    [line("HD14a first section"), new Paragraph({ children: [new TextRun("HD14a shown"), marker("HIDSECT_HD14a")] })],
                    {
                        below: false,
                    },
                ),
            ],
        },
        { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: [line("HD14a second section"), line("HD14a below")] },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [
                ...probe("HD14b", [line("HD14b first section"), new Paragraph({ children: [marker("HIDSECT_HD14b")] })], { below: false }),
            ],
        },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [
                line("HD14b second section"),
                line("HD14b below"),
                ...probe("HD15a", joined("HD15a", { style: "ProbeLarge" }, {})),
                ...probe("HD15b", joined("HD15b", { style: "ProbeSpaced" }, {})),
                ...probe("HD16a", joined("HD16a", {}, { spacing: { line: 240, lineRule: "exact" } })),
                ...probe("HD16b", joined("HD16b", {}, { spacing: { line: 400, lineRule: "atLeast" } })),
                ...probe("HD16c", [
                    new Paragraph({ children: [new TextRun(`HD16c first ${prose(20)}`), marker("HID_HD16c")] }),
                    new Paragraph({
                        spacing: { line: 360 },
                        children: [new TextRun(`HD16c second ${prose(30)}`), marker("HID_HD16c2")],
                    }),
                    new Paragraph({ spacing: { line: 480 }, children: [new TextRun(`HD16c third ${prose(30)}`)] }),
                ]),
            ],
        },
        // HD12: the header's last paragraph shows nothing and its mark is hidden, in a section of its own
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            headers: {
                default: new Header({
                    children: [
                        line("HD12 header 1"),
                        line("HD12 header 2"),
                        line("HD12 header 3"),
                        new Paragraph({ children: [marker("HID_HD12")] }),
                    ],
                }),
            },
            children: [...probe("HD12", [line(`HD12 ${prose(30)}`)])],
        },
    ],
    injections: [
        onlyReferencedNotes,
        injectIntoParagraph("HID_HD13", HIDDEN_MARK, "word/footnotes.xml"),
        (parts) => {
            const header = [...parts.keys()].find(
                (path) => /word\/header\d*\.xml$/.test(path) && parts.get(path)!.includes("@@HID_HD12@@"),
            )!;
            injectIntoParagraph("HID_HD12", HIDDEN_MARK, header)(parts);
        },
        sectionMark("HIDSECT_HD14a", "<w:vanish/>", true),
        sectionMark("HIDSECT_HD14b", "<w:vanish/>"),
        controlAfter("SDT_HD11", 911),
        ...["HD11", "HD15a", "HD15b", "HD16a", "HD16b", "HD16c", "HD16c2"].map((name) => injectIntoParagraph(`HID_${name}`, HIDDEN_MARK)),
    ],
});

const NUMBERS = {
    config: [
        {
            reference: "numbers",
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
    ],
};
const spacedTable = (name: string, rows: number, deleted: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        borders: ALL_BORDERS,
        cellSpacing: { value: 40, type: WidthType.DXA },
        rows: Array.from(
            { length: rows },
            (_, index) => new TableRow({ children: [cell(`${name} row ${index + 1}${index + 1 === deleted ? " deleted" : ""}`)] }),
        ),
    });

// word-stops-tracked2.docx
await write({
    name: "word-stops-tracked2",
    options: {
        numbering: NUMBERS,
        endnotes: { 1: { children: [line("TR17 deleted note")] }, 2: { children: [line("TR17 kept note")] } },
    } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("TR12", [
                    new Paragraph({ children: [new TextRun("TR12 before"), marker("DEL_TR12")] }),
                    new Paragraph({ children: [marker("SDT_TR12")] }),
                ]),
                ...probe("TR15", [
                    new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("TR15 before")] }),
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        rows: [
                            new TableRow({ children: [cell("TR15 kept row")] }),
                            new TableRow({
                                children: [
                                    cell([
                                        new Paragraph({
                                            numbering: { reference: "numbers", level: 0 },
                                            children: [new TextRun("TR15 deleted row")],
                                        }),
                                    ]),
                                ],
                            }),
                        ],
                    }),
                    new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("TR15 after")] }),
                ]),
                ...probe("TR16a", [spacedTable("TR16a", 3, 1)]),
                ...probe("TR16b", [spacedTable("TR16b", 3, 3)]),
                ...probe("TR16c", [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [9026],
                        borders: ALL_BORDERS,
                        cellSpacing: { value: 40, type: WidthType.DXA },
                        rows: [1, 2, 3].map(
                            (row) =>
                                new TableRow({
                                    children: [
                                        cell(
                                            `TR16c row ${row}${row === 2 ? " deleted" : ""}`,
                                            row === 2
                                                ? {
                                                      borders: {
                                                          top: { style: "single", size: 24, color: "000000" },
                                                          bottom: { style: "single", size: 24, color: "000000" },
                                                      },
                                                  }
                                                : {},
                                        ),
                                    ],
                                }),
                        ),
                    }),
                ]),
                ...probe("TR17", [
                    new Paragraph({
                        children: [
                            new TextRun("TR17 deleted endnote"),
                            marker("DELEND_TR17"),
                            new TextRun(" and kept"),
                            new EndnoteReferenceRun(2),
                        ],
                    }),
                ]),
                ...probe("TR14", [line("TR14 first section"), new Paragraph({ children: [marker("DELSECT_TR14")] })], { below: false }),
            ],
        },
        {
            properties: { ...PAGE, type: SectionType.CONTINUOUS },
            children: [new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell("TR14 table")] })] }), line("TR14 below")],
        },
        // TR13: the fourth section, on a new page after the third, whose break is deleted, before a continuous fifth
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [...probe("TR13", [line("TR13 third section")], { below: false })],
        },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [line("TR13 fourth section"), new Paragraph({ children: [marker("DELSECT_TR13")] })],
        },
        { properties: { ...PAGE, type: SectionType.CONTINUOUS }, children: [line("TR13 fifth section"), line("TR13 below")] },
    ],
    injections: [
        onlyReferencedNotes,
        injectIntoParagraph("DEL_TR12", { rPr: `<w:del w:id="${nextId()}" ${DATE}/>` }),
        controlAfter("SDT_TR12", 912),
        replaceMarkerRun(
            "DELEND_TR17",
            `<w:del w:id="${nextId()}" ${DATE}><w:r><w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr><w:endnoteReference w:customMarkFollows="1" w:id="1"/></w:r><w:r><w:delText>*</w:delText></w:r></w:del>`,
        ),
        sectionMark("DELSECT_TR13", `<w:del w:id="${nextId()}" ${DATE}/>`),
        sectionMark("DELSECT_TR14", `<w:del w:id="${nextId()}" ${DATE}/>`),
        deletedRows("TR15 deleted row", "TR16a row 1 deleted", "TR16b row 3 deleted", "TR16c row 2 deleted"),
    ],
});
