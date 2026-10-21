import { describe, expect, it } from "vitest";

import { describeWordOutput, markupOf } from "tests/bibliography";

import expected from "./fixtures/gost-title-sort.json";
import { gostNameSort } from "./gost-name-sort";
import { gostTitleSort } from "./gost-title-sort";
import { formatBibliography } from "../format";
import type { Source } from "../source";
import type { FormattedBibliography } from "./style";
import { wordSourceOf } from "../word-source";

const paragraphsOf = (bibliography: FormattedBibliography): readonly string[] =>
    "paragraphs" in bibliography ? bibliography.paragraphs.map(markupOf) : [];

describe("gostTitleSort", () => {
    describeWordOutput(gostTitleSort, expected);

    // Expected values from Word's styles, run with libxslt and Word's English wording
    describe("where its template differs from GOST - Name Sort's", () => {
        const sources: readonly Source[] = [
            { tag: "Iv", type: "interview", title: "Talk", translators: [{ lastName: "Ross", firstName: "Bob" }], year: 2001 },
            { tag: "Bs", type: "bookSection", corporateAuthor: "Board", title: "Part", bookTitle: "Whole", year: 2002 },
        ];
        const wordSources = sources.map((source, index) => wordSourceOf(source, index + 1));

        it("leaves out an interview's translators when it has no one else responsible for it", () => {
            expect(paragraphsOf(formatBibliography(gostTitleSort, wordSources))).toContain("<b>Talk</b> [Interview].\u00a0- 2001.");
            expect(paragraphsOf(formatBibliography(gostNameSort, wordSources))).toContain(
                "Talk [Interview]\u00a0/ trans. Ross Bob.\u00a0- 2001.",
            );
        });

        it("counts an organization as a book section's author", () => {
            expect(paragraphsOf(formatBibliography(gostTitleSort, wordSources))).toContain(
                "<b>Part</b> [Book Section]\u00a0/ auth. Board\u00a0// Whole.\u00a0- 2002.",
            );
            expect(paragraphsOf(formatBibliography(gostNameSort, wordSources))).toContain(
                "<b>Board</b> Part [Book Section]\u00a0// Whole.\u00a0- 2002.",
            );
        });
    });
});
