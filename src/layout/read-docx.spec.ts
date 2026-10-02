import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import { obfuscate } from "@file/fonts/obfuscate-ttf-to-odttf";
import {
    AlignmentType,
    Document,
    EndnoteReferenceRun,
    Footer,
    FootnoteReferenceRun,
    Header,
    HeadingLevel,
    LevelFormat,
    Packer,
    PageNumber,
    PageReference,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import { buildTestFont } from "tests/font-file";

import { type DocumentContent, type ParagraphBlock, readDocument } from "./read-document";
import { readDocx } from "./read-docx";

/** Parses XML as patchDocument parses a template's parts */
const parse = (xml: string): Element => xml2js(xml, { compact: false, captureSpacesBetweenElements: true }) as Element;

/** The XML parts of a .docx, parsed, by their paths */
const partsOf = async (buffer: Buffer): Promise<ReadonlyMap<string, Element>> => {
    const zip = await JSZip.loadAsync(buffer);
    const paths = Object.keys(zip.files).filter((path) => path.endsWith(".xml") || path.endsWith(".rels"));
    return new Map(await Promise.all(paths.map(async (path) => [path, parse(await zip.file(path)!.async("string"))] as const)));
};

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const TRANSITIONAL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const STRICT = "http://purl.oclc.org/ooxml/officeDocument/relationships";
const COMPATIBLE = `<w:settings ${W}><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

const relationships = (...relationship: readonly string[]): Element =>
    parse(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationship.join("")}</Relationships>`);
const documentOf = (body: string): Element => parse(`<w:document ${W} ${R}><w:body>${body}</w:body></w:document>`);
const paragraphText = ({ items }: ParagraphBlock): string =>
    items.map((item) => (item.type === "text" ? item.text : item.type === "tab" ? "\t" : "")).join("");
const textOf = (content: DocumentContent, index = 0): string => paragraphText(content.blocks[index].block as ParagraphBlock);

describe("readDocx", () => {
    it("should read a .docx into what the document it was written from is read into", async () => {
        let written: DocumentContent | undefined;
        const doc = new Document({
            features: { updateFields: true },
            pageNumbers: (body, context) => {
                written = readDocument(body, context);
                return { bookmarks: new Map() };
            },
            styles: { default: { document: { run: { font: "Arial", size: 22 } }, heading1: { run: { size: 32 } } } },
            numbering: {
                config: [
                    {
                        reference: "steps",
                        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START, start: 3 }],
                    },
                ],
            },
            footnotes: { 1: { children: [new Paragraph("A footnote")] } },
            endnotes: { 1: { children: [new Paragraph("An endnote")] } },
            sections: [
                {
                    headers: { default: new Header({ children: [new Paragraph("The header")] }) },
                    footers: {
                        default: new Footer({
                            children: [new Paragraph({ children: [new TextRun({ children: [PageNumber.TOTAL_PAGES] })] })],
                        }),
                    },
                    children: [
                        new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("A heading & more")] }),
                        new Paragraph({ children: [new TextRun("Text "), new FootnoteReferenceRun(1), new EndnoteReferenceRun(1)] }),
                        new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("A step")] }),
                        new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("Another step")] }),
                        new Table({
                            width: { size: 9000, type: WidthType.DXA },
                            columnWidths: [3000, 6000],
                            rows: [
                                new TableRow({
                                    tableHeader: true,
                                    children: [
                                        new TableCell({ children: [new Paragraph("Name")] }),
                                        new TableCell({ children: [new Paragraph("Value")] }),
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({ children: [new TextRun("See page "), new PageReference("_Toc1")] }),
                    ],
                },
                {
                    properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } },
                    children: [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("In columns")] })],
                },
            ],
        });
        const parts = await partsOf(await Packer.toBuffer(doc));
        const read = readDocx(parts);
        expect(read).to.deep.equal(written);
        // What it is read into has the document's text, lists, tables, notes and sections
        expect(read.blocks.map(({ block }) => (block.type === "table" ? "table" : paragraphText(block)))).to.include.members([
            "A heading & more",
            "Text 1i",
            "3.\tA step",
            "4.\tAnother step",
            "table",
            "In columns",
        ]);
        expect(read.sections).to.have.length(2);
        expect(read.footnotes.size).to.equal(1);
        expect(read.endnotes).to.not.be.empty;
        expect(read.unsupported).to.equal(undefined);
    });

    it("should find the main document and its parts through the package's relationships, transitional or strict", () => {
        const parts = new Map([
            ["_rels/.rels", relationships(`<Relationship Id="rId1" Type="${TRANSITIONAL}/officeDocument" Target="/content/main.xml"/>`)],
            [
                "content/_rels/main.xml.rels",
                relationships(
                    `<Relationship Id="rId1" Type="${STRICT}/styles" Target="../shared/./styles.xml"/>`,
                    `<Relationship Id="rId2" Type="${TRANSITIONAL}/settings" Target="settings.xml"/>`,
                    `<Relationship Id="rId3" Type="${TRANSITIONAL}/header" Target="header.xml"/>`,
                    `<Relationship Id="rId4" Type="${TRANSITIONAL}/hyperlink" Target="https://example.com" TargetMode="External"/>`,
                    `<Relationship Id="rId5" Type="${TRANSITIONAL}/footer"/>`,
                    `<Relationship Type="${TRANSITIONAL}/footer" Target="nowhere.xml"/>`,
                    `<Relationship Id="rId6" Type="${TRANSITIONAL}/footer" Target="missing.xml"/>`,
                ),
            ],
            [
                "shared/styles.xml",
                parse(
                    `<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="28"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`,
                ),
            ],
            ["content/settings.xml", parse(COMPATIBLE)],
            ["content/header.xml", parse(`<w:hdr ${W}><w:p><w:r><w:t>The header</w:t></w:r></w:p></w:hdr>`)],
            [
                "content/main.xml",
                documentOf(
                    `<w:p><w:r><w:t>Text</w:t></w:r></w:p><w:sectPr><w:headerReference w:type="default" r:id="rId3"/><w:footerReference w:type="default" r:id="rId5"/><w:footerReference w:type="first" r:id="rId6"/></w:sectPr>`,
                ),
            ],
        ]);
        const content = readDocx(parts);
        expect(textOf(content)).to.equal("Text");
        expect((content.blocks[0].block as ParagraphBlock).markFont).to.deep.equal({ size: 14 });
        expect(content.sections[0].headers.default).to.have.length(1);
        // The footers it refers to aren't in the package
        expect(content.sections[0].footers).to.deep.equal({});
        expect(content.unsupported).to.equal(undefined);
    });

    it("should number lists with Word's defaults for what a level doesn't give, and not those whose definition is missing", () => {
        const parts = new Map([
            [
                "word/_rels/document.xml.rels",
                relationships(
                    `<Relationship Id="rId1" Type="${TRANSITIONAL}/numbering" Target="numbering.xml"/>`,
                    `<Relationship Id="rId2" Type="${TRANSITIONAL}/settings" Target="settings.xml"/>`,
                ),
            ],
            ["word/settings.xml", parse(COMPATIBLE)],
            [
                "word/numbering.xml",
                parse(
                    `<w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl><w:lvlText w:val="%1."/></w:lvl></w:abstractNum>` +
                        '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="5"/></w:num></w:numbering>',
                ),
            ],
            [
                "word/document.xml",
                documentOf(
                    ["1", "2"]
                        .map((id) => `<w:p><w:pPr><w:numPr><w:numId w:val="${id}"/></w:numPr></w:pPr><w:r><w:t>Item</w:t></w:r></w:p>`)
                        .join(""),
                ),
            ],
        ]);
        const content = readDocx(parts);
        // A level without a first number starts at 0
        expect(textOf(content, 0)).to.equal("0.\tItem");
        expect(textOf(content, 1)).to.equal("Item");
    });

    it("should read text in CDATA, and leave out comments and processing instructions", () => {
        const content = readDocx(
            new Map([
                ["word/document.xml", documentOf("<w:p><w:r><!-- a note --><?mso-application?><w:t><![CDATA[A & B]]></w:t></w:r></w:p>")],
            ]),
        );
        expect(textOf(content)).to.equal("A & B");
    });

    it("should read a .docx without settings as one in compatibility mode, as Word lays it out", () => {
        const content = readDocx(new Map([["word/document.xml", documentOf("<w:p/>")]]));
        expect(content.unsupported).to.equal("a document in compatibility mode");
    });

    it("should read the compatibility settings Word lays out lines alike with, and stop at others that are on", () => {
        const withCompatibility = (compatibility: string): DocumentContent =>
            readDocx(
                new Map([
                    [
                        "word/_rels/document.xml.rels",
                        relationships(`<Relationship Id="rId1" Type="${TRANSITIONAL}/settings" Target="settings.xml"/>`),
                    ],
                    ["word/settings.xml", parse(COMPATIBLE.replace("</w:compat>", `${compatibility}</w:compat>`))],
                    ["word/document.xml", documentOf("<w:p/>")],
                ]),
            );
        const word = (name: string, val: string): string =>
            `<w:compatSetting w:name="${name}" w:uri="http://schemas.microsoft.com/office/word" w:val="${val}"/>`;
        // As Word 16 writes them in the documents it makes, with the spaces between them that are read
        const written = [
            "overrideTableStyleFontSizeAndJustification",
            "enableOpenTypeFeatures",
            "doNotFlipMirrorIndents",
            "differentiateMultirowTableHeaders",
        ].map((name) => word(name, "1"));
        expect(withCompatibility(`\n${written.join("\n")}${word("useWord2013TrackBottomHyphenation", "0")}`).unsupported).to.equal(
            undefined,
        );
        // Settings Word lays out lines alike with in compatibility mode 15 (word-compat-settings.docx), and one that changes
        // them (word-compat-settings2-suppressTopSpacing.docx)
        expect(withCompatibility("<w:noLeading/>").unsupported).to.equal(undefined);
        expect(withCompatibility(word("allowTextAfterFloatingTableBreak", "1")).unsupported).to.equal(undefined);
        expect(withCompatibility('<w:suppressTopSpacing w:val="0"/>').unsupported).to.equal(undefined);
        expect(withCompatibility("<w:suppressTopSpacing/>").unsupported).to.equal("a compatibility setting not yet followed");
    });

    it("should read the fonts it embeds, undoing the mixing of their keys, as the faces its font table says they are", () => {
        const font = buildTestFont({ name: "In The File", advances: { a: 500 } });
        const key = "{01234567-89AB-CDEF-0123-456789ABCDEF}";
        const embed = (element: string, id: string, fontKey?: string): string =>
            `<w:${element} r:id="${id}"${fontKey === undefined ? "" : ` w:fontKey="${fontKey}"`}/>`;
        const parts = new Map([
            [
                "word/_rels/document.xml.rels",
                relationships(
                    `<Relationship Id="rId1" Type="${TRANSITIONAL}/settings" Target="settings.xml"/>`,
                    `<Relationship Id="rId2" Type="${TRANSITIONAL}/fontTable" Target="fontTable.xml"/>`,
                ),
            ],
            ["word/settings.xml", parse(COMPATIBLE)],
            [
                "word/_rels/fontTable.xml.rels",
                relationships(
                    ...["plain", "keyed", "badKey", "noFile"].map(
                        (name, index) => `<Relationship Id="rId${index + 1}" Type="${TRANSITIONAL}/font" Target="fonts/${name}.odttf"/>`,
                    ),
                ),
            ],
            [
                "word/fontTable.xml",
                parse(
                    `<w:fonts ${W} ${R}>` +
                        `<w:font w:name="Plain">${embed("embedRegular", "rId1")}</w:font>` +
                        `<w:font w:name="Keyed">${embed("embedBoldItalic", "rId2", key)}</w:font>` +
                        // A key that isn't a GUID, a file the package doesn't have, a relationship it doesn't have, and no name
                        `<w:font w:name="Bad">${embed("embedRegular", "rId3", "{not a key}")}${embed("embedBold", "rId4")}${embed("embedItalic", "rId9")}</w:font>` +
                        `<w:font>${embed("embedRegular", "rId1")}</w:font>` +
                        "</w:fonts>",
                ),
            ],
            ["word/document.xml", documentOf("<w:p/>")],
        ]);
        const binaryParts = new Map([
            ["word/fonts/plain.odttf", font],
            ["word/fonts/keyed.odttf", obfuscate(font, key.slice(1, -1))],
            ["word/fonts/badKey.odttf", obfuscate(font, key.slice(1, -1))],
        ]);
        const fonts = readDocx(parts, binaryParts).fonts!;
        expect(fonts.map(({ name, bold, italic }) => ({ name, bold, italic }))).to.deep.equal([
            { name: "Plain", bold: false, italic: false },
            { name: "Keyed", bold: true, italic: true },
        ]);
        expect(fonts.map((face) => face.advanceOf("a".codePointAt(0)!))).to.deep.equal([0.5, 0.5]);
        // Without the files, or a font table, it has no fonts
        expect(readDocx(parts).fonts).to.equal(undefined);
        expect(readDocx(new Map([...parts].filter(([path]) => path !== "word/fontTable.xml")), binaryParts).fonts).to.equal(undefined);
    });

    it("should read an empty body from a package without its main document", () => {
        expect(readDocx(new Map()).blocks).to.deep.equal([]);
        expect(readDocx(new Map([["word/document.xml", parse(`<w:document ${W}/>`)]])).blocks).to.deep.equal([]);
    });
});
