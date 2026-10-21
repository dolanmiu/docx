import { describe, expect, it } from "vitest";

import { Document, Paragraph } from "docx";
import { xmlOf } from "tests/bibliography";

import { Citation } from "./citation";
import { CitationStyle, STYLE_DEFINITIONS } from "./citation-style";
import { createBibliography } from "./create-bibliography";
import { BibliographySources } from "./document-sources";
import type { Source } from "./source";

const BOOK: Source = {
    tag: "Bak10",
    type: "book",
    authors: [{ lastName: "Baker", firstName: "Anna" }],
    title: "The Art of Pizza",
    year: 2010,
    city: "Naples",
    publisher: "Oven Press",
};

describe("createBibliography", () => {
    it("writes the sources in APA, Word's default style, when no style is given", () => {
        const bibliography = createBibliography({ sources: [BOOK] });

        expect(bibliography.sources).to.be.instanceOf(BibliographySources);
        expect((bibliography.sources as BibliographySources).style).to.equal(STYLE_DEFINITIONS.apa);
    });

    it("writes the sources in the style given", () => {
        const citation = new Citation("Bak10");
        const doc = new Document({
            bibliography: createBibliography({ style: CitationStyle.IEEE, sources: [BOOK] }),
            sections: [{ children: [new Paragraph({ children: [citation] })] }],
        });

        expect(xmlOf(citation.writtenAs[0], doc)).to.contain('<w:t xml:space="preserve">[1]</w:t>');
        expect(xmlOf(doc.Bibliography!.sources, doc)).to.contain(
            '<b:Sources SelectedStyle="/IEEE2006OfficeOnline.xsl" StyleName="IEEE" Version="2006"',
        );
    });

    it("has a definition for each style", () => {
        expect(Object.keys(STYLE_DEFINITIONS).sort()).to.deep.equal(Object.values(CitationStyle).sort());
    });

    it("throws for a style that isn't one of CitationStyle's", () => {
        expect(() => createBibliography({ style: "harvard" as "harvardAnglia", sources: [BOOK] })).toThrow(
            "\"harvard\" isn't a style of citation. Give one of CitationStyle's, such as CitationStyle.APA",
        );
    });

    it("throws for the name of a property every object has, which isn't a style", () => {
        expect(() => createBibliography({ style: "toString" as "apa", sources: [BOOK] })).toThrow('"toString" isn\'t a style of citation');
        expect(() => createBibliography({ style: "__proto__" as "apa", sources: [BOOK] })).toThrow(
            '"__proto__" isn\'t a style of citation',
        );
    });

    it("throws for two sources with one tag", () => {
        expect(() => createBibliography({ sources: [BOOK, BOOK] })).toThrow('Two of the bibliography\'s sources have the tag "Bak10"');
    });
});
