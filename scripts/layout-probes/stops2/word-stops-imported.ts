/**
 * Probes of imported documents (`w:altChunk`) docx/layout stops at, after `word-imported-documents.docx` (AC1 to AC16)
 * and `word-imported-styles.docx` (AS1 to AS9):
 *
 * - "an imported document of several sections" (AC4b: Word's headers and margins for its pages followed no rule found)
 * - "an imported document whose formatting is kept" (AC3g, AS7 to AS9: the kept look, the template's Normal Table and
 *   theme fonts, and the last paragraph's space after, not explained)
 * - "a style of an imported document's own, where its defaults leave out some of the document's"
 *
 * Calibri 11 on A4 with inch margins in the main document; each imported .docx is a part of the package, written by docx,
 * imported where a paragraph says "@@IMPORT name@@", as word-imported-documents.ts imports them.
 *
 * IM1a: an imported document of two sections: a portrait one of margins 720 and a header "IM1a imported header 1", and a
 *   landscape one of margins 2160 and a header of its own, between lines of the main document, whose section has a header
 * IM1b: three sections, the second on a new odd page and numbered from 5, the third continuous, with PAGE in their footers
 * IM1c: two sections, the main document's section of 2 columns
 * IM2a to IM2d: "keep source formatting" (w:matchSrc): a Normal of Times New Roman 14 with 240 after and a paragraph of 3
 *   lines (a); the same in a table cell of the main document (b); a table of the imported document's Normal Table, of
 *   cell margins of 300 (c); and a Heading 1 of its own, 20 points, which the main document's Heading 1 (16) also is (d)
 * IM3a, IM3b: an imported document whose defaults give no size (no w:sz in w:rPrDefault), with a style of its own based
 *   on Normal with 240 before (a), and one based on no style (b)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-imported.ts [folder]
 */
import {
    Document,
    Footer,
    Header,
    HeadingLevel,
    PageNumber,
    PageOrientation,
    Packer,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { ALL_BORDERS, PAGE, cell, line, lines, prose, write } from "./kit";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";

const importedDocument = async (doc: Document): Promise<Uint8Array> => new Uint8Array(await Packer.toBuffer(doc));

const margins = (size: number) => ({ top: size, bottom: size, left: size, right: size, header: 708, footer: 708 });
const IMPORTS: Record<string, { readonly doc: Document; readonly matchSource?: boolean; readonly strip?: (xml: string) => string }> = {
    IM1a: {
        doc: new Document({
            sections: [
                {
                    properties: { page: { margin: margins(720) } },
                    headers: { default: new Header({ children: [line("IM1a imported header 1")] }) },
                    children: [lines("IM1a imported first", 8)],
                },
                {
                    properties: {
                        page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: margins(2160) },
                        type: SectionType.NEXT_PAGE,
                    },
                    headers: { default: new Header({ children: [line("IM1a imported header 2")] }) },
                    children: [lines("IM1a imported second", 8)],
                },
            ],
        }),
    },
    IM1b: {
        doc: new Document({
            sections: [
                {
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    children: [new TextRun("IM1b footer one "), new TextRun({ children: [PageNumber.CURRENT] })],
                                }),
                            ],
                        }),
                    },
                    children: [lines("IM1b imported one", 6)],
                },
                {
                    properties: { type: SectionType.ODD_PAGE, page: { pageNumbers: { start: 5 } } },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    children: [new TextRun("IM1b footer two "), new TextRun({ children: [PageNumber.CURRENT] })],
                                }),
                            ],
                        }),
                    },
                    children: [lines("IM1b imported two", 6)],
                },
                { properties: { type: SectionType.CONTINUOUS }, children: [lines("IM1b imported three", 6)] },
            ],
        }),
    },
    IM1c: {
        doc: new Document({
            sections: [
                { children: [lines("IM1c imported one", 10)] },
                {
                    properties: { type: SectionType.CONTINUOUS, page: { margin: margins(1800) } },
                    children: [lines("IM1c imported two", 10)],
                },
            ],
        }),
    },
    ...Object.fromEntries(
        ["IM2a", "IM2b"].map((name) => [
            name,
            {
                matchSource: true,
                doc: new Document({
                    styles: {
                        default: { document: { run: { font: "Times New Roman", size: 28 }, paragraph: { spacing: { after: 240 } } } },
                    },
                    sections: [{ children: [line(`${name} imported ${prose(40)}`), line(`${name} imported last`)] }],
                }),
            },
        ]),
    ),
    IM2c: {
        matchSource: true,
        doc: new Document({
            sections: [
                {
                    children: [
                        new Table({
                            borders: ALL_BORDERS,
                            margins: { left: 300, right: 300, top: 300, bottom: 300 },
                            rows: [new TableRow({ children: [cell("IM2c imported a"), cell("IM2c imported b")] })],
                        }),
                        line("IM2c imported after"),
                    ],
                },
            ],
        }),
    },
    IM2d: {
        matchSource: true,
        doc: new Document({
            styles: {
                paragraphStyles: [
                    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 40, font: "Times New Roman" } },
                ],
            },
            sections: [
                {
                    children: [
                        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("IM2d imported heading")] }),
                        line("IM2d imported body"),
                    ],
                },
            ],
        }),
    },
    IM3a: {
        strip: (xml) =>
            xml.replace(
                /<w:rPrDefault>.*?<\/w:rPrDefault>/s,
                '<w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr></w:rPrDefault>',
            ),
        doc: new Document({
            styles: { paragraphStyles: [{ id: "Own", name: "Own", basedOn: "Normal", paragraph: { spacing: { before: 240 } } }] },
            sections: [{ children: [new Paragraph({ style: "Own", children: [new TextRun(`IM3a imported ${prose(20)}`)] })] }],
        }),
    },
    IM3b: {
        strip: (xml) =>
            xml.replace(
                /<w:rPrDefault>.*?<\/w:rPrDefault>/s,
                '<w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr></w:rPrDefault>',
            ),
        doc: new Document({
            styles: { paragraphStyles: [{ id: "Lone", name: "Lone", paragraph: { spacing: { before: 240 } } }] },
            sections: [{ children: [new Paragraph({ style: "Lone", children: [new TextRun(`IM3b imported ${prose(20)}`)] })] }],
        }),
    },
};

const files: Record<string, Uint8Array> = {};
const JSZip = (await import("jszip")).default;
for (const [name, { doc, strip }] of Object.entries(IMPORTS)) {
    let data = await importedDocument(doc);
    if (strip) {
        const zip = await JSZip.loadAsync(data);
        zip.file("word/styles.xml", strip(await zip.file("word/styles.xml")!.async("string")));
        data = await zip.generateAsync({ type: "uint8array" });
    }
    files[`word/afchunk-${name}.docx`] = data;
}

const importHere = (name: string): Paragraph => line(`@@IMPORT ${name}@@`);
const mainHeader = { default: new Header({ children: [line("IM main header")] }) };

await write({
    name: "word-stops-imported",
    files,
    sections: [
        {
            properties: PAGE,
            headers: mainHeader,
            children: [line("IM1a above"), line("IM1a main before"), importHere("IM1a"), line("IM1a main after"), line("IM1a below")],
        },
        { properties: { ...PAGE, type: SectionType.NEXT_PAGE }, children: [line("IM1b above"), importHere("IM1b"), line("IM1b below")] },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
            children: [line("IM1c above"), importHere("IM1c"), line("IM1c below")],
        },
        {
            properties: { ...PAGE, type: SectionType.NEXT_PAGE },
            children: [
                line("IM2a above"),
                importHere("IM2a"),
                line("IM2a below"),
                line("IM2b above"),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [new TableRow({ children: [cell([importHere("IM2b"), line("IM2b cell end")])] })],
                }),
                line("IM2b below"),
                line("IM2c above"),
                importHere("IM2c"),
                line("IM2c below"),
                line("IM2d above"),
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("IM2d main heading")] }),
                importHere("IM2d"),
                line("IM2d below"),
                line("IM3a above"),
                importHere("IM3a"),
                line("IM3a below"),
                line("IM3b above"),
                importHere("IM3b"),
                line("IM3b below"),
            ],
        },
    ],
    injections: [
        (parts) => {
            let text = parts.get("word/document.xml")!;
            let rels = parts.get("word/_rels/document.xml.rels")!;
            let types = parts.get("[Content_Types].xml")!;
            for (const [name, { matchSource }] of Object.entries(IMPORTS)) {
                const id = `rIdImport${name}`;
                text = text.replace(
                    new RegExp(`<w:p>(?:(?!<w:p>).)*?@@IMPORT ${name}@@(?:(?!<w:p>).)*?</w:p>`),
                    `<w:altChunk r:id="${id}">${matchSource ? "<w:altChunkPr><w:matchSrc/></w:altChunkPr>" : ""}</w:altChunk>`,
                );
                rels = rels.replace(
                    "</Relationships>",
                    `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk-${name}.docx"/></Relationships>`,
                );
                types = types.replace("</Types>", `<Override ContentType="${DOCX_TYPE}" PartName="/word/afchunk-${name}.docx"/></Types>`);
            }
            parts.set("word/document.xml", text);
            parts.set("word/_rels/document.xml.rels", rels);
            parts.set("[Content_Types].xml", types);
        },
    ],
});
