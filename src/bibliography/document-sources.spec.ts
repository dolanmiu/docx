import { describe, expect, it } from "vitest";

import {
    Bookmark,
    Document,
    ExternalHyperlink,
    Footer,
    Header,
    type ISectionOptions,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
} from "docx";
import { testStyle, xmlOf } from "tests/bibliography";

import { Citation } from "./citation";
import { BibliographySources, documentSourcesOf } from "./document-sources";
import type { Source } from "./source";

const book = (tag: string, title?: string): Source => ({ tag, type: "book", title });

const fileWith = (sources: readonly Source[], section: Partial<ISectionOptions> = {}, footnotes = {}): Document =>
    new Document({
        bibliography: { sources: new BibliographySources(testStyle(), sources) },
        footnotes,
        sections: [{ children: [], ...section }],
    });

const orderIn = (file: Document): readonly (readonly [string, number])[] =>
    documentSourcesOf({ file, viewWrapper: file.Document, stack: [] }).sources.map(({ tag, order }) => [tag, order] as const);

describe("BibliographySources", () => {
    it("throws for two sources with one tag", () => {
        expect(() => new BibliographySources(testStyle(), [book("A"), book("B"), book("A")])).toThrow(
            'Two of the bibliography\'s sources have the tag "A". Give each source a tag of its own',
        );
    });

    it("throws for a source that Word can't keep", () => {
        expect(() => new BibliographySources(testStyle(), [book("")])).toThrow("A bibliography's source has no tag");
    });

    it("writes the sources as Word does, with its style's file, name and version, and the order they're cited in", () => {
        const file = fileWith([book("A", "One"), book("B")], {
            children: [new Paragraph({ children: [new Citation("B")] })],
        });

        expect(xmlOf(file.Bibliography!.sources, file)).to.equal(
            '<b:Sources SelectedStyle="/TEST.XSL" StyleName="Test" Version="1" xmlns:b="http://schemas.openxmlformats.org/officeDocument/2006/bibliography" xmlns="http://schemas.openxmlformats.org/officeDocument/2006/bibliography">' +
                "<b:Source><b:Tag>A</b:Tag><b:SourceType>Book</b:SourceType><b:Title>One</b:Title><b:RefOrder>2</b:RefOrder></b:Source>" +
                "<b:Source><b:Tag>B</b:Tag><b:SourceType>Book</b:SourceType><b:RefOrder>1</b:RefOrder></b:Source>" +
                "</b:Sources>",
        );
    });
});

describe("documentSourcesOf", () => {
    it("numbers the sources in the order the document cites them, wherever the citations are", () => {
        const file = fileWith(
            [
                book("Body"),
                book("Table"),
                book("Link"),
                book("Bookmark"),
                book("Footnote"),
                book("Header"),
                book("Footer"),
                book("Uncited"),
            ],
            {
                headers: { default: new Header({ children: [new Paragraph({ children: [new Citation("Header")] })] }) },
                footers: { default: new Footer({ children: [new Paragraph({ children: [new Citation("Footer")] })] }) },
                children: [
                    new Paragraph({ children: [new TextRun("Text"), new Citation(["Body", { source: "Body", pages: "2" }])] }),
                    new Table({
                        rows: [
                            new TableRow({
                                children: [new TableCell({ children: [new Paragraph({ children: [new Citation("Table")] })] })],
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new ExternalHyperlink({ link: "https://example.com", children: [new Citation("Link")] }),
                            new Bookmark({ id: "mark", children: [new Citation("Bookmark")] }),
                        ],
                    }),
                ],
            },
            { 1: { children: [new Paragraph({ children: [new Citation("Footnote")] })] } },
        );

        expect(orderIn(file)).to.deep.equal([
            ["Body", 1],
            ["Table", 2],
            ["Link", 3],
            ["Bookmark", 4],
            ["Footnote", 5],
            ["Header", 6],
            ["Footer", 7],
            ["Uncited", 8],
        ]);
    });

    it("works out a document's sources once", () => {
        const file = fileWith([book("A")]);
        const context = { file, viewWrapper: file.Document, stack: [] };

        expect(documentSourcesOf(context)).to.equal(documentSourcesOf(context));
    });

    it("throws for a document with no bibliography", () => {
        const file = new Document({ sections: [] });

        expect(() => documentSourcesOf({ file, viewWrapper: file.Document, stack: [] })).toThrow(
            "A citation or a bibliography needs the document's sources. Give the Document `bibliography: createBibliography({ sources })` from docx/bibliography",
        );
    });

    it("throws for a bibliography that isn't docx/bibliography's", () => {
        const file = new Document({ bibliography: { sources: new Paragraph("Sources") }, sections: [] });

        expect(() => documentSourcesOf({ file, viewWrapper: file.Document, stack: [] })).toThrow("needs the document's sources");
    });
});
