// cspell:words Nmerical
import { describe, expect, it } from "vitest";

import { describeWordOutput, outputOf } from "tests/bibliography";

import expected from "./fixtures/iso-690-numerical-reference.json";
import { iso690NumericalReference } from "./iso-690-numerical-reference";

// Sources none of the corpora have: listed by a conductor, a producer and a compiler, and a work of art with a publisher
// but no place. What the style writes for them is what Word's own style writes when it's run with libxslt, but for the
// compiler's notes, a miscellaneous source with no publication: libxslt reads its empty <i> as one that leaves italics
// on for the rest of the bibliography, which Word doesn't, as its own bibliography of corpus b's "A Flyer" shows
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

describe("iso690NumericalReference", () => {
    it("is Word's ISO 690 by numerical reference", () => {
        expect(iso690NumericalReference).toMatchObject({
            name: "ISO 690 - Numerical Reference",
            file: "ISO690Nmerical.XSL",
            version: "1987",
        });
    });

    describeWordOutput(iso690NumericalReference, expected);

    it("cites a source by its number, with the pages or volume cited after it", () => {
        expect(outputOf(iso690NumericalReference, corpus).citations).toEqual(["(1 p. 5)", "(2 vol. 2)", "(3)"]);
    });

    it("leaves the rest of the bibliography bold after an entry whose bold has nothing in it", () => {
        expect(outputOf(iso690NumericalReference, corpus).bibliography).toEqual({
            hangingIndent: false,
            paragraphs: [
                "1. <b>Cond, Flo, [cond.].</b> Song. 2001.",
                "2. <b><i>Painting. </i></b><b>s.l. : Museum Press, 2004.</b>",
                "<b>3. Comp, Di, [comp.]. Notes. 2003.</b>",
                "<b>4. Prod, Olga, [prod.]. </b><b><i>Movie. </i></b><b>2002.</b>",
            ],
        });
    });
});
