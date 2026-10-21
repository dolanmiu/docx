// cspell:words MSXML's
import { describe, expect, it } from "vitest";

import { markupOf, outputOf } from "tests/bibliography";

import { copy, element, firstElementBibliography, firstElementCitation, readHtml, textOfHtml } from "./iso-690-family";
import type { StyleDefinition } from "./style";

/** The style a variant of the family writes */
const styleOf = (variant: "GB7714" | "ISO 690"): StyleDefinition => ({
    name: variant,
    file: "",
    version: "",
    citation: firstElementCitation(variant),
    bibliography: firstElementBibliography(variant),
});

// Sources none of the corpora have: listed by a conductor, a producer and a compiler, and a work of art with a publisher
// but no place. What the styles write for them is what Word's own styles write when they're run with libxslt
const corpus = {
    sources: [
        { tag: "Conductor", type: "soundRecording", conductors: [{ lastName: "Cond", firstName: "Flo" }], title: "Song", year: "2001" },
        { tag: "Producer", type: "film", producers: [{ lastName: "Prod", firstName: "Olga" }], title: "Movie", year: "2002" },
        { tag: "Compiler", type: "miscellaneous", compilers: [{ lastName: "Comp", firstName: "Di" }], title: "Notes", year: "2003" },
        { tag: "Painting", type: "art", title: "Painting", year: "2004", publisher: "Museum Press" },
    ],
    citations: [
        [{ source: "Conductor", pages: "5", hideAuthor: true, hideYear: true }],
        [{ source: "Painting", volume: "2", hideAuthor: true, hideYear: true }],
        [{ source: "Compiler" }],
    ],
} as const;

// Sources that show where GB7714's templates differ from ISO 690's, as Word's styles write them when run with libxslt
const differences = {
    sources: [
        { tag: "Page", type: "website", title: "Page", productionCompany: "Studio", url: "https://example.com/p" },
        { tag: "Brief", type: "report", year: "2005", city: "Paris", publisher: "Press", productionCompany: "Studio" },
        { tag: "U1", type: "book", title: "Untitled" },
        { tag: "Lee", type: "book", authors: [{ lastName: "Lee", firstName: "Ann", middleName: "Kay" }], title: "Ovens", year: "2006" },
    ],
    citations: [[{ source: "U1" }], [{ source: "Lee" }], [{ source: "Brief" }]],
} as const;

describe("readHtml", () => {
    it("collapses each run of spaces into one, with none at the start of a paragraph", () => {
        expect(readHtml([[" Pizza   and\n basil "]]).map(markupOf)).toEqual(["Pizza and basil "]);
    });

    it("writes a space between an element and the element after it, as Word reads MSXML's line break", () => {
        expect(readHtml([[element("b", "Baker."), element("i", "Pizza.")]]).map(markupOf)).toEqual(["<b>Baker.</b> <i>Pizza.</i>"]);
    });

    it("writes a space at the end of a copy of a variable between an element and the end of the paragraph", () => {
        expect(readHtml([["Paris. ", copy(element("i", "Pizza."))]]).map(markupOf)).toEqual(["Paris. <i>Pizza.</i> "]);
    });

    it("leaves the formatting of a copied element with nothing in it on, for the rest of the bibliography", () => {
        expect(readHtml([[copy(element("b", copy()), "Pizza.")], ["Basil."]]).map(markupOf)).toEqual(["<b>Pizza.</b>", "<b>Basil.</b>"]);
    });

    it("ends the formatting of a copied element with an empty xsl:value-of in it", () => {
        expect(readHtml([[copy(element("i", { value: "" }), "Pizza.")]]).map(markupOf)).toEqual(["Pizza."]);
    });
});

describe("textOfHtml", () => {
    it("is the text of what a style writes, as its string value", () => {
        expect(textOfHtml(["Pizza", { value: " and" }, copy(element("i", " basil"))])).toEqual("Pizza and basil");
    });
});

describe("the ISO 690 family", () => {
    describe.each(["GB7714", "ISO 690"] as const)("%s", (variant) => {
        it("cites pages or a volume alone when the author and year are left out", () => {
            expect(outputOf(styleOf(variant), corpus).citations).toEqual(["(p. 5)", "(vol. 2)", "(Comp, 2003)"]);
        });

        it("names a source's conductor, producer or compiler, as what they are, when they're who it is listed by", () => {
            expect(outputOf(styleOf(variant), corpus).bibliography).toEqual({
                hangingIndent: false,
                paragraphs: [
                    "<b>Comp, Di, [comp.]. 2003.</b> Notes. 2003.",
                    "<b>Cond, Flo, [cond.]. 2001.</b> Song. 2001.",
                    "<b>2004.</b> <i>Painting. </i>s.l. : Museum Press, 2004.",
                    "<b>Prod, Olga, [prod.]. 2002.</b> <i>Movie. </i>2002.",
                ],
            });
        });

        it("writes a website with a production company, and a report with one, as the other style does", () => {
            // GB7714 writes a space after them by different fields than ISO 690, which Word reads as one space
            expect(outputOf(styleOf(variant), differences).bibliography).toEqual({
                hangingIndent: false,
                paragraphs: [
                    "<b>2005.</b> Paris : Press, 2005.",
                    "<b>Lee, Ann Kay. 2006.</b> <i>Ovens. </i>2006.",
                    "Page. [Online] Studio. https://example.com/p.",
                    "<i>Untitled. </i>",
                ],
            });
        });
    });

    it("cites a source by its tag in GB7714 when it has no author or year, though it has a title", () => {
        expect(outputOf(styleOf("GB7714"), differences).citations).toEqual(["(U1)", "(Lee, 2006)", "(2005)"]);
    });

    it("cites a source with a title, but no author or year, by nothing in ISO 690", () => {
        expect(outputOf(styleOf("ISO 690"), differences).citations).toEqual(["()", "(Lee, 2006)", "(2005)"]);
    });
});
