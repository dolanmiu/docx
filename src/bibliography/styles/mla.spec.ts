import { describe, expect, it } from "vitest";

import { type CorpusOutput, describeWordOutput, outputOf } from "tests/bibliography";

import type { CitedSourceOptions } from "../format";
import type { Source } from "../source";
import expected from "./fixtures/mla.json";
import { mla } from "./mla";

// Sources the fixtures don't have, for the style's other branches. What they're written as is what Word's style,
// MLASeventhEditionOfficeOnline.xsl, writes for them when run with libxslt and Word's English wording
const CASES: readonly {
    readonly name: string;
    readonly sources: readonly Source[];
    readonly citations?: readonly (readonly CitedSourceOptions[])[];
    readonly cited?: readonly string[];
    readonly bibliography: CorpusOutput["bibliography"];
}[] = [
    {
        name: "a work of art with nothing to write, as an empty paragraph",
        sources: [{ tag: "T1", type: "art" }],
        bibliography: { hangingIndent: true, paragraphs: [""] },
    },
    {
        name: "an entry that ends with italics, with a space after it unless its medium follows",
        sources: [
            { tag: "T1", type: "art", artists: [{ lastName: "Baker", firstName: "Anna" }], title: "Bread" },
            { tag: "T2", type: "documentFromWebsite", title: "Crusts", websiteName: "Pizza Daily", year: "2019" },
            { tag: "T3", type: "documentFromWebsite", title: "Dough", websiteName: "Pizza Daily", medium: "Web" },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: ["Baker, Anna. <i>Bread</i>.", "“Crusts.” 2019. <i>Pizza Daily.</i> ", "“Dough.” n.d. <i>Pizza Daily.</i> Web."],
        },
    },
    {
        name: "a medium, with and without an address",
        sources: [
            { tag: "T1", type: "website", title: "Ovens", medium: "Web" },
            { tag: "T2", type: "website", title: "Salt", medium: "Web", url: "https://example.com/salt" },
            {
                tag: "T3",
                type: "website",
                title: "Tables",
                yearAccessed: "2020",
                monthAccessed: "May",
                dayAccessed: "3",
                url: "https://example.com/tables",
            },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: [
                "<i>Ovens</i>. n.d. Web.",
                "<i>Salt</i>. n.d. Web. &lt;https://example.com/salt&gt;.",
                "<i>Tables</i>. n.d. 3 May 2020. &lt;https://example.com/tables&gt;.",
            ],
        },
    },
    {
        name: "a dash for the same people as the entry before, even editors named in place of authors, but not in a book section",
        sources: [
            { tag: "T1", type: "book", editors: [{ lastName: "Smith", firstName: "John" }], title: "Apples" },
            { tag: "T2", type: "book", editors: [{ lastName: "Smith", firstName: "John" }], title: "Bread" },
            { tag: "T3", type: "book", authors: [{ lastName: "Lee", firstName: "Ann" }], title: "Cakes" },
            { tag: "T4", type: "bookSection", authors: [{ lastName: "Lee", firstName: "Ann" }], title: "Dough", bookTitle: "Kitchens" },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: [
                "Lee, Ann. <i>Cakes</i>. n.d.",
                "Lee, Ann. “Dough.” <i>Kitchens</i>. n.d.",
                "Smith, John, ed. <i>Apples</i>. n.d.",
                "—. <i>Bread</i>. Ed. John Smith. n.d.",
            ],
        },
    },
    {
        name: "performers that are an organization, without the word for their role",
        sources: [
            {
                tag: "T1",
                type: "performance",
                corporatePerformer: "The Players",
                title: "Hamlet",
                year: "1999",
                city: "London",
                theater: "Globe",
            },
            {
                tag: "T2",
                type: "film",
                directors: [{ lastName: "Gray", firstName: "Tom" }],
                corporatePerformer: "The Players",
                title: "Storm",
                distributor: "Studio",
            },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: ["<i>Hamlet</i>. The Players. Globe, London. 1999.", "<i>Storm</i>. Dir. Tom Gray. The Players. Studio, n.d."],
        },
    },
    {
        name: "sound recordings named by their composers, with no space before the producer after the album alone",
        sources: [
            {
                tag: "T1",
                type: "soundRecording",
                composers: [{ lastName: "Moss", firstName: "Eve" }],
                producers: [{ lastName: "Lee", firstName: "Ann" }],
                albumTitle: "Songs",
            },
            {
                tag: "T2",
                type: "soundRecording",
                producers: [{ lastName: "Lee", firstName: "Ann" }],
                albumTitle: "Tunes",
                year: "2001",
                city: "Leeds",
            },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: ["<i>Tunes</i>.Prod. Ann Lee. Leeds, 2001.", "Moss, Eve. <i>Songs</i>. Prod. Ann Lee. n.d."],
        },
    },
    {
        name: "a conference paper named by its editors, and one with its editors after its authors",
        sources: [
            {
                tag: "T1",
                type: "conferenceProceedings",
                editors: [
                    { lastName: "Patel", firstName: "Ravi" },
                    { lastName: "Jones", firstName: "Mary" },
                ],
                title: "Heat",
                conferenceName: "Pizza Summit",
                year: "2010",
                city: "Naples",
                publisher: "Press",
                pages: "4-9",
            },
            {
                tag: "T2",
                type: "conferenceProceedings",
                authors: [{ lastName: "Moss", firstName: "Eve" }],
                editors: [{ lastName: "Patel", firstName: "Ravi" }],
                title: "Salt",
                conferenceName: "Pizza Summit",
            },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: [
                "Moss, Eve. “Salt.” <i>Pizza Summit</i>. Ed. Ravi Patel. n.d.",
                "Patel, Ravi and Mary Jones, “Heat.” <i>Pizza Summit</i>. Naples: Press, 2010. 4-9.",
            ],
        },
    },
    {
        name: "broadcast interviews, with and without a title, a broadcast's title and interviewers",
        sources: [
            {
                tag: "T1",
                type: "interview",
                interviewees: [{ lastName: "Hall", firstName: "Ann" }],
                year: "2001",
                broadcaster: "Radio One",
            },
            {
                tag: "T2",
                type: "interview",
                interviewees: [{ lastName: "Hall", firstName: "Ben" }],
                interviewers: [{ lastName: "Ward", firstName: "Cy" }],
                broadcastTitle: "Mornings",
                broadcaster: "Radio One",
            },
            {
                tag: "T3",
                type: "interview",
                interviewees: [{ lastName: "Hall", firstName: "Cara" }],
                title: "On Bread",
                city: "Leeds",
                broadcaster: "Radio One",
                station: "FM",
            },
            {
                tag: "T4",
                type: "interview",
                interviewees: [{ lastName: "Hall", firstName: "Dee" }],
                interviewers: [{ lastName: "Ward", firstName: "Cy" }],
                title: "On Salt",
                broadcaster: "Radio One",
            },
            { tag: "T5", type: "interview", title: "On Ovens", broadcastTitle: "Mornings", broadcaster: "Radio One" },
            {
                tag: "T6",
                type: "interview",
                interviewers: [{ lastName: "Ward", firstName: "Cy" }],
                title: "On Heat",
                broadcastTitle: "Mornings",
                broadcaster: "Radio One",
            },
        ],
        bibliography: {
            hangingIndent: true,
            paragraphs: [
                "Hall, Ann. Interview. Radio One. 2001.",
                "Hall, Ben. Interview with Cy Ward. <i>Mornings.</i> Radio One. n.d.",
                "Hall, Cara. <i>On Bread</i>. Radio One. FM, Leeds. n.d.",
                "Hall, Dee. On Salt. with Cy Ward. Radio One. n.d.",
                "“On Heat” with Cy Ward. <i>Mornings.</i> Radio One. n.d.",
                "“On Ovens” <i>Mornings.</i> Radio One. n.d.",
            ],
        },
    },
    {
        name: "citations with volumes and pages, without the author or the title, and of a source with neither",
        sources: [
            { tag: "T1", type: "book", authors: [{ lastName: "Baker", firstName: "Anna" }], title: "Pizza" },
            { tag: "T2", type: "book", title: "Bread" },
            { tag: "T3", type: "book", year: "2001" },
        ],
        citations: [
            [{ source: "T1", volume: "2" }],
            [{ source: "T1", pages: "5", volume: "2-3" }],
            [{ source: "T1", volume: "2, 4" }],
            [{ source: "T2", pages: "5" }],
            [{ source: "T3", pages: "5" }],
            [{ source: "T1", pages: "5", hideAuthor: true }],
            [{ source: "T1", pages: "5", hideAuthor: true, hideTitle: true }],
            [{ source: "T1", prefix: "see ", suffix: ", note" }, { source: "T2" }],
        ],
        cited: [
            "(Baker vol. 2)",
            "(Baker 2-3:5)",
            "(Baker vols. 2, 4)",
            "(Bread 5)",
            "(T35)",
            "(Pizza 5)",
            "(5)",
            "(see Baker, note; Bread)",
        ],
        bibliography: { hangingIndent: true, paragraphs: ["2001.", "Baker, Anna. <i>Pizza</i>. n.d.", "<i>Bread</i>. n.d."] },
    },
    {
        name: "citations of more than three authors",
        sources: [
            {
                tag: "T1",
                type: "book",
                authors: [
                    { lastName: "Baker", firstName: "Anna" },
                    { lastName: "Smith", firstName: "John" },
                    { lastName: "Patel", firstName: "Ravi" },
                    { lastName: "Jones", firstName: "Mary" },
                ],
                title: "Pizza",
            },
        ],
        citations: [[{ source: "T1" }]],
        cited: ["(Baker, Smith and Patel)"],
        bibliography: { hangingIndent: true, paragraphs: ["Baker, Anna, et al. <i>Pizza</i>. n.d."] },
    },
];

describe("mla", () => {
    describeWordOutput(mla, expected);

    describe("as Word's style writes", () => {
        for (const { name, sources, citations = [], cited = [], bibliography } of CASES) {
            it(`writes ${name}`, () => {
                const output = outputOf(mla, { sources, citations });
                expect(output.citations).toEqual(cited);
                expect(output.bibliography).toEqual(bibliography);
            });
        }
    });
});
