import { describe, expect, it } from "vitest";

import { markupOf, testStyle } from "tests/bibliography";

import { type CitedSourceOptions, citationOrderOf, formatBibliography, formatCitation } from "./format";
import type { Person, Source } from "./source";
import { wordSourceOf } from "./word-source";

const person = (lastName: string, firstName = "A", middleName?: string): Person => ({ lastName, firstName, middleName });

const book = (tag: string, authors?: readonly Person[], other: Partial<Source> = {}): Source => ({ tag, type: "book", authors, ...other });

/** The citation of the source with the test style, which writes the flags Word works out for it */
const cite = (sources: readonly Source[], cited: CitedSourceOptions | readonly CitedSourceOptions[]): string =>
    markupOf(
        formatCitation(
            testStyle(),
            sources.map((source, index) => wordSourceOf(source, index + 1)),
            Array.isArray(cited) ? cited : [cited as CitedSourceOptions],
        ),
    );

describe("formatCitation", () => {
    it("writes each source of the citation in turn, the first and the last as such", () => {
        const sources = [book("A"), book("B"), book("C")];

        expect(cite(sources, { source: "A" })).to.equal("(A)");
        expect(cite(sources, [{ source: "A" }, { source: "B" }, { source: "C" }])).to.equal("(A; B; C)");
    });

    it("gives the style how each source is cited", () => {
        expect(
            cite([book("A")], {
                source: "A",
                pages: "5",
                volume: "2",
                prefix: "see ",
                suffix: " (n. 2)",
                hideAuthor: true,
                hideYear: true,
                hideTitle: true,
            }),
        ).to.equal("(see A, no author, no year, no title, p. 5, vol. 2 (n. 2))");
    });

    it("reads each source's text as Word reads a style's HTML, without the spaces at its start, and joins them", () => {
        const style = testStyle();
        const sources = [wordSourceOf(book("A"), 1)];

        expect(
            formatCitation({ ...style, citation: (cited) => [{ text: cited.first ? "  (A  1" : " B)  " }] }, sources, [
                { source: "A" },
                { source: "A" },
            ]),
        ).to.deep.equal([{ text: "(A 1B) " }]);
    });

    it("throws for a source that isn't one of the bibliography's", () => {
        expect(() => cite([book("A"), book("B")], { source: "C" })).toThrow(
            'A citation cites the source "C", which isn\'t one of the bibliography\'s sources. Its sources\' tags are "A", "B"',
        );
    });

    describe("what Word works out to tell the source apart", () => {
        it("gives a source's title when another has the same first author, of three or fewer authors", () => {
            const sources = [
                book("A", [person("Lee")]),
                book("B", [person("Lee"), person("Ray")]),
                book("C", [person("Quinn"), person("Lee")]),
            ];

            expect(cite(sources, { source: "A" })).to.equal("(A, repeated, 2 authors)");
            expect(cite(sources, { source: "B" })).to.equal("(B, repeated, 2 authors)");
            expect(cite(sources, { source: "C" })).to.equal("(C)");
        });

        it("compares the first three authors of a source of more than three", () => {
            const four = [person("A"), person("B"), person("C"), person("D")];
            const sources = [
                book("Four", four),
                book("SameThree", [...four.slice(0, 3), person("E")]),
                book("FirstTwo", four.slice(0, 2)),
                book("Other", [person("A"), person("X"), person("Y"), person("Z")]),
            ];

            expect(cite(sources, { source: "Four" })).to.equal("(Four, repeated, 2 authors)");
            expect(cite(sources, { source: "FirstTwo" })).to.equal("(FirstTwo, repeated, 2 authors)");
            expect(cite(sources, { source: "Other" })).to.equal("(Other, 2 authors)");
        });

        it("counts how many authors tell a source apart, from the most it shares with another", () => {
            const sources = [
                book("A", [person("A"), person("B"), person("C"), person("D")]),
                book("B", [person("A"), person("B"), person("X"), person("Y")]),
            ];

            expect(cite(sources, { source: "A" })).to.equal("(A, 3 authors)");
        });

        it("gives initials when another source's first author has the same last name but is someone else", () => {
            const sources = [
                book("A", [person("Lee", "Ann")]),
                book("B", [person("Lee", "Bob")]),
                book("C", [person("Ray"), person("Lee", "Ann")]),
            ];

            expect(cite(sources, { source: "A" })).to.equal("(A, initials)");
            expect(cite(sources, { source: "C" })).to.equal("(C)");
            expect(cite([book("A", [person("Lee", "Ann")]), book("B", [person("Lee", "Ann", "Kay")])], { source: "A" })).to.equal(
                "(A, initials)",
            );
        });

        it("compares the people a type of source is named by", () => {
            const sources: readonly Source[] = [
                book("Book", undefined, { editors: [person("Lee")] }),
                { tag: "Song", type: "soundRecording", conductors: [person("Lee")] },
                { tag: "Film", type: "film", writers: [person("Lee")] },
                { tag: "Case", type: "case", authors: [person("Lee")] },
            ];

            expect(cite(sources, { source: "Book" })).to.equal("(Book, repeated, 2 authors)");
            expect(cite(sources, { source: "Song" })).to.equal("(Song, repeated, 2 authors)");
            expect(cite(sources, { source: "Case" })).to.equal("(Case)");
        });

        it("doesn't compare sources named by an organization, or by nobody", () => {
            const sources = [
                book("A", undefined, { corporateAuthor: "Board" }),
                book("B", undefined, { corporateAuthor: "Board" }),
                book("C"),
            ];

            expect(cite(sources, { source: "A" })).to.equal("(A)");
            expect(cite(sources, { source: "C" })).to.equal("(C)");
        });
    });
});

describe("citationOrderOf", () => {
    it("numbers the sources cited in the order they're first cited, then the others in the order they're listed", () => {
        expect([...citationOrderOf(["A", "B", "C", "D"], ["C", "A", "C", "X"])]).to.deep.equal([
            ["C", 1],
            ["A", 2],
            ["B", 3],
            ["D", 4],
        ]);
    });
});

describe("formatBibliography", () => {
    const sources = [wordSourceOf(book("B", undefined, { title: "  Two " }), 1), wordSourceOf(book("A", undefined, { title: "One" }), 2)];

    it("writes the style's paragraphs, each read as Word reads a style's HTML", () => {
        expect(formatBibliography(testStyle(), sources)).to.deep.equal({
            paragraphs: [
                [{ text: "A " }, { text: "One", italics: true }, { text: " " }],
                [{ text: "B " }, { text: "Two ", italics: true }],
            ],
            hangingIndent: true,
        });
    });

    it("writes the style's table, each cell read as Word reads a style's HTML", () => {
        expect(formatBibliography(testStyle("rows"), sources)).to.deep.equal({
            rows: [
                [[{ text: "[2] " }], [{ text: "A " }, { text: "One", italics: true }, { text: " " }]],
                [[{ text: "[1] " }], [{ text: "B " }, { text: "Two ", italics: true }]],
            ],
        });
    });
});
