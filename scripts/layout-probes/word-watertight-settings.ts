/**
 * Probes of document settings docx/layout doesn't read, for the watertight inventory: settings of the whole document, so
 * they are in a document of their own. Calibri 11 on A4 with 1440 margins. word-watertight.py reads it.
 *
 * ST1: a page reference written dirty, as docx writes every PageReference, with a result written as 99, to a bookmark on
 *      page 2. Whether Word asks to update the fields when it opens the document, and whether it writes 2 without asking
 * ST2: TB1 of word-watertight-tables.ts again, with `overrideTableStyleFontSizeAndJustification`, which Word writes in
 *      the documents it makes and docx doesn't
 * ST3: a gutter of 1440 at the top (`w:gutterAtTop`): whether it takes room from the page's height, rather than its width
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    Bookmark,
    Document,
    type ISectionOptions,
    LineRuleType,
    Packer,
    PageReference,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

const SINGLE = { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } as const;
const line = (text: string): Paragraph => new Paragraph({ spacing: SINGLE, children: [new TextRun(text)] });

/** ST2: a table of one cell of 10 one-line paragraphs, made by `make`, as TB1 */
const st2 = (probe: string, make: (text: string) => Paragraph, style?: string): ISectionOptions => ({
    children: [
        line(`${probe} above`),
        new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [9026],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            ...(style === undefined ? {} : { style }),
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 9026, type: WidthType.DXA },
                            children: Array.from({ length: 10 }, (_, i) => make(`${probe} para ${i + 1}`)),
                        }),
                    ],
                }),
            ],
        }),
        line(`${probe} below`),
    ],
});

const TABLE_STYLES = `
<w:style w:type="table" w:styleId="WatertightTable"><w:name w:val="Watertight Table"/><w:basedOn w:val="TableNormal"/>
  <w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr>
  <w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="WatertightTableSize"><w:name w:val="Watertight Table Size"/><w:basedOn w:val="TableNormal"/>
  <w:rPr><w:sz w:val="18"/></w:rPr>
  <w:tblPr><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
`;

// Word's own compatibility settings for the documents it makes, after compatibilityMode, as Word 16 writes them
const WORD_COMPATIBILITY = ["overrideTableStyleFontSizeAndJustification", "enableOpenTypeFeatures", "doNotFlipMirrorIndents"]
    .map((name) => `<w:compatSetting w:name="${name}" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>`)
    .join("");

const sections: ISectionOptions[] = [
    {
        children: [
            new Paragraph({
                spacing: SINGLE,
                children: [new TextRun("ST1 see page "), new PageReference("st1target"), new TextRun(" end")],
            }),
        ],
    },
    {
        children: [
            new Paragraph({ spacing: SINGLE, children: [new Bookmark({ id: "st1target", children: [new TextRun("ST1 target")] })] }),
        ],
    },
    st2("ST2a", (text) => new Paragraph({ children: [new TextRun(text)] }), "WatertightTable"),
    st2("ST2c", (text) => new Paragraph({ style: "WatertightBody", children: [new TextRun(text)] }), "WatertightTable"),
    st2("ST2e", (text) => new Paragraph({ children: [new TextRun(text)] })),
    st2("ST2f", (text) => new Paragraph({ children: [new TextRun(text)] }), "WatertightTableSize"),
    { properties: { page: { margin: { gutter: 1440 } } }, children: Array.from({ length: 80 }, (_, i) => line(`ST3 ${i + 1}`)) },
];

const doc = new Document({
    // The page reference's result is written as 99, so whether Word writes its own shows
    pageNumbers: () => ({ bookmarks: new Map([["st1target", "99"]]) }),
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                paragraph: { spacing: { before: 0, after: 200, line: 360, lineRule: LineRuleType.AUTO } },
                run: { size: 22 },
            },
            {
                id: "WatertightBody",
                name: "Watertight Body",
                paragraph: { spacing: { before: 0, after: 200, line: 360, lineRule: LineRuleType.AUTO } },
                run: { size: 22 },
            },
        ],
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const styles = await zip.file("word/styles.xml")!.async("string");
    zip.file("word/styles.xml", styles.replace("</w:styles>", `${TABLE_STYLES.replace(/\n\s*/g, "")}</w:styles>`));
    const settings = await zip.file("word/settings.xml")!.async("string");
    zip.file(
        "word/settings.xml",
        settings
            // gutterAtTop goes after displayBackgroundShape and before evenAndOddHeaders, in the schema's order
            .replace(/(<w:displayBackgroundShape\/>)/, "$1<w:gutterAtTop/>")
            .replace(/(<w:compatSetting [^>]*w:name="compatibilityMode"[^>]*\/>)/, `$1${WORD_COMPATIBILITY}`),
    );
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(
        "build/word-probes/word-watertight-settings.docx",
        await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
    );
};

void main();
