import { describe, expect, it } from "vitest";

import { describeWordOutput, markupOf } from "tests/bibliography";

import expected from "./fixtures/gost-name-sort.json";
import { gostNameSort } from "./gost-name-sort";
import { formatCitation } from "../format";
import { wordSourceOf } from "../word-source";

describe("gostNameSort", () => {
    describeWordOutput(gostNameSort, expected);

    // Expected values from Word's style, run with libxslt and Word's English wording
    it("writes the pages or volume cited on their own, with the author and the year left out", () => {
        const sources = [wordSourceOf({ tag: "Bk", type: "book", authors: [{ lastName: "Lee", firstName: "Ann" }], year: 2001 }, 1)];
        expect(markupOf(formatCitation(gostNameSort, sources, [{ source: "Bk", hideAuthor: true, hideYear: true, pages: "5" }]))).toBe(
            "(p. 5)",
        );
        expect(markupOf(formatCitation(gostNameSort, sources, [{ source: "Bk", hideAuthor: true, hideYear: true, volume: "2" }]))).toBe(
            "(vol. 2)",
        );
    });
});
