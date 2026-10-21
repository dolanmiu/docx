import { describe, expect, it } from "vitest";

import { Document, FileChild } from "docx";
import { testStyle, xmlOf } from "tests/bibliography";

import { Bibliography } from "./bibliography";
import { BibliographySources } from "./document-sources";
import type { Source } from "./source";
import type { StyleDefinition } from "./styles/style";

const SOURCES: readonly Source[] = [
    { tag: "B", type: "book", title: "Two" },
    { tag: "A", type: "book", title: "One" },
];

const documentWith = (sources: readonly Source[], style: StyleDefinition = testStyle()): Document =>
    new Document({ bibliography: { sources: new BibliographySources(style, sources) }, sections: [] });

const FIELD_START =
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' +
    '<w:r><w:instrText xml:space="preserve"> BIBLIOGRAPHY </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>';

const FIELD_END = '<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>';

const PARAGRAPH = '<w:pPr><w:pStyle w:val="Bibliography"/><w:ind w:left="720" w:hanging="720"/><w:rPr><w:noProof/></w:rPr></w:pPr>';

describe("Bibliography", () => {
    it("is a block, so a section takes it", () => {
        expect(new Bibliography()).to.be.instanceOf(FileChild);
    });

    it("is written as Word's bibliography content control, with a BIBLIOGRAPHY field whose result is each source in the document's style", () => {
        expect(xmlOf(new Bibliography(), documentWith(SOURCES))).to.equal(
            "<w:sdt><w:sdtPr><w:bibliography/></w:sdtPr><w:sdtContent>" +
                `<w:p>${PARAGRAPH}${FIELD_START}<w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">A </w:t></w:r>` +
                '<w:r><w:rPr><w:i/><w:iCs/><w:noProof/></w:rPr><w:t xml:space="preserve">One</w:t></w:r><w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>' +
                `<w:p>${PARAGRAPH}<w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">B </w:t></w:r>` +
                '<w:r><w:rPr><w:i/><w:iCs/><w:noProof/></w:rPr><w:t xml:space="preserve">Two</w:t></w:r><w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p>' +
                `${FIELD_END}</w:sdtContent></w:sdt>`,
        );
    });

    it("writes a title above it as Word's built-in bibliographies do, as a Heading 1, in a content control of Word's Bibliographies gallery", () => {
        const xml = xmlOf(new Bibliography({ title: "References" }), documentWith(SOURCES));

        expect(xml).to.match(
            new RegExp(
                '^<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Bibliographies"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent>' +
                    '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">References</w:t></w:r></w:p>' +
                    "<w:sdt><w:sdtPr><w:bibliography/></w:sdtPr>.*</w:sdt></w:sdtContent></w:sdt>$",
            ),
        );
    });

    it("writes paragraphs with no indent for a style whose entries have none", () => {
        const style: StyleDefinition = {
            ...testStyle(),
            bibliography: () => ({ paragraphs: [[{ text: "Entry" }]], hangingIndent: false }),
        };

        expect(xmlOf(new Bibliography(), documentWith(SOURCES, style))).to.contain(
            `<w:p><w:pPr><w:pStyle w:val="Bibliography"/><w:rPr><w:noProof/></w:rPr></w:pPr>${FIELD_START}<w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">Entry</w:t></w:r></w:p>`,
        );
    });

    it("writes a table of each source's number and entry as Word writes IEEE's", () => {
        const row = (tag: string, order: number, title: string): string =>
            `<w:tr><w:trPr><w:tblCellSpacing w:w="15" w:type="dxa"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="50" w:type="pct"/><w:hideMark/></w:tcPr><w:p><w:pPr><w:pStyle w:val="Bibliography"/><w:rPr><w:noProof/></w:rPr></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">[${order}] </w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/><w:hideMark/></w:tcPr><w:p><w:pPr><w:pStyle w:val="Bibliography"/><w:rPr><w:noProof/></w:rPr></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">${tag} </w:t></w:r><w:r><w:rPr><w:i/><w:iCs/><w:noProof/></w:rPr><w:t xml:space="preserve">${title}</w:t></w:r><w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve"> </w:t></w:r></w:p></w:tc></w:tr>`;

        expect(xmlOf(new Bibliography(), documentWith(SOURCES, testStyle("rows")))).to.equal(
            `<w:sdt><w:sdtPr><w:bibliography/></w:sdtPr><w:sdtContent><w:p><w:pPr><w:rPr><w:noProof/></w:rPr></w:pPr>${FIELD_START}</w:p>` +
                "<w:tbl><w:tblPr>" +
                '<w:tblW w:w="5000" w:type="pct"/><w:tblCellSpacing w:w="15" w:type="dxa"/>' +
                '<w:tblCellMar><w:top w:w="15" w:type="dxa"/><w:left w:w="15" w:type="dxa"/><w:bottom w:w="15" w:type="dxa"/><w:right w:w="15" w:type="dxa"/></w:tblCellMar>' +
                '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>' +
                '</w:tblPr><w:tblGrid><w:gridCol w:w="409"/><w:gridCol w:w="8617"/></w:tblGrid>' +
                `${row("A", 2, "One")}${row("B", 1, "Two")}</w:tbl><w:p><w:pPr><w:rPr><w:noProof/></w:rPr></w:pPr></w:p>${FIELD_END}</w:sdtContent></w:sdt>`,
        );
    });

    it("writes what Word does for a document with no sources: what it says, in bold, in one paragraph with the field", () => {
        expect(xmlOf(new Bibliography(), documentWith([]))).to.equal(
            `<w:sdt><w:sdtPr><w:bibliography/></w:sdtPr><w:sdtContent><w:p>${FIELD_START}` +
                '<w:r><w:rPr><w:b/><w:bCs/><w:noProof/></w:rPr><w:t xml:space="preserve">Invalid source specified.</w:t></w:r>' +
                '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>',
        );
    });

    it("throws when it is written in a document with no sources", () => {
        expect(() => xmlOf(new Bibliography(), new Document({ sections: [] }))).toThrow("needs the document's sources");
    });
});
