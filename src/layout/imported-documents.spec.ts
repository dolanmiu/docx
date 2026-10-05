// cspell:ignore endedi
import { describe, expect, it } from "vitest";
import { type Element, xml2js } from "xml-js";

import type { DocxPackage } from "./imported-documents";
import { type Block, type DocumentContent, type ParagraphBlock } from "./read-document";
import { readDocx } from "./read-docx";

/** Parses XML as patchDocument parses a template's parts */
const parse = (xml: string): Element => xml2js(xml, { compact: false, captureSpacesBetweenElements: true }) as Element;

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const TYPES = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const COMPATIBLE = `<w:settings ${W}><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

const paragraph = (text: string, properties = ""): string =>
    `<w:p>${properties === "" ? "" : `<w:pPr>${properties}</w:pPr>`}<w:r><w:t>${text}</w:t></w:r></w:p>`;
const styled = (text: string, id: string): string => paragraph(text, `<w:pStyle w:val="${id}"/>`);
// Normal is the default paragraph style, as Word writes it
const style = (id: string, name: string, properties: string, type = "paragraph"): string =>
    `<w:style w:type="${type}" w:styleId="${id}"${id === "Normal" ? ' w:default="1"' : ""}><w:name w:val="${name}"/>${properties}</w:style>`;
const size = (halfPoints: number): string => `<w:rPr><w:sz w:val="${halfPoints}"/></w:rPr>`;
const imports = (id: string): string => `<w:altChunk r:id="${id}"/>`;

/** The parts of a package of a document, with its body, and its other parts as they are given, by their names */
type Parts = {
    readonly body: string;
    readonly styles?: string;
    readonly numbering?: string;
    readonly footnotes?: string;
    readonly endnotes?: string;
    /** The parts it imports, by the ids of its relationships to them, with their paths and content types */
    readonly imported?: Readonly<Record<string, readonly [string, string?]>>;
    /** Other parts, such as headers, and their relationships from the main document */
    readonly others?: readonly (readonly [string, string, string])[];
    /** The relationships of other parts to the parts they import: each part's path, with the ids and targets */
    readonly otherRelationships?: readonly (readonly [string, readonly (readonly [string, string])[]])[];
};

const relationshipsOf = (relationships: readonly (readonly [string, string, string])[]): Element =>
    parse(
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships
            .map(([id, type, target]) => `<Relationship Id="${id}" Type="${TYPES}/${type}" Target="${target}"/>`)
            .join("")}</Relationships>`,
    );

/** A package of a document, with its settings, so it isn't in compatibility mode */
const packageOf = (parts: Parts, importedDocuments: ReadonlyMap<string, DocxPackage> = new Map()): DocxPackage => {
    const own = [
        ["styles", "styles.xml", parts.styles],
        ["numbering", "numbering.xml", parts.numbering],
        ["footnotes", "footnotes.xml", parts.footnotes],
        ["endnotes", "endnotes.xml", parts.endnotes],
    ].flatMap(([type, target, xml]) => (xml === undefined ? [] : [[type!, target!, xml] as const]));
    const imported = Object.entries(parts.imported ?? {});
    const others = parts.others ?? [];
    return {
        parts: new Map([
            [
                "word/_rels/document.xml.rels",
                relationshipsOf([
                    ["rIdSettings", "settings", "settings.xml"],
                    ...own.map(([type, target], index) => [`rIdOwn${index}`, type, target] as const),
                    ...imported.map(([id, [target]]) => [id, "aFChunk", target] as const),
                    ...others.map(([id, type, target]) => [id, type, target] as const),
                ]),
            ],
            [
                "[Content_Types].xml",
                parse(
                    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="htm" ContentType="text/html"/>${imported
                        .flatMap(([, [target, type]]) =>
                            type === undefined ? [] : [`<Override PartName="/word/${target}" ContentType="${type}"/>`],
                        )
                        .join("")}</Types>`,
                ),
            ],
            ["word/settings.xml", parse(COMPATIBLE)],
            ["word/document.xml", parse(`<w:document ${W} ${R}><w:body>${parts.body}</w:body></w:document>`)],
            ...own.map(([type, target, xml]) => [`word/${target}`, parse(`<w:${type} ${W} ${R}>${xml}</w:${type}>`)] as const),
            ...(parts.otherRelationships ?? []).map(
                ([path, relationships]) =>
                    [
                        `word/_rels/${path}.rels`,
                        relationshipsOf(relationships.map(([id, target]) => [id, "aFChunk", target] as const)),
                    ] as const,
            ),
        ]),
        importedDocuments,
    };
};

/** A document importing others: each a .docx, by its name, which is at word/<name>.docx in the package */
const read = (parts: Parts, imported: Readonly<Record<string, Parts>> = {}): DocumentContent => {
    const docx = packageOf(
        parts,
        new Map(Object.entries(imported).map(([name, other]) => [`word/${name}.docx`, packageOf(other)] as const)),
    );
    return readDocx(docx.parts, docx.binaryParts, {}, docx.importedDocuments);
};

const textOf = (block: Block): string =>
    block.type === "table"
        ? "[table]"
        : block.items.map((item) => (item.type === "text" ? item.text : item.type === "tab" ? "\t" : "")).join("");
const textsOf = (content: DocumentContent): readonly string[] => content.blocks.map(({ block }) => textOf(block));
const paragraphOf = (content: DocumentContent, text: string): ParagraphBlock =>
    content.blocks.map(({ block }) => block).find((block) => block.type === "paragraph" && textOf(block) === text) as ParagraphBlock;
/** The size of a paragraph's text, in points */
const sizeOf = (content: DocumentContent, text: string): number | undefined => {
    const [first] = paragraphOf(content, text).items;
    return first.type === "text" ? first.font.size : undefined;
};
const markersOf = (content: DocumentContent): readonly (readonly [string, string])[] =>
    content.blocks.flatMap(({ block }) =>
        block.type === "paragraph"
            ? block.items.flatMap((item) => (item.type === "marker" ? [[textOf(block), item.name] as const] : []))
            : [],
    );

const IMPORTED = { rIdImport: ["imported.docx", DOCX] } as const;
const SECTION =
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>';

describe("imported documents", () => {
    it("should lay out an imported .docx's paragraphs where it is, in the document's styles of the same names, without its section's properties (AC1, AC3, AC4a)", () => {
        const content = read(
            {
                body: `${paragraph("before")}${imports("rIdImport")}${paragraph("after")}${SECTION}`,
                styles: `${style("Normal", "Normal", size(22))}${style("SharedA", "Probe Shared", size(32))}`,
                imported: IMPORTED,
            },
            {
                imported: {
                    // Its own defaults, Normal and Probe Shared, of another id and its name in other capitals, and a landscape page
                    body: `${paragraph("one")}${styled("two", "SharedB")}<w:sectPr><w:pgSz w:w="16838" w:h="11906"/></w:sectPr>`,
                    styles: `<w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="40"/></w:rPr></w:rPrDefault></w:docDefaults>${style("Normal", "normal", size(28))}${style("SharedB", "probe shared", size(48))}`,
                },
            },
        );
        expect(textsOf(content)).to.deep.equal(["before", "one", "two", "after"]);
        expect(sizeOf(content, "one")).to.equal(11);
        expect(sizeOf(content, "two")).to.equal(16);
        expect(content.sections).to.have.length(1);
        expect(content.sections[0].pageWidth).to.equal(595.3);
        expect(content.unsupported).to.equal(undefined);
    });

    it("should add the styles only an imported document has, with those they are based on, and new ids where the document has theirs (AC3d, AC3f)", () => {
        const content = read(
            {
                body: `${imports("rIdFirst")}${imports("rIdSecond")}${SECTION}`,
                styles: `${style("Normal", "Normal", size(22))}${style("Taken", "Ours", size(32))}`,
                imported: { rIdFirst: ["first.docx", DOCX], rIdSecond: ["second.docx", DOCX] },
            },
            {
                first: {
                    body: `${styled("only", "Only")}${styled("taken", "Taken")}${paragraph("plain")}`,
                    styles: `${style("Normal", "Normal", size(28))}${style("Only", "Only", '<w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="480"/></w:pPr>')}${style("Taken", "Theirs", size(48))}${style("Loop", "Loop", '<w:basedOn w:val="Loop"/>')}<w:style w:type="paragraph"><w:name w:val="No id"/></w:style>${style("Unnamed", "", "").replace('<w:name w:val=""/>', "")}`,
                },
                // Its Only is the one the first added, and its Normal the document's, not the one added for Only to be based on
                second: {
                    body: `${styled("only again", "Only")}${paragraph("plain again")}`,
                    // A style without a type is a paragraph style
                    styles: `${style("Normal", "Normal", size(36))}${style("Only", "Only", size(60)).replace(' w:type="paragraph"', "")}`,
                },
            },
        );
        expect(textsOf(content)).to.deep.equal(["only", "taken", "plain", "only again", "plain again"]);
        // Based on the imported document's Normal, as it is there
        expect(paragraphOf(content, "only")).to.deep.include({ style: "Only" });
        expect(sizeOf(content, "only")).to.equal(14);
        expect(paragraphOf(content, "only").format.spaceBefore).to.equal(24);
        expect(paragraphOf(content, "taken")).to.deep.include({ style: "Taken1" });
        expect(sizeOf(content, "taken")).to.equal(24);
        expect(sizeOf(content, "plain")).to.equal(11);
        expect(sizeOf(content, "only again")).to.equal(14);
        expect(sizeOf(content, "plain again")).to.equal(11);
    });

    it("should give the styles only an imported document has the look its defaults give them there, but for character and table styles (AS1 to AS6)", () => {
        const defaults =
            '<w:docDefaults><w:pPrDefault><w:pPr><w:spacing w:after="240"/></w:pPr></w:pPrDefault><w:rPrDefault><w:rPr><w:sz w:val="28"/></w:rPr></w:rPrDefault></w:docDefaults>';
        const margins = (width: number): string =>
            `<w:tblPr><w:tblCellMar><w:left w:w="${width}" w:type="dxa"/><w:right w:w="${width}" w:type="dxa"/></w:tblCellMar></w:tblPr>`;
        const tableIn = (id: string | undefined, text: string): string =>
            `<w:tbl>${id === undefined ? "" : `<w:tblPr><w:tblStyle w:val="${id}"/></w:tblPr>`}<w:tr><w:tc>${paragraph(text)}</w:tc></w:tr></w:tbl>`;
        const content = read(
            {
                body: `${imports("rIdImport")}${SECTION}`,
                styles: `<w:docDefaults><w:pPrDefault><w:pPr><w:spacing w:after="0"/></w:pPr></w:pPrDefault><w:rPrDefault><w:rPr><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>${style("Normal", "Normal", "")}<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/>${margins(108)}</w:style>`,
                imported: IMPORTED,
            },
            {
                imported: {
                    body: `${styled("based on nothing", "Alone")}<w:p><w:r><w:rPr><w:rStyle w:val="Bold"/></w:rPr><w:t>bold</w:t></w:r></w:p>${tableIn("ProbeTable", "probe table")}${tableIn(undefined, "default table")}`,
                    styles: `${defaults}${style("Normal", "Normal", "")}${style("Alone", "Alone", '<w:pPr><w:spacing w:before="480"/></w:pPr>')}${style("Bold", "Bold", "<w:rPr><w:b/></w:rPr>", "character")}<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/>${margins(0)}</w:style>${style("ProbeTable", "Probe Table", '<w:basedOn w:val="TableNormal"/>', "table")}`,
                },
            },
        );
        // Its defaults' size and space after, with its own space before
        expect(sizeOf(content, "based on nothing")).to.equal(14);
        expect(paragraphOf(content, "based on nothing").format).to.deep.include({ spaceBefore: 24, spaceAfter: 12 });
        // Bold in the document's size
        const [bold] = paragraphOf(content, "bold").items;
        expect(bold.type === "text" && bold.font).to.deep.include({ bold: true, size: 11 });
        // Its table style is based on the document's Normal Table, and its Normal Table is the document's
        const margin = (index: number): number | false => {
            const { block } = content.blocks[index];
            return block.type === "table" && block.rows[0].cells[0].marginLeft;
        };
        expect([margin(2), margin(3)]).to.deep.equal([5.4, 5.4]);
    });

    it("should keep an imported document's own styles where its formatting is kept, but for its table styles, and give its last paragraph no space after (AS7, AS9, IM2a, IM2d)", () => {
        const content = read(
            {
                body: `${paragraph("before")}<w:altChunk r:id="rIdImport"><w:altChunkPr><w:matchSrc/></w:altChunkPr></w:altChunk>${paragraph("after")}${SECTION}`,
                styles: `${style("Normal", "Normal", size(22))}${style("Heading1", "heading 1", size(32))}<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>`,
                imported: IMPORTED,
            },
            {
                imported: {
                    body: `${styled("heading", "Heading1")}${paragraph("one")}<w:tbl><w:tr><w:tc>${paragraph("cell")}</w:tc></w:tr></w:tbl>${paragraph("last")}`,
                    styles: `${style("Normal", "Normal", `<w:pPr><w:spacing w:after="240"/></w:pPr>${size(28)}`)}${style("Heading1", "heading 1", `<w:basedOn w:val="Normal"/>${size(40)}`)}<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>`,
                },
            },
        );
        // Its Normal and Heading 1 are its own, not the document's of their names
        expect(sizeOf(content, "heading")).to.equal(20);
        expect(sizeOf(content, "one")).to.equal(14);
        expect(paragraphOf(content, "one").format.spaceAfter).to.equal(12);
        expect(sizeOf(content, "before")).to.equal(11);
        // Its Normal Table is the document's
        const { block } = content.blocks[3];
        expect(block.type === "table" && block.rows[0].cells[0].marginLeft).to.equal(5.4);
        // Its last paragraph has no space after
        expect(paragraphOf(content, "last").format.spaceAfter).to.equal(0);
    });

    it("should match an imported document's formatting to the document's where its w:matchSrc is turned off", () => {
        for (const value of ["0", "false", "off"]) {
            const content = read(
                {
                    body: `<w:altChunk r:id="rIdImport"><w:altChunkPr><w:matchSrc w:val="${value}"/></w:altChunkPr></w:altChunk>${SECTION}`,
                    styles: style("Normal", "Normal", size(22)),
                    imported: IMPORTED,
                },
                { imported: { body: paragraph("one"), styles: style("Normal", "Normal", size(28)) } },
            );
            // In the document's Normal, as an import whose formatting isn't kept
            expect(sizeOf(content, "one")).to.equal(11);
        }
    });

    it("should stop at an imported document whose formatting is kept that ends in a paragraph of a content control or custom XML", () => {
        const kept = (body: string): DocumentContent =>
            read(
                {
                    body: `<w:altChunk r:id="rIdImport"><w:altChunkPr><w:matchSrc/></w:altChunkPr></w:altChunk>${paragraph("after")}${SECTION}`,
                    imported: IMPORTED,
                },
                { imported: { body, styles: style("Normal", "Normal", '<w:pPr><w:spacing w:after="240"/></w:pPr>') } },
            );
        const STOP = "an imported document whose formatting is kept that ends in a content control or custom XML";
        // Which paragraph Word gives none of its space after there hasn't been seen
        for (const body of [
            `${paragraph("one")}<w:sdt><w:sdtContent>${paragraph("last")}</w:sdtContent></w:sdt>`,
            `<w:customXml w:element="part">${paragraph("last")}</w:customXml>`,
        ]) {
            expect(kept(body).blocks[0].block).to.deep.include({ unsupported: STOP });
        }
        // One that ends in a table in one is ended with a paragraph of its own, which has none
        const table = kept(`<w:sdt><w:sdtContent><w:tbl><w:tr><w:tc>${paragraph("cell")}</w:tc></w:tr></w:tbl></w:sdtContent></w:sdt>`);
        expect(table.blocks.map(({ block }) => block.unsupported)).to.not.include(STOP);
    });

    it("should put paragraphs and tables of no style of an imported document in its default styles, where the document's are others (AS5)", () => {
        const content = read(
            {
                body: `${imports("rIdImport")}${SECTION}`,
                styles: `${style("Normal", "Normal", size(22))}<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/></w:style>`,
                imported: IMPORTED,
            },
            {
                imported: {
                    body: `${paragraph("no style")}${paragraph("aligned", '<w:jc w:val="center"/>')}${styled("styled", "Normal")}<w:tbl>\n<w:tr><w:tc>${paragraph("cell")}</w:tc></w:tr></w:tbl><w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tr><w:tc>${paragraph("cell")}</w:tc></w:tr></w:tbl>`,
                    styles: `<w:style w:type="paragraph" w:default="1" w:styleId="Body"><w:name w:val="Body Default"/>${size(28)}</w:style>${style("Normal", "Normal", size(36))}<w:style w:type="table" w:default="1" w:styleId="Plain"><w:name w:val="Plain Table"/></w:style>`,
                },
            },
        );
        expect(textsOf(content)).to.deep.equal(["no style", "aligned", "styled", "[table]", "[table]", ""]);
        expect(paragraphOf(content, "no style")).to.deep.include({ style: "Body" });
        expect(paragraphOf(content, "aligned")).to.deep.include({ style: "Body" });
        expect(paragraphOf(content, "aligned").format.alignment).to.equal("center");
        expect(sizeOf(content, "styled")).to.equal(11);
    });

    it("should give a style only an imported document has Word's own font and size where its defaults give none, and stop where they leave out more (IM3a, IM3b)", () => {
        const defaults = (properties: string): string =>
            `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>${properties}</w:pPr></w:pPrDefault></w:docDefaults>`;
        const imported = (body: string, styles = ""): Readonly<Record<string, Parts>> => ({
            imported: {
                body,
                styles: `<w:docDefaults><w:rPrDefault/><w:pPrDefault/></w:docDefaults>${style("Alone", "Alone", "")}${styles}`,
            },
        });
        const content = read(
            {
                body: `${imports("rIdImport")}${SECTION}`,
                styles: defaults('<w:spacing w:before="0" w:after="0" w:line="240"/>'),
                imported: IMPORTED,
            },
            imported(styled("alone", "Alone")),
        );
        const [first] = paragraphOf(content, "alone").items;
        expect(first.type === "text" && first.font).to.deep.include({ font: "Times New Roman", size: 10 });
        // Spacing of other than Word's own, which isn't known
        const spaced = read(
            { body: `${imports("rIdImport")}${SECTION}`, styles: defaults('<w:spacing w:before="0" w:after="160"/>'), imported: IMPORTED },
            imported(styled("alone", "Alone")),
        );
        expect(spaced.blocks[0].block).to.deep.include({
            unsupported: "a style of an imported document's own, where its defaults leave out some of the document's",
        });
        // And East Asian or right-to-left text there, whose fonts Word's PDFs haven't shown
        for (const body of [
            styled("\u6c38", "Alone"),
            paragraph("right", '<w:pStyle w:val="Alone"/><w:rPr><w:rtl/></w:rPr>').replace("<w:r>", "<w:r><w:rPr><w:rtl/></w:rPr>"),
        ]) {
            const other = read({ body: `${imports("rIdImport")}${SECTION}`, styles: defaults(""), imported: IMPORTED }, imported(body));
            expect(other.blocks[0].block).to.deep.include({
                unsupported: "East Asian or right-to-left text in an imported document whose own styles give no font",
            });
        }
        // In its notes too
        const noted = read(
            { body: `${imports("rIdImport")}${SECTION}`, styles: defaults(""), imported: IMPORTED },
            {
                imported: {
                    ...imported("").imported,
                    body: styled("alone", "Alone").replace("</w:p>", '<w:r><w:footnoteReference w:id="1"/></w:r></w:p>'),
                    footnotes: `<w:footnote w:type="separator" w:id="-1"><w:p/></w:footnote><w:footnote w:id="1">${styled("\u6c38", "Alone")}</w:footnote>`,
                },
            },
        );
        expect(noted.blocks[0].block).to.deep.include({
            unsupported: "East Asian or right-to-left text in an imported document whose own styles give no font",
        });
    });

    it("should number an imported document's lists as lists of their own, and its notes with the document's (AC5, AC6)", () => {
        const level = (text: string): string =>
            `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="${text}"/><w:pPr><w:pStyle w:val="Listed"/></w:pPr></w:lvl>`;
        const numbered = (text: string): string => paragraph(text, '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
        const note = (id: string, text: string): string => `<w:footnote w:id="${id}">${paragraph(text)}</w:footnote>`;
        const separators =
            '<w:footnote w:type="separator" w:id="-1"><w:p/></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p/></w:footnote>';
        const referring = (text: string, kind: "footnote" | "endnote" = "footnote"): string =>
            `<w:p><w:r><w:t>${text}</w:t></w:r><w:r><w:${kind}Reference w:id="1"/></w:r></w:p>`;
        const content = read(
            {
                body: `${numbered("a")}${referring("main")}${imports("rIdImport")}${numbered("c")}${SECTION}`,
                numbering: `<w:abstractNum w:abstractNumId="0">${level("%1.")}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>`,
                footnotes: `${separators}${note("1", "main note")}`,
                imported: IMPORTED,
            },
            {
                imported: {
                    body: `${numbered("b")}${styled("listed", "Listed")}${referring("imported")}${referring("ended", "endnote")}`,
                    styles: style("Listed", "Listed", '<w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr>'),
                    numbering: `<w:abstractNum w:abstractNumId="0">${level("(%1)")}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/><w:lvlOverride w:ilvl="0"/></w:num><w:numIdMacAtCleanup w:val="1"/>`,
                    footnotes: `${separators}${note("1", "imported note")}`,
                    endnotes: `<w:endnote w:type="separator" w:id="-1">${paragraph("separator")}</w:endnote><w:endnote w:id="1">${paragraph("imported endnote")}</w:endnote>`,
                },
            },
        );
        expect(textsOf(content)).to.deep.equal(["1.\ta", "main1", "(1)\tb", "(2)\tlisted", "imported2", "endedi", "2.\tc"]);
        expect([...content.footnotes.values()].map((blocks) => blocks.map(textOf))).to.deep.equal([["main note"], ["imported note"]]);
        // The document had no endnotes, so takes the imported document's separator with them
        expect(content.endnotes.map(textOf)).to.deep.equal(["separator", "imported endnote"]);
    });

    it("should take the separators of the first imported document with notes into a document that has none", () => {
        const notes = (separator: string, text: string): string =>
            `<w:footnote w:type="separator" w:id="-1">${paragraph(separator)}</w:footnote><w:footnote w:id="1">${paragraph(text)}</w:footnote>`;
        const referring = (text: string): string => `<w:p><w:r><w:t>${text}</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r></w:p>`;
        const content = read(
            {
                body: `${imports("rIdFirst")}${imports("rIdSecond")}${SECTION}`,
                imported: { rIdFirst: ["first.docx", DOCX], rIdSecond: ["second.docx", DOCX] },
            },
            {
                first: { body: referring("first"), footnotes: notes("first separator", "first note") },
                second: { body: referring("second"), footnotes: notes("second separator", "second note") },
            },
        );
        expect([...content.footnotes.values()].map((blocks) => blocks.map(textOf))).to.deep.equal([["first note"], ["second note"]]);
        expect(content.footnoteSeparator.map(textOf)).to.deep.equal(["first separator"]);
    });

    it("should end an imported document with a paragraph where it doesn't end with one, as Word gives every document (AC2)", () => {
        const table = "<w:tbl><w:tr><w:tc><w:p/></w:tc></w:tr></w:tbl>";
        const control = (blocks: string): string => `<w:sdt><w:sdtContent>${blocks}</w:sdtContent></w:sdt>`;
        const ending: Readonly<Record<string, string>> = {
            empty: SECTION,
            table: `${table}${SECTION}`,
            paragraph: `${table}${paragraph("last")}${SECTION}`,
            control: control(paragraph("controlled")),
            tableControl: control(table),
            emptyControl: "<w:sdt><w:sdtPr/></w:sdt>",
            custom: `<w:customXml>${paragraph("custom")}</w:customXml>`,
        };
        const content = read(
            {
                body: `${Object.keys(ending)
                    .map((path) => `${paragraph(path)}${imports(path)}`)
                    .join("")}${SECTION}`,
                imported: Object.fromEntries(Object.keys(ending).map((path) => [path, [`${path}.docx`, DOCX]])),
            },
            Object.fromEntries(Object.entries(ending).map(([path, body]) => [path, { body }])),
        );
        expect(textsOf(content)).to.deep.equal([
            "empty",
            "",
            "table",
            "[table]",
            "",
            "paragraph",
            "[table]",
            "last",
            "control",
            "controlled",
            "tableControl",
            "[table]",
            "",
            "emptyControl",
            "",
            "custom",
            "custom",
        ]);
    });

    it("should keep the document's bookmark of a name an imported document has too, and leave out one two imported documents have (AC11)", () => {
        const marked = (name: string, text: string): string =>
            `<w:p><w:bookmarkStart w:id="0" w:name="${name}"/><w:r><w:t>${text}</w:t></w:r><w:bookmarkEnd w:id="0"/></w:p>`;
        const content = read(
            {
                body: `${imports("rIdFirst")}${marked("mine", "main")}${imports("rIdSecond")}${SECTION}`,
                imported: { rIdFirst: ["first.docx", DOCX], rIdSecond: ["second.docx", DOCX] },
            },
            {
                first: { body: `${marked("mine", "first mine")}${marked("shared", "first shared")}${marked("own", "first own")}` },
                second: { body: `${marked("shared", "second shared")}<w:p><w:bookmarkStart w:id="1"/></w:p>` },
            },
        );
        expect(markersOf(content)).to.deep.equal([
            ["first own", "own"],
            ["main", "mine"],
        ]);
    });

    it("should turn a document imported into a table cell into the cell's own, and stop at one an imported document imports that can't be read (AC7)", () => {
        const content = read(
            {
                // With the spaces between elements that are read
                body: `<w:tbl>\n<w:tr><w:tc>${imports("rIdCell")}${paragraph("cell")}</w:tc></w:tr></w:tbl>${imports("rIdNested")}${SECTION}`,
                imported: { rIdCell: ["cell.docx", DOCX], rIdNested: ["outer.docx", DOCX] },
            },
            {
                cell: { body: paragraph("imported in a cell") },
                // The .docx it imports isn't in the package given
                outer: { body: imports("rIdInner"), imported: { rIdInner: ["inner.docx", DOCX] } },
            },
        );
        const [{ block: table }, { block: nested }] = content.blocks;
        expect(table.type === "table" && table.rows[0].cells[0].blocks.map(textOf)).to.deep.equal(["imported in a cell", "cell"]);
        expect(nested).to.deep.include({ unsupported: "an imported document that can't be read" });
    });

    it("should turn documents imported into a header, a note and an imported document into their own (AC9, AC12)", () => {
        const header = parse(`<w:hdr ${W} ${R}>${paragraph("header above")}${imports("rIdHeaderImport")}</w:hdr>`);
        const docx = packageOf(
            {
                body: `<w:p><w:r><w:footnoteReference w:id="1"/></w:r></w:p>${imports("rIdOuter")}<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/></w:sectPr>`,
                footnotes: `<w:footnote w:id="1">${paragraph("note above")}${imports("rIdNote")}</w:footnote>`,
                imported: { rIdOuter: ["outer.docx", DOCX] },
                others: [
                    ["rIdHeader", "header", "header1.xml"],
                    ["rIdFooter", "footer", "footer1.xml"],
                ],
                otherRelationships: [
                    ["header1.xml", [["rIdHeaderImport", "header.docx"]]],
                    ["footnotes.xml", [["rIdNote", "note.docx"]]],
                ],
            },
            new Map([
                ["word/header.docx", packageOf({ body: paragraph("header imported") })],
                ["word/note.docx", packageOf({ body: paragraph("note imported") })],
                [
                    "word/outer.docx",
                    packageOf(
                        { body: `${paragraph("outer")}${imports("rIdInner")}`, imported: { rIdInner: ["inner.docx", DOCX] } },
                        new Map([["word/inner.docx", packageOf({ body: paragraph("inner") })]]),
                    ),
                ],
            ]),
        );
        // A footer that imports nothing
        const footer = parse(`<w:ftr ${W}>${paragraph("footer")}</w:ftr>`);
        const parts = new Map([...docx.parts, ["word/header1.xml", header], ["word/footer1.xml", footer]]);
        const content = readDocx(parts, docx.binaryParts, {}, docx.importedDocuments);
        expect(content.sections[0].headers.default!.map(textOf)).to.deep.equal(["header above", "header imported"]);
        expect(content.sections[0].footers.default!.map(textOf)).to.deep.equal(["footer"]);
        expect([...content.footnotes.values()].map((blocks) => blocks.map(textOf))).to.deep.equal([["note above", "note imported"]]);
        expect(textsOf(content)).to.deep.equal(["1", "outer", "inner"]);
    });

    it("should find an imported .docx whose relationship's target has backslashes, as patchDocument reads it", () => {
        // patchDocument reads the .docx at the target with slashes, as other tools write backslashes in targets
        const docx = packageOf(
            { body: `${imports("rIdImport")}${SECTION}`, imported: { rIdImport: ["sub\\imported.docx", DOCX] } },
            new Map([["word/sub/imported.docx", packageOf({ body: paragraph("imported") })]]),
        );
        expect(textsOf(readDocx(docx.parts, docx.binaryParts, {}, docx.importedDocuments))).to.deep.equal(["imported"]);
    });

    describe("what it stops at", () => {
        /** Why a document importing one stops, with the content type given, and where */
        const stopOf = (
            imported: Parts | undefined,
            contentType?: string,
            target = "imported.docx",
            element = imports("rIdImport"),
        ): readonly (string | undefined)[] => {
            const content = read(
                { body: `${paragraph("before")}${element}${SECTION}`, imported: { rIdImport: [target, contentType] } },
                imported === undefined ? {} : { [target.replace(/\.docx$/, "")]: imported },
            );
            return content.blocks.map(({ block }) => (block.type === "paragraph" ? block.unsupported : undefined));
        };

        it("should stop at an imported document of several sections, which Word lays out in ways not yet followed (AC4b)", () => {
            expect(stopOf({ body: `${paragraph("first", "<w:sectPr/>")}${paragraph("second")}${SECTION}` }, DOCX)).to.deep.equal([
                undefined,
                "an imported document of several sections",
            ]);
            expect(stopOf({ body: `${paragraph("first", "<w:sectPr/>")}${paragraph("second")}` }, DOCX)).to.deep.equal([
                undefined,
                "an imported document of several sections",
            ]);
        });

        it("should stop at a page reference or number of pages in an imported document, whose number docx can't write in it", () => {
            const field = (instruction: string): string =>
                `<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve">${instruction}</w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
            const stop = "a page reference or number of pages in an imported document";
            expect(stopOf({ body: field(" PAGEREF _Toc1 \\h ") }, DOCX)[1]).to.equal(stop);
            expect(stopOf({ body: '<w:p><w:fldSimple w:instr="NUMPAGES"/></w:p>' }, DOCX)[1]).to.equal(stop);
            expect(
                stopOf({ body: paragraph("text"), footnotes: `<w:footnote w:id="1">${field("SECTIONPAGES")}</w:footnote>` }, DOCX)[1],
            ).to.equal(stop);
            expect(
                stopOf({ body: paragraph("text"), endnotes: `<w:endnote w:id="1">${field("SECTIONPAGES")}</w:endnote>` }, DOCX)[1],
            ).to.equal(stop);
            // Fields Word works out itself, and others, are laid out as they are
            expect(stopOf({ body: `${field("PAGE")}${'<w:p><w:fldSimple w:instr="AUTHOR"/></w:p>'}` }, DOCX)[1]).to.equal(undefined);
        });

        it("should stop at an imported document in a format Word converts its own way, such as HTML or plain text (AC8)", () => {
            expect(stopOf(undefined, "text/html; charset=utf-8", "page.html")[1]).to.equal("an imported document in HTML");
            expect(stopOf(undefined, undefined, "page.htm")[1]).to.equal("an imported document in HTML");
            expect(stopOf(undefined, "application/rtf", "text.rtf")[1]).to.equal("an imported document in RTF");
            expect(stopOf(undefined, "message/rfc822", "page.mht")[1]).to.equal("an imported document in MHT");
            expect(stopOf(undefined, "text/plain", "text.txt")[1]).to.equal("an imported document in plain text");
            expect(stopOf(undefined, "application/xml", "data.xml")[1]).to.equal("an imported document in XML");
            expect(stopOf(undefined, "application/pdf", "page.pdf")[1]).to.equal("an imported document in a format not yet followed");
            expect(stopOf(undefined, undefined, "unknown.bin")[1]).to.equal("an imported document in a format not yet followed");
        });

        it("should stop at an imported .docx that can't be read, and at one the package doesn't have", () => {
            expect(stopOf(undefined, DOCX)[1]).to.equal("an imported document that can't be read");
            expect(stopOf(undefined, DOCX, "imported.docx", imports("rIdMissing"))[1]).to.equal("an imported document that can't be read");
        });
    });
});
