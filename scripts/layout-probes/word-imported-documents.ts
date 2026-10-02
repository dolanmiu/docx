/**
 * Probes of what Word does with an imported document (`w:altChunk`): a part of the package in another format, which Word
 * converts into the document's own paragraphs and tables when it opens it. Each line's text names its probe, as in
 * `word-watertight-markup.docx`, and lines above and below each probe mark it off. Calibri 11 on A4 with 1440 margins,
 * single spaced, no space before or after, in the main document and, unless a probe says otherwise, in the imported ones.
 * word-imported-documents.py reads Word's PDFs of them.
 *
 * `word-imported-documents.docx` imports .docx parts into the body:
 *
 * AC1: where an imported document's paragraphs go: three paragraphs between a line above and a line below (AC1a), and two
 *      imported documents one after the other (AC1b)
 * AC2: imported documents with nothing to lay out: one empty paragraph (AC2a), no paragraphs at all (AC2b), and one that
 *      ends with a table (AC2c)
 * AC3: whose formatting imported paragraphs take, where the imported document's differs from the main document's, each
 *      line ending in m's to measure its font by: defaults of Times New Roman 14 with 240 after (AC3a), a Normal style of
 *      the same (AC3b), a style of the same id and name, 24 points in Times New Roman against 16 in Calibri (AC3c), a
 *      style only the imported document has, based on its Normal of Times New Roman 14 (AC3d), styles of the same name and
 *      different ids (AC3e), of the same id and different names (AC3f), AC3a and AC3c with "keep source formatting"
 *      (`w:matchSrc`, AC3g), text in the theme's body font, Cambria in the imported document's theme (AC3h), a table in
 *      the imported document's Normal Table, of no cell margins (AC3i), and Heading 1 named "heading 1", as Word names it,
 *      against "Heading 1", as docx names it (AC3k)
 * AC4: the sections of an imported document: one section, landscape with 2880 margins and a header of its own, in a
 *      section with a header (AC4a), and two sections, with margins and headers of their own (AC4b)
 * AC5: a numbered list in an imported document, between items of a numbered list of the main document, both numbered by
 *      the same number (`w:numId`) in their own documents
 * AC6: a footnote in an imported document, between two in the main document, all three of the same id in their documents
 * AC7: an imported document in a table cell
 * AC13: an imported paragraph kept with the next at the foot of a page, before a main document's paragraph
 * AC16: a tab in an imported paragraph, where the imported document's default tab stops are 2160 apart and the main
 *       document's 720
 *
 * `word-imported-text.docx` imports a plain text part (AC8): lines, an empty line, a tab and a line longer than the page.
 *
 * `word-imported-ends.docx` imports a .docx at the start of the body (AC10a), with left and right margins of 2880, and
 * another at its end (AC10b), landscape with a header of its own: whether the main document's last section takes its
 * properties.
 *
 * `word-imported-parts.docx` imports a .docx into a header (AC9a) and into a footnote (AC9b), and a .docx that imports
 * another into the body (AC12).
 *
 * `word-imported-bookmarks.docx` has a bookmark in an imported document of the same name as one in the main document
 * before it (AC11a) and after it (AC11b), and one of a name of its own (AC11c), each on a page of its own, and a page
 * reference to each. Word updates the page references when it opens it (`updateFields`), so they say which bookmark
 * Word kept.
 *
 * `word-imported-styles.docx`, saved from Word after the others, settles how Word keeps the look of styles only an
 * imported document has, and what "keep source formatting" keeps. In AS1 to AS4 the imported documents' defaults are
 * Times New Roman 14 with 240 after, where the main document's are Calibri 11 with none:
 *
 * AS1: a style only the imported document has, based on its Normal, which gives nothing of its own, with 480 before
 * AS2: a style only the imported document has, based on no style, with 480 before
 * AS3: a character style only the imported document has, of bold, on a run of a Normal paragraph
 * AS4: a style only the imported document has, based on one both have, 24 points in Times New Roman in the imported
 *      document and 16 in Calibri in the main, with 480 before
 * AS5: paragraphs of no style, where the imported document's default style isn't named Normal, and is Times New Roman 14
 * AS6: a table in a table style only the imported document has, based on its Normal Table, of no cell margins, against
 *      the main document's of 108
 * AS7 to AS9: "keep source formatting" (`w:matchSrc`): a table in the imported
 *      document's Normal Table, of no cell margins (AS7), text in the theme's body font, Cambria in the imported
 *      document's theme (AS8), and a Normal style of Times New Roman 14 with 240 after (AS9)
 *
 * docx can't write `w:altChunk`, so it writes a paragraph of a marker that this script replaces in the XML, and adds the
 * imported part, its relationship and its content type to the package: see `importInto`.
 */
// cspell:ignore afchunk
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    Bookmark,
    Document,
    FootnoteReferenceRun,
    Header,
    type ISectionOptions,
    LevelFormat,
    PageOrientation,
    PageReference,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type DocumentOptions = ConstructorParameters<typeof Document>[0];
type Block = Paragraph | Table;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");
// Ten m's end each line whose font is in question: 88 points wide in Calibri 11, 109 in Times New Roman 14
const RULER = "mmmmmmmmmm";

/** The marker of a paragraph this script replaces with an imported document */
const marker = (name: string): Paragraph => line(`@@IMPORT ${name}@@`);

/** A probe between a line above and a line below */
const probe = (name: string, ...children: Block[]): Block[] => [line(`${name} above`), ...children, line(`${name} below`)];

// The main document's formatting, and the imported documents' unless a probe says otherwise
const STYLES: DocumentOptions["styles"] = {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
};
// Times New Roman 14 with 240 after, the formatting imported documents give in AC3
const TIMES = { run: { font: "Times New Roman", size: 28 }, paragraph: { spacing: { before: 0, after: 240, line: 240 } } };

/** An imported document, and how it is imported */
type Imported = {
    readonly name: string;
    /** The part's bytes */
    readonly data: Uint8Array;
    /** Its content type, which says what format it is in */
    readonly contentType: string;
    readonly extension: string;
    /** Whether to keep its formatting (`w:matchSrc`) */
    readonly matchSource?: boolean;
};

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";

/** The XML of a package's part, changed */
const edit = async (zip: JSZip, part: string, change: (xml: string) => string): Promise<void> => {
    const xml = await zip.file(part)!.async("string");
    const changed = change(xml);
    if (changed === xml) {
        throw new Error(`Nothing changed in ${part}`);
    }
    zip.file(part, changed);
};

/** A document, packed, with changes to the XML of its parts */
const pack = async (doc: Document, changes: Readonly<Record<string, (xml: string) => string>> = {}): Promise<JSZip> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    for (const [part, change] of Object.entries(changes)) {
        await edit(zip, part, change);
    }
    return zip;
};

/** A .docx to import, of these sections and options, with changes to the XML of its parts */
const importedDocx = async (
    name: string,
    options: Omit<DocumentOptions, "sections"> & { readonly sections: readonly ISectionOptions[] },
    changes: Readonly<Record<string, (xml: string) => string>> = {},
    matchSource = false,
): Promise<Imported> => {
    const zip = await pack(new Document({ styles: STYLES, ...options, sections: [...options.sections] }), changes);
    return {
        name,
        data: await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }),
        contentType: DOCX,
        extension: "docx",
        matchSource,
    };
};

/** A style's element in a styles part, by its id */
const styleElement = (id: string): RegExp => new RegExp(`<w:style [^>]*w:styleId="${id}"[^>]*>.*?</w:style>`);

/**
 * Replaces the marker of each imported document in a part with `w:altChunk`, and adds the imported part, the part's
 * relationship to it and its content type to the package.
 */
const importInto = async (zip: JSZip, part: string, imported: readonly Imported[]): Promise<void> => {
    const folder = part.slice(0, part.lastIndexOf("/") + 1);
    const relationshipsPath = `${folder}_rels/${part.slice(folder.length)}.rels`;
    for (const { name, data, contentType, extension, matchSource } of imported) {
        const id = `rIdImport${name}`;
        const target = `afchunk-${name}.${extension}`;
        const properties = matchSource ? "<w:altChunkPr><w:matchSrc/></w:altChunkPr>" : "";
        await edit(zip, part, (xml) =>
            xml.replace(
                new RegExp(`<w:p>(?:(?!<w:p>).)*?@@IMPORT ${name}@@(?:(?!<w:p>).)*?</w:p>`),
                `<w:altChunk r:id="${id}">${properties}</w:altChunk>`,
            ),
        );
        const relationship = `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="${target}"/>`;
        // docx writes a part's relationships as an empty element when it has none
        await edit(zip, relationshipsPath, (xml) =>
            xml
                .replace(/<Relationships ([^>]*?)\/>/, "<Relationships $1></Relationships>")
                .replace("</Relationships>", `${relationship}</Relationships>`),
        );
        await edit(zip, "[Content_Types].xml", (xml) =>
            xml.replace("</Types>", `<Override ContentType="${contentType}" PartName="/${folder}${target}"/></Types>`),
        );
        zip.file(`${folder}${target}`, data);
    }
};

const write = async (name: string, zip: JSZip): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

// A table of one cell 9026 wide
const cellTable = (...children: Block[]): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children })] })],
    });

const numbered = (reference: string, text: string): Paragraph =>
    new Paragraph({ numbering: { reference, level: 0 }, children: [new TextRun(text)] });

const decimalList = (reference: string, text: string): NonNullable<DocumentOptions["numbering"]> => ({
    config: [
        {
            reference,
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
    ],
});

const LANDSCAPE = { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 2880, right: 2880, bottom: 2880, left: 2880 } };

const importedDocuments = async (): Promise<void> => {
    const imported = await Promise.all([
        importedDocx("AC1a", { sections: [{ children: [line("AC1a imported 1"), line("AC1a imported 2"), line("AC1a imported 3")] }] }),
        importedDocx("AC1b1", { sections: [{ children: [line("AC1b first imported")] }] }),
        importedDocx("AC1b2", { sections: [{ children: [line("AC1b second imported")] }] }),
        importedDocx("AC2a", { sections: [{ children: [new Paragraph({})] }] }),
        importedDocx("AC2b", { sections: [{ children: [] }] }),
        importedDocx("AC2c", { sections: [{ children: [cellTable(line("AC2c imported cell"))] }] }),
        // AC3a: the imported document's defaults are Times New Roman 14 with 240 after
        importedDocx("AC3a", {
            styles: { default: { document: TIMES } },
            sections: [{ children: [line(`AC3a imported one ${RULER}`), line(`AC3a imported two ${RULER}`)] }],
        }),
        // AC3b: its Normal style is
        importedDocx(
            "AC3b",
            { sections: [{ children: [line(`AC3b imported one ${RULER}`), line(`AC3b imported two ${RULER}`)] }] },
            {
                "word/styles.xml": (xml) =>
                    xml.replace(
                        styleElement("Normal"),
                        '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>',
                    ),
            },
        ),
        // AC3c: a style of the same id and name in both, 24 points in Times New Roman here and 16 in Calibri in the main
        importedDocx("AC3c", {
            styles: {
                ...STYLES,
                paragraphStyles: [{ id: "ProbeShared", name: "Probe Shared", run: { font: "Times New Roman", size: 48 } }],
            },
            sections: [{ children: [line(`AC3c imported ${RULER}`, { style: "ProbeShared" })] }],
        }),
        // AC3d: a style only here, based on Normal, which is Times New Roman 14 here, with only 480 before of its own
        importedDocx(
            "AC3d",
            {
                styles: {
                    ...STYLES,
                    paragraphStyles: [
                        { id: "ProbeImported", name: "Probe Imported", basedOn: "Normal", paragraph: { spacing: { before: 480 } } },
                    ],
                },
                sections: [{ children: [line(`AC3d imported ${RULER}`, { style: "ProbeImported" })] }],
            },
            {
                "word/styles.xml": (xml) =>
                    xml.replace(
                        styleElement("Normal"),
                        '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>',
                    ),
            },
        ),
        // AC3e: "Probe Name" is ProbeNameB here, 24 points in Times New Roman, and ProbeNameA in the main, 16 in Calibri
        importedDocx("AC3e", {
            styles: { ...STYLES, paragraphStyles: [{ id: "ProbeNameB", name: "Probe Name", run: { font: "Times New Roman", size: 48 } }] },
            sections: [{ children: [line(`AC3e imported ${RULER}`, { style: "ProbeNameB" })] }],
        }),
        // AC3f: ProbeId is "Probe Id Imported" here, 24 points in Times New Roman, and "Probe Id Main" in the main
        importedDocx("AC3f", {
            styles: {
                ...STYLES,
                paragraphStyles: [{ id: "ProbeId", name: "Probe Id Imported", run: { font: "Times New Roman", size: 48 } }],
            },
            sections: [{ children: [line(`AC3f imported ${RULER}`, { style: "ProbeId" })] }],
        }),
        // AC3g: AC3a's defaults and AC3c's style, kept as they are here
        importedDocx(
            "AC3g",
            {
                styles: {
                    default: { document: TIMES },
                    paragraphStyles: [{ id: "ProbeShared", name: "Probe Shared", run: { font: "Times New Roman", size: 48 } }],
                },
                sections: [
                    { children: [line(`AC3g imported one ${RULER}`), line(`AC3g imported shared ${RULER}`, { style: "ProbeShared" })] },
                ],
            },
            {},
            true,
        ),
        // AC3h: text in the theme's body font, which is Cambria here and Calibri in the main
        importedDocx("AC3h", {
            theme: { fonts: { body: "Cambria" } },
            sections: [
                { children: [new Paragraph({ children: [new TextRun({ text: `AC3h imported ${RULER}`, font: { theme: "body" } })] })] },
            ],
        }),
        // AC3i: a table in the Normal Table style, whose cells have no margins here and 108 in the main
        importedDocx(
            "AC3i",
            { sections: [{ children: [cellTable(line("AC3i imported cell"))] }] },
            { "word/styles.xml": (xml) => xml.replace(/(w:styleId="TableNormal".*?)w:w="108"(.*?)w:w="108"/, '$1w:w="0"$2w:w="0"') },
        ),
        // AC3k: Heading 1 named as Word names it, 24 points in Times New Roman, and as docx names it in the main
        importedDocx(
            "AC3k",
            {
                styles: { ...STYLES, default: { ...STYLES!.default, heading1: { run: { font: "Times New Roman", size: 48 } } } },
                sections: [{ children: [line(`AC3k imported ${RULER}`, { style: "Heading1" })] }],
            },
            { "word/styles.xml": (xml) => xml.replace('<w:name w:val="Heading 1"/>', '<w:name w:val="heading 1"/>') },
        ),
        // AC4a: one section, landscape with 2880 margins, with a header of its own
        importedDocx("AC4a", {
            sections: [
                {
                    properties: { page: LANDSCAPE },
                    headers: { default: new Header({ children: [line("AC4a imported header")] }) },
                    children: [line(`AC4a imported ${prose(60)}`)],
                },
            ],
        }),
        // AC4b: two sections, with left and right margins of 2880 and then of 2160, each with a header of its own
        importedDocx("AC4b", {
            sections: [
                {
                    properties: { page: { margin: { left: 2880, right: 2880 } } },
                    headers: { default: new Header({ children: [line("AC4b imported header one")] }) },
                    children: [line(`AC4b imported first ${prose(60)}`)],
                },
                {
                    properties: { page: { margin: { left: 2160, right: 2160 } } },
                    headers: { default: new Header({ children: [line("AC4b imported header two")] }) },
                    children: [line(`AC4b imported second ${prose(60)}`)],
                },
            ],
        }),
        // AC5: a list numbered (1), (2), with the same w:numId as the main document's list numbered 1., 2.
        importedDocx("AC5", {
            numbering: decimalList("imported", "(%1)"),
            sections: [{ children: [numbered("imported", "AC5 imported 1"), numbered("imported", "AC5 imported 2")] }],
        }),
        // AC6: a footnote with the same id as the main document's first
        importedDocx("AC6", {
            footnotes: { 1: { children: [line("AC6 imported note")] } },
            sections: [{ children: [new Paragraph({ children: [new TextRun("AC6 imported"), new FootnoteReferenceRun(1)] })] }],
        }),
        importedDocx("AC7", { sections: [{ children: [line("AC7 imported 1"), line("AC7 imported 2")] }] }),
        // AC13: kept with the next
        importedDocx("AC13", { sections: [{ children: [line("AC13 imported kept with the next", { keepNext: true })] }] }),
        // AC16: default tab stops 2160 apart
        importedDocx("AC16", { defaultTabStop: 2160, sections: [{ children: [line("AC16\timported")] }] }),
    ]);

    const sections: ISectionOptions[] = [
        { children: [...probe("AC1a", marker("AC1a")), ...probe("AC1b", marker("AC1b1"), marker("AC1b2"))] },
        { children: [...probe("AC2a", marker("AC2a")), ...probe("AC2b", marker("AC2b")), ...probe("AC2c", marker("AC2c"))] },
        {
            children: [
                ...probe("AC3a", marker("AC3a")),
                ...probe("AC3b", marker("AC3b")),
                ...probe("AC3c", marker("AC3c"), line(`AC3c main ${RULER}`, { style: "ProbeShared" })),
                ...probe("AC3d", marker("AC3d")),
                ...probe("AC3e", marker("AC3e"), line(`AC3e main ${RULER}`, { style: "ProbeNameA" })),
                ...probe("AC3f", marker("AC3f"), line(`AC3f main ${RULER}`, { style: "ProbeId" })),
            ],
        },
        {
            children: [
                ...probe("AC3g", marker("AC3g")),
                ...probe(
                    "AC3h",
                    marker("AC3h"),
                    new Paragraph({ children: [new TextRun({ text: `AC3h main ${RULER}`, font: { theme: "body" } })] }),
                ),
                ...probe("AC3i", marker("AC3i"), cellTable(line("AC3i main cell"))),
                ...probe("AC3k", marker("AC3k"), line(`AC3k main ${RULER}`, { style: "Heading1" })),
            ],
        },
        {
            headers: { default: new Header({ children: [line("AC4a main header")] }) },
            children: probe("AC4a", marker("AC4a"), line(`AC4a main ${prose(60)}`)),
        },
        {
            headers: { default: new Header({ children: [line("AC4b main header")] }) },
            children: probe("AC4b", marker("AC4b"), line(`AC4b main ${prose(60)}`)),
        },
        // An empty header, so the pages after AC4b don't show its header
        {
            headers: { default: new Header({ children: [] }) },
            children: probe(
                "AC5",
                numbered("main", "AC5 main 1"),
                numbered("main", "AC5 main 2"),
                marker("AC5"),
                numbered("main", "AC5 main 3"),
            ),
        },
        {
            children: probe(
                "AC6",
                new Paragraph({ children: [new TextRun("AC6 main one"), new FootnoteReferenceRun(1)] }),
                marker("AC6"),
                new Paragraph({ children: [new TextRun("AC6 main two"), new FootnoteReferenceRun(2)] }),
            ),
        },
        { children: probe("AC7", cellTable(line("AC7 cell above"), marker("AC7"), line("AC7 cell below"))) },
        // AC13: 50 lines, so the imported paragraph is the page's last line, and the main document's next goes to the next
        {
            children: [...Array.from({ length: 50 }, (_, i) => line(`AC13 fill ${i + 1}`)), marker("AC13"), line("AC13 below")],
        },
        { children: probe("AC16", marker("AC16"), line("AC16\tmain")) },
    ];

    const zip = await pack(
        new Document({
            styles: {
                ...STYLES,
                default: { ...STYLES!.default, heading1: { run: { font: "Calibri", size: 32 } } },
                paragraphStyles: [
                    { id: "ProbeShared", name: "Probe Shared", run: { size: 32 } },
                    { id: "ProbeNameA", name: "Probe Name", run: { size: 32 } },
                    { id: "ProbeId", name: "Probe Id Main", run: { size: 32 } },
                ],
            },
            defaultTabStop: 720,
            numbering: decimalList("main", "%1."),
            footnotes: { 1: { children: [line("AC6 main note one")] }, 2: { children: [line("AC6 main note two")] } },
            sections,
        }),
    );
    await importInto(zip, "word/document.xml", imported);
    await write("word-imported-documents", zip);
};

const importedText = async (): Promise<void> => {
    const text = [
        "AC8 text one",
        "AC8 text two",
        "",
        "AC8 text four\twith a tab",
        `AC8 text five ${prose(40)}`,
        `AC8 text six ${RULER}`,
    ].join("\r\n");
    const zip = await pack(new Document({ styles: STYLES, sections: [{ children: probe("AC8", marker("AC8")) }] }));
    await importInto(zip, "word/document.xml", [
        { name: "AC8", data: new TextEncoder().encode(`${text}\r\n`), contentType: "text/plain", extension: "txt" },
    ]);
    await write("word-imported-text", zip);
};

const importedEnds = async (): Promise<void> => {
    const imported = await Promise.all([
        importedDocx("AC10a", {
            sections: [
                { properties: { page: { margin: { left: 2880, right: 2880 } } }, children: [line(`AC10a imported first ${prose(60)}`)] },
            ],
        }),
        importedDocx("AC10b", {
            sections: [
                {
                    properties: { page: LANDSCAPE },
                    headers: { default: new Header({ children: [line("AC10b imported header")] }) },
                    children: [line(`AC10b imported last ${prose(60)}`)],
                },
            ],
        }),
    ]);
    const zip = await pack(
        new Document({
            styles: STYLES,
            sections: [
                {
                    headers: { default: new Header({ children: [line("AC10 main header")] }) },
                    children: [marker("AC10a"), line(`AC10 main ${prose(60)}`), marker("AC10b")],
                },
            ],
        }),
    );
    await importInto(zip, "word/document.xml", imported);
    await write("word-imported-ends", zip);
};

const importedParts = async (): Promise<void> => {
    const [header, note, inner] = await Promise.all([
        importedDocx("AC9a", { sections: [{ children: [line("AC9a header imported")] }] }),
        importedDocx("AC9b", { sections: [{ children: [line("AC9b note imported")] }] }),
        importedDocx("AC12inner", { sections: [{ children: [line("AC12 inner imported")] }] }),
    ]);
    // AC12: an imported document that imports another
    const outer = await pack(
        new Document({
            styles: STYLES,
            sections: [{ children: [line("AC12 outer above"), marker("AC12inner"), line("AC12 outer below")] }],
        }),
    );
    await importInto(outer, "word/document.xml", [inner]);
    const nested: Imported = {
        name: "AC12outer",
        data: await outer.generateAsync({ type: "uint8array", compression: "DEFLATE" }),
        contentType: DOCX,
        extension: "docx",
    };
    const zip = await pack(
        new Document({
            styles: STYLES,
            footnotes: { 1: { children: [line("AC9b note above"), marker("AC9b"), line("AC9b note below")] } },
            sections: [
                {
                    headers: { default: new Header({ children: [line("AC9a header above"), marker("AC9a"), line("AC9a header below")] }) },
                    children: [
                        new Paragraph({ children: [new TextRun("AC9 body"), new FootnoteReferenceRun(1)] }),
                        ...probe("AC12", marker("AC12outer")),
                    ],
                },
            ],
        }),
    );
    await importInto(zip, "word/header1.xml", [header]);
    await importInto(zip, "word/footnotes.xml", [note]);
    await importInto(zip, "word/document.xml", [nested]);
    await write("word-imported-parts", zip);
};

const marked = (name: string, text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, children: [new Bookmark({ id: name, children: [new TextRun(text)] })] });
const reference = (name: string): Paragraph =>
    new Paragraph({ children: [new TextRun(`AC11 page of ${name}: `), new PageReference(name)] });

const importedBookmarks = async (): Promise<void> => {
    const imported = await importedDocx("AC11", {
        sections: [
            {
                children: [
                    marked("ProbeBefore", "AC11a imported marked", { pageBreakBefore: true }),
                    marked("ProbeAfter", "AC11b imported marked"),
                    marked("ProbeImported", "AC11c imported marked"),
                ],
            },
        ],
    });
    const zip = await pack(
        new Document({
            styles: STYLES,
            features: { updateFields: true },
            sections: [
                {
                    children: [
                        // Page 1, and the imported document's bookmarks on page 2
                        marked("ProbeBefore", "AC11a main marked"),
                        marker("AC11"),
                        // Page 3
                        marked("ProbeAfter", "AC11b main marked", { pageBreakBefore: true }),
                        // Page 4
                        new Paragraph({ pageBreakBefore: true, children: [new TextRun("AC11 references")] }),
                        reference("ProbeBefore"),
                        reference("ProbeAfter"),
                        reference("ProbeImported"),
                    ],
                },
            ],
        }),
    );
    await importInto(zip, "word/document.xml", [imported]);
    await write("word-imported-bookmarks", zip);
};

// The XML of the Normal style, with formatting of its own
const NORMAL_TIMES =
    '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>';

const importedStyles = async (): Promise<void> => {
    // The imported documents' defaults in AS1 to AS4
    const defaults = { default: { document: TIMES } };
    const imported = await Promise.all([
        importedDocx("AS1", {
            styles: {
                ...defaults,
                paragraphStyles: [
                    { id: "ProbeImported", name: "Probe Imported", basedOn: "Normal", paragraph: { spacing: { before: 480 } } },
                ],
            },
            sections: [{ children: [line(`AS1 imported ${RULER}`, { style: "ProbeImported" })] }],
        }),
        // docx bases a style on no other when it isn't given one
        importedDocx("AS2", {
            styles: { ...defaults, paragraphStyles: [{ id: "ProbeAlone", name: "Probe Alone", paragraph: { spacing: { before: 480 } } }] },
            sections: [{ children: [line(`AS2 imported ${RULER}`, { style: "ProbeAlone" })] }],
        }),
        importedDocx("AS3", {
            styles: { ...defaults, characterStyles: [{ id: "ProbeBold", name: "Probe Bold", run: { bold: true } }] },
            sections: [{ children: [new Paragraph({ children: [new TextRun({ text: `AS3 imported ${RULER}`, style: "ProbeBold" })] })] }],
        }),
        importedDocx("AS4", {
            styles: {
                ...defaults,
                paragraphStyles: [
                    { id: "ProbeShared", name: "Probe Shared", run: { font: "Times New Roman", size: 48 } },
                    { id: "ProbeChild", name: "Probe Child", basedOn: "ProbeShared", paragraph: { spacing: { before: 480 } } },
                ],
            },
            sections: [{ children: [line(`AS4 imported ${RULER}`, { style: "ProbeChild" })] }],
        }),
        // AS5: Normal renamed Body Default, with Times New Roman 14, and the styles based on it on it
        importedDocx(
            "AS5",
            { sections: [{ children: [line(`AS5 imported one ${RULER}`), line(`AS5 imported two ${RULER}`)] }] },
            {
                "word/styles.xml": (xml) =>
                    xml
                        .replace(
                            styleElement("Normal"),
                            NORMAL_TIMES.replace('<w:spacing w:after="240"/>', "").replace('w:val="Normal"', 'w:val="Body Default"'),
                        )
                        .replace(/w:styleId="Normal"/, 'w:styleId="BodyDefault"')
                        .replace(/<w:(basedOn|next) w:val="Normal"\/>/g, '<w:$1 w:val="BodyDefault"/>'),
            },
        ),
        // AS6: a table style based on Normal Table, whose cells have no margins in the imported document
        importedDocx(
            "AS6",
            { sections: [{ children: [cellTable(line("AS6 imported cell"))] }] },
            {
                "word/styles.xml": (xml) =>
                    xml
                        .replace(/(w:styleId="TableNormal".*?)w:w="108"(.*?)w:w="108"/, '$1w:w="0"$2w:w="0"')
                        .replace(
                            "</w:styles>",
                            '<w:style w:type="table" w:styleId="ProbeTable"><w:name w:val="Probe Table"/><w:basedOn w:val="TableNormal"/><w:tblPr/></w:style></w:styles>',
                        ),
                "word/document.xml": (xml) => xml.replace(/<w:tblPr>/, '<w:tblPr><w:tblStyle w:val="ProbeTable"/>'),
            },
        ),
        importedDocx(
            "AS7",
            { sections: [{ children: [cellTable(line("AS7 imported cell"))] }] },
            { "word/styles.xml": (xml) => xml.replace(/(w:styleId="TableNormal".*?)w:w="108"(.*?)w:w="108"/, '$1w:w="0"$2w:w="0"') },
            true,
        ),
        importedDocx(
            "AS8",
            {
                theme: { fonts: { body: "Cambria" } },
                sections: [
                    { children: [new Paragraph({ children: [new TextRun({ text: `AS8 imported ${RULER}`, font: { theme: "body" } })] })] },
                ],
            },
            {},
            true,
        ),
        importedDocx(
            "AS9",
            { sections: [{ children: [line(`AS9 imported one ${RULER}`), line(`AS9 imported two ${RULER}`)] }] },
            { "word/styles.xml": (xml) => xml.replace(styleElement("Normal"), NORMAL_TIMES) },
            true,
        ),
    ]);
    const zip = await pack(
        new Document({
            styles: { ...STYLES, paragraphStyles: [{ id: "ProbeShared", name: "Probe Shared", run: { size: 32 } }] },
            sections: [
                {
                    children: [
                        ...probe("AS1", marker("AS1")),
                        ...probe("AS2", marker("AS2")),
                        ...probe("AS3", marker("AS3")),
                        ...probe("AS4", marker("AS4")),
                        ...probe("AS5", marker("AS5")),
                        ...probe("AS6", marker("AS6"), cellTable(line("AS6 main cell"))),
                    ],
                },
                {
                    children: [
                        ...probe("AS7", marker("AS7"), cellTable(line("AS7 main cell"))),
                        ...probe(
                            "AS8",
                            marker("AS8"),
                            new Paragraph({ children: [new TextRun({ text: `AS8 main ${RULER}`, font: { theme: "body" } })] }),
                        ),
                        ...probe("AS9", marker("AS9")),
                    ],
                },
            ],
        }),
    );
    await importInto(zip, "word/document.xml", imported);
    await write("word-imported-styles", zip);
};

const main = async (): Promise<void> => {
    await importedDocuments();
    await importedText();
    await importedEnds();
    await importedParts();
    await importedBookmarks();
    await importedStyles();
};

void main();
