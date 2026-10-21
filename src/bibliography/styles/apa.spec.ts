import { describe, expect, it } from "vitest";

import { type CorpusOutput, describeWordOutput, outputOf } from "tests/bibliography";

import { apa } from "./apa";
import type { CitedSourceOptions } from "../format";
import type { Source } from "../source";
import expected from "./fixtures/apa.json";

// Sources none of the corpora have, which take the style down paths it has for them. What Word's style writes for each
// is from running Word's own XSL with libxslt and Word's English wording, as corpus s is
const CASES: readonly {
    readonly name: string;
    readonly sources: readonly Source[];
    readonly citations: readonly (readonly CitedSourceOptions[])[];
    readonly expected: Required<CorpusOutput>;
}[] = [
    {
        name: "a performance by an organization, with its writer",
        sources: [
            {
                tag: "P1",
                type: "performance",
                writers: [{ lastName: "Nash", firstName: "Leo" }],
                corporatePerformer: "The Ovens",
                title: "Opera",
                year: "2012",
            },
        ],
        citations: [[{ source: "P1" }]],
        expected: {
            citations: ["(Nash, 2012)"],
            bibliography: { hangingIndent: true, paragraphs: ["Nash, L. (2012). <i>Opera.</i> (The Ovens, Performer)"] },
        },
    },
    {
        name: "a film with several producers, writers and directors",
        sources: [
            {
                tag: "F1",
                type: "film",
                directors: [
                    { lastName: "Cruz", firstName: "Pedro" },
                    { lastName: "Fox", firstName: "Nick" },
                ],
                producers: [
                    { lastName: "Webb", firstName: "Lou" },
                    { lastName: "Hart", firstName: "Sue" },
                ],
                writers: [
                    { lastName: "Ortiz", firstName: "Raul" },
                    { lastName: "Lane", firstName: "Mia" },
                ],
                title: "Deep Dish",
                year: "2011",
            },
        ],
        citations: [[{ source: "F1" }]],
        expected: {
            citations: ["(Webb &amp; Hart, 2011)"],
            bibliography: {
                hangingIndent: true,
                paragraphs: [
                    "Webb, L., Hart, S. (Producers), Ortiz, R., Lane, M. (Writers), Cruz, P., &amp; Fox, N. (Directors). (2011). <i>Deep Dish</i> [Motion Picture].",
                ],
            },
        },
    },
    {
        name: "a film with a title and nobody who made it",
        sources: [{ tag: "F2", type: "film", performers: [{ lastName: "Banks", firstName: "Amy" }], title: "Deep Dish", year: "2011" }],
        citations: [[{ source: "F2" }]],
        expected: {
            citations: ["(Deep Dish, 2011)"],
            bibliography: { hangingIndent: true, paragraphs: ["<i>Deep Dish</i> (2011). [Motion Picture]."] },
        },
    },
    {
        name: "a website read on a date, with no name or address",
        sources: [{ tag: "W1", type: "website", title: "Page", yearAccessed: "2022", monthAccessed: "May", dayAccessed: "3" }],
        citations: [[{ source: "W1" }]],
        expected: {
            citations: ["(Page, n.d.)"],
            bibliography: { hangingIndent: true, paragraphs: ["<i>Page</i>. (n.d.). Retrieved May 3, 2022"] },
        },
    },
    {
        name: "a citation of pages alone",
        sources: [{ tag: "B1", type: "book", authors: [{ lastName: "Baker", firstName: "Anna" }], title: "Pizza", year: "2010" }],
        citations: [
            [{ source: "B1", pages: "5", hideAuthor: true, hideYear: true, hideTitle: true }],
            [{ source: "B1", volume: "2-3", hideAuthor: true, hideYear: true, hideTitle: true }],
        ],
        expected: {
            citations: ["(p. 5)", "(vols. 2-3)"],
            bibliography: { hangingIndent: true, paragraphs: ["Baker, A. (2010). <i>Pizza.</i> "] },
        },
    },
    {
        name: "books in several volumes",
        sources: [
            { tag: "B2", type: "book", authors: [{ lastName: "Baker", firstName: "Anna" }], title: "Pizza", year: "2010", volume: "2-3" },
            { tag: "B3", type: "book", authors: [{ lastName: "Baker", firstName: "Anna" }], title: "Bread", year: "2011", volume: "2, 4" },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: {
                hangingIndent: true,
                paragraphs: ["Baker, A. (2010). <i>Pizza</i> (Vols. 2-3).", "Baker, A. (2011). <i>Bread</i> (Vols. 2, 4)."],
            },
        },
    },
    {
        name: "a performance with several directors and no writer",
        sources: [
            {
                tag: "P2",
                type: "performance",
                directors: [
                    { lastName: "Page", firstName: "Tim" },
                    { lastName: "Holt", firstName: "Eve" },
                ],
                title: "Opera",
                year: "2012",
            },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: { hangingIndent: true, paragraphs: ["Page, T., &amp; Holt, E. (Directors). (2012). <i>Opera.</i> "] },
        },
    },
    {
        name: "book sections with a volume or pages and nothing else of the book",
        sources: [
            {
                tag: "S1",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                title: "Starters",
                bookTitle: "Menus",
                year: "2023",
                volume: "2",
            },
            {
                tag: "S2",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                title: "Mains",
                bookTitle: "Menus",
                year: "2024",
                volume: "2-3",
            },
            {
                tag: "S3",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                title: "Desserts",
                bookTitle: "Menus",
                year: "2025",
                pages: "5",
            },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: {
                hangingIndent: true,
                paragraphs: [
                    "Fox, A. (2023). Starters. In <i>Menus</i> (Vol. 2).",
                    "Fox, A. (2024). Mains. In <i>Menus</i> (Vols. 2-3).",
                    "Fox, A. (2025). Desserts. In <i>Menus</i> (p. 5).",
                ],
            },
        },
    },
    {
        name: "conference proceedings with no authors or editors",
        sources: [
            {
                tag: "C1",
                type: "conferenceProceedings",
                title: "Ovens",
                conferenceName: "Bake Con",
                year: "2017",
                city: "Milan",
                publisher: "IPC",
                volume: "1",
            },
            {
                tag: "C2",
                type: "conferenceProceedings",
                title: "Ovens",
                conferenceName: "Bake Con",
                year: "2017",
                city: "Milan",
                volume: "1",
                pages: "5-9",
            },
            { tag: "C3", type: "conferenceProceedings", conferenceName: "Bake Con", publisher: "IPC", pages: "5-9" },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: {
                hangingIndent: true,
                paragraphs: [
                    "(n.d.). <i>Bake Con</i> (pp. 5-9). IPC.",
                    "Ovens. (2017). <i>Bake Con.</i> <i>1.</i> Milan: IPC.",
                    "Ovens. (2017). <i>Bake Con</i>, <i>1</i>, pp. 5-9. Milan.",
                ],
            },
        },
    },
    {
        name: "a case with a court alone",
        sources: [{ tag: "K1", type: "case", court: "Supreme Court" }],
        citations: [],
        expected: { citations: [], bibliography: { hangingIndent: true, paragraphs: ["(Supreme Court)."] } },
    },
    {
        name: "art with a publication's title alone, and with an institution alone",
        sources: [
            { tag: "A1", type: "art", publicationTitle: "Food in Art" },
            { tag: "A2", type: "art", city: "Seville", institution: "Museum of Food" },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: { hangingIndent: true, paragraphs: ["(n.d.).<i>Food in Art.</i> ", "(n.d.).Museum of Food, Seville."] },
        },
    },
];

describe("apa", () => {
    describeWordOutput(apa, expected);

    for (const { name, sources, citations, expected: output } of CASES) {
        it(`writes ${name} as Word does`, () => {
            expect(outputOf(apa, { sources, citations })).toEqual(output);
        });
    }

    it("names Word's style", () => {
        expect(apa).toMatchObject({ name: "APA", file: "APASixthEditionOfficeOnline.xsl", version: "6" });
    });
});
