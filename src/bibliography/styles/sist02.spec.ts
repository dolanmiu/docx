import { describe, expect, it } from "vitest";

import { describeWordOutput, markupOf } from "tests/bibliography";

import expected from "./fixtures/sist02.json";
import { sist02 } from "./sist02";
import { formatBibliography } from "../format";
import type { Source } from "../source";
import { wordSourceOf } from "../word-source";

const paragraphsOf = (sources: readonly Source[]): readonly string[] => {
    const bibliography = formatBibliography(
        sist02,
        sources.map((source, index) => wordSourceOf(source, index + 1)),
    );
    return "paragraphs" in bibliography ? bibliography.paragraphs.map(markupOf) : [];
};

describe("sist02", () => {
    describeWordOutput(sist02, expected);

    // Expected values from Word's style, run with libxslt and Word's English wording, read as Word reads its HTML
    describe("where Word reads its HTML", () => {
        it("writes a space between two elements that follow each other, even when the first is empty", () => {
            expect(paragraphsOf([{ tag: "Cp", type: "conferenceProceedings", title: "Short Paper", conferenceName: "Bake Con" }])).toEqual([
                "<i>Short Paper．</i> Bake Con．",
            ]);
        });

        // As Word for Mac shows "<b>MoraLuz</b> <i>Bread．</i>" in corpus b, where libxslt's output has a space after it
        it("writes no space at the end of an entry", () => {
            expect(
                paragraphsOf([
                    { tag: "M1", type: "miscellaneous", authors: [{ lastName: "Lee", firstName: "Ann" }] },
                    { tag: "M2", type: "miscellaneous", authors: [{ lastName: "Lee", firstName: "Ann" }] },
                ]),
            ).toEqual(["<b>LeeAnn</b>", "<b>—．</b>"]);
        });
    });

    // Expected values from Word's style, run with libxslt and Word's English wording
    describe("where its template doesn't do what it means to", () => {
        it("writes the date a website was accessed only when it has the day, and then even with no year", () => {
            expect(
                paragraphsOf([
                    { tag: "W1", type: "website", title: "Page One", yearAccessed: 2020, monthAccessed: "May" },
                    { tag: "W2", type: "website", title: "Page Two", dayAccessed: 3 },
                ]),
            ).toEqual(["Page One．[Online]", "Page Two．[Online][Cited: ]"]);
        });

        it("writes a dash for an article's title when the article before has the same title, though its authors differ", () => {
            expect(
                paragraphsOf([
                    { tag: "J1", type: "journalArticle", title: "Same", authors: [{ lastName: "Lee", firstName: "Ann" }], year: 2001 },
                    { tag: "J2", type: "journalArticle", title: "Same", authors: [{ lastName: "Ray", firstName: "Bob" }], year: 2002 },
                ]),
            ).toEqual(["<i>Same．</i> <b>LeeAnn</b>2001．", "<i>—．</i> <b>RayBob</b>2002．"]);
        });
    });
});
