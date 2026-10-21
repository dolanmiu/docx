import { describe, expect, it } from "vitest";

import { Document, Paragraph, Run, TextRun } from "docx";
import { testStyle, xmlOf } from "tests/bibliography";

import { Citation, citationInstructionOf } from "./citation";
import { BibliographySources } from "./document-sources";
import type { Source } from "./source";
import type { StyleDefinition } from "./styles/style";

const SOURCES: readonly Source[] = [
    { tag: "A", type: "book", title: "One" },
    { tag: "B", type: "book", title: "Two" },
];

const documentWith = (citation: Citation, style: StyleDefinition = testStyle()): Document =>
    new Document({
        bibliography: { sources: new BibliographySources(style, SOURCES) },
        sections: [{ children: [new Paragraph({ children: [citation] })] }],
    });

const field = (instruction: string, result: string): string =>
    `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve">${instruction}</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>${result}<w:r><w:fldChar w:fldCharType="end"/></w:r>`;

describe("Citation", () => {
    it("is a run, so a paragraph takes it", () => {
        expect(new Citation("A")).to.be.instanceOf(Run);
    });

    it("is written as Word's citation content control, with a CITATION field whose result is the citation in the document's style", () => {
        const citation = new Citation("A");

        expect(xmlOf(new Paragraph({ children: [new TextRun("See "), citation] }), documentWith(citation))).to.equal(
            `<w:p><w:r><w:t xml:space="preserve">See </w:t></w:r><w:sdt><w:sdtPr><w:citation/></w:sdtPr><w:sdtContent>${field(
                " CITATION A \\l 1033 ",
                '<w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">(A)</w:t></w:r>',
            )}</w:sdtContent></w:sdt></w:p>`,
        );
    });

    it("cites several sources, each with how it is cited", () => {
        const citation = new Citation(["A", { source: "B", pages: "5" }]);

        expect(xmlOf(citation.writtenAs[0], documentWith(citation))).to.contain(
            field(
                " CITATION A \\l 1033  \\m B \\p &quot;5&quot; ",
                '<w:r><w:rPr><w:noProof/></w:rPr><w:t xml:space="preserve">(A; B, p. 5)</w:t></w:r>',
            ),
        );
    });

    it("cites a source with how it is cited", () => {
        const citation = new Citation({ source: "A", hideAuthor: true });

        expect(xmlOf(citation.writtenAs[0], documentWith(citation))).to.contain('<w:t xml:space="preserve">(A, no author)</w:t>');
    });

    it("writes the result's formatting and line breaks", () => {
        const citation = new Citation("A");
        const style: StyleDefinition = {
            ...testStyle(),
            citation: () => [
                { text: "Bold", bold: true },
                { text: "Italic", italics: true },
                { text: "", lineBreak: true },
                { text: "Underlined", underline: true },
            ],
        };

        expect(xmlOf(citation.writtenAs[0], documentWith(citation, style))).to.contain(
            '<w:r><w:rPr><w:b/><w:bCs/><w:noProof/></w:rPr><w:t xml:space="preserve">Bold</w:t></w:r>' +
                '<w:r><w:rPr><w:i/><w:iCs/><w:noProof/></w:rPr><w:t xml:space="preserve">Italic</w:t></w:r>' +
                "<w:r><w:rPr><w:noProof/></w:rPr><w:br/></w:r>" +
                '<w:r><w:rPr><w:noProof/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">Underlined</w:t></w:r>',
        );
    });

    it("throws for no source", () => {
        expect(() => new Citation([])).toThrow('A citation cites no source. Give it the tag of the source it cites, such as "Dic06"');
    });

    it("throws when it is written in a document with no sources", () => {
        const citation = new Citation("A");

        expect(() => xmlOf(citation.writtenAs[0], new Document({ sections: [] }))).toThrow("needs the document's sources");
    });
});

describe("citationInstructionOf", () => {
    it("writes each switch of a source, in quotes, with the language after the first source's", () => {
        expect(
            citationInstructionOf([
                {
                    source: "A",
                    prefix: "see ",
                    suffix: " (n. 2)",
                    pages: "1, 5",
                    volume: "2",
                    hideAuthor: true,
                    hideYear: true,
                    hideTitle: true,
                },
                { source: "B", volume: "3" },
            ]),
        ).to.equal(' CITATION A \\f "see " \\s " (n. 2)" \\p "1, 5" \\v "2" \\n \\y \\t \\l 1033  \\m B \\v "3" ');
    });

    it("escapes quotes and backslashes in a switch, and puts a tag with a space in quotes", () => {
        expect(citationInstructionOf([{ source: 'A "B"', prefix: 'see "this" \\ ' }])).to.equal(
            ' CITATION "A \\"B\\"" \\f "see \\"this\\" \\\\ " \\l 1033 ',
        );
    });
});
