import { describe, expect, it } from "vitest";

import { type CorpusOutput, describeWordOutput, outputOf } from "tests/bibliography";

import type { CitedSourceOptions } from "../format";
import type { Source } from "../source";
import expected from "./fixtures/ieee.json";
import { ieee } from "./ieee";

// Sources the fixtures don't have, for the style's other branches. What they're written as is what Word's style,
// IEEE2006OfficeOnline.xsl, writes for them when run with libxslt and Word's English wording
const CASES: readonly {
    readonly name: string;
    readonly sources: readonly Source[];
    readonly citations?: readonly (readonly CitedSourceOptions[])[];
    readonly cited?: readonly string[];
    readonly bibliography: CorpusOutput["bibliography"];
}[] = [
    {
        name: "a first name with a hyphen and a space",
        sources: [
            { tag: "T1", type: "book", authors: [{ lastName: "Brown", firstName: "Jean-Paul Marc" }], title: "Pancakes", year: "2014" },
        ],
        bibliography: { rows: [["[1] ", "J.-P. M. Brown, Pancakes, 2014. "]] },
    },
    {
        name: "one director with a hyphenated first name",
        sources: [{ tag: "T1", type: "film", directors: [{ lastName: "Gray", firstName: "Jean-Luc" }], title: "Breathless", year: "1960" }],
        bibliography: { rows: [["[1] ", "J.-L. Gray, Director, <i>Breathless. </i>[Film]. 1960. "]] },
    },
    {
        name: "several directors",
        sources: [
            {
                tag: "T1",
                type: "film",
                directors: [
                    { lastName: "Smith", firstName: "Joel" },
                    { lastName: "Smith", firstName: "Ethan" },
                ],
                title: "Snow",
            },
        ],
        bibliography: { rows: [["[1] ", "J. Smith and E. Smith, Directors, <i>Snow. </i>[Film]. "]] },
    },
    {
        name: "people without a last name in a list",
        sources: [
            {
                tag: "T1",
                type: "book",
                authors: [
                    { lastName: "", firstName: "Ann" },
                    { lastName: "", firstName: "Bob" },
                    { lastName: "Lee", firstName: "Cy" },
                ],
                title: "Lists",
            },
        ],
        bibliography: { rows: [["[1] ", "A. B. and C. Lee, Lists. "]] },
    },
    {
        name: "several writers of a performance",
        sources: [
            {
                tag: "T1",
                type: "performance",
                writers: [
                    { lastName: "Nash", firstName: "Leo" },
                    { lastName: "Holt", firstName: "Eve" },
                ],
                title: "A Play",
                productionCompany: "Opera Co",
            },
        ],
        bibliography: { rows: [["[1] ", "L. Nash and E. Holt, Writers, <i>A Play. </i>[Performance]. Opera Co. "]] },
    },
    {
        name: "several interviewees and artists",
        sources: [
            {
                tag: "T1",
                type: "interview",
                interviewees: [
                    { lastName: "Russo", firstName: "Gina" },
                    { lastName: "Mills", firstName: "Joe" },
                ],
                title: "Talk",
            },
            {
                tag: "T2",
                type: "art",
                artists: [
                    { lastName: "Vega", firstName: "Rosa" },
                    { lastName: "Mora", firstName: "Luz" },
                ],
                title: "Bread",
                institution: "Museum",
            },
        ],
        bibliography: {
            rows: [
                ["[1] ", "G. Russo and J. Mills, Interviewees, <i>Talk. </i>[Interview]. "],
                ["[2] ", "R. Vega and L. Mora, Artists, <i>Bread. </i>[Art]. Museum. "],
            ],
        },
    },
    {
        name: "several composers, conductors and performers",
        sources: [
            {
                tag: "T1",
                type: "soundRecording",
                composers: [
                    { lastName: "Lane", firstName: "Mia" },
                    { lastName: "Fox", firstName: "Nick" },
                ],
                title: "Song",
            },
            { tag: "T2", type: "soundRecording", conductors: [{ lastName: "Lane", firstName: "Mia" }], title: "Song" },
            {
                tag: "T3",
                type: "soundRecording",
                conductors: [
                    { lastName: "Lane", firstName: "Mia" },
                    { lastName: "Fox", firstName: "Nick" },
                ],
                title: "Song",
            },
            {
                tag: "T4",
                type: "soundRecording",
                performers: [
                    { lastName: "Day", firstName: "Joy" },
                    { lastName: "Ray", firstName: "Kai" },
                ],
                title: "Song",
            },
            { tag: "T5", type: "soundRecording", title: "Song" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "M. Lane and N. Fox, Composers, <i>Song. </i>[Sound Recording]. "],
                ["[2] ", "M. Lane, Conductor, <i>Song. </i>[Sound Recording]. "],
                ["[3] ", "M. Lane and N. Fox, Conductors, <i>Song. </i>[Sound Recording]. "],
                ["[4] ", "J. Day and K. Ray, Performers, <i>Song. </i>[Sound Recording]. "],
                ["[5] ", "<i>Song. </i>[Sound Recording]. "],
            ],
        },
    },
    {
        name: "editors in place of the authors, with nothing after them",
        sources: [
            { tag: "T1", type: "book", editors: [{ lastName: "Reid", firstName: "Lou" }] },
            {
                tag: "T2",
                type: "bookSection",
                editors: [
                    { lastName: "Reid", firstName: "Lou" },
                    { lastName: "Hart", firstName: "Una" },
                ],
            },
            { tag: "T3", type: "bookSection", editors: [{ lastName: "Reid", firstName: "Lou" }], year: "2001" },
            { tag: "T4", type: "journalArticle", editors: [{ lastName: "Reid", firstName: "Lou" }], title: "Salt" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "L. Reid, Ed. "],
                ["[2] ", "L. Reid and U. Hart, Eds. "],
                ["[3] ", "L. Reid, Ed., 2001. "],
                ["[4] ", "L. Reid, Ed.“Salt”. "],
            ],
        },
    },
    {
        name: "editors after the authors, with nothing after them",
        sources: [
            {
                tag: "T1",
                type: "book",
                authors: [{ lastName: "Lee", firstName: "Ann" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
            },
            {
                tag: "T2",
                type: "book",
                authors: [{ lastName: "Lee", firstName: "Ann" }],
                editors: [
                    { lastName: "Reid", firstName: "Lou" },
                    { lastName: "Hart", firstName: "Una-May" },
                ],
            },
        ],
        bibliography: {
            rows: [
                ["[1] ", "A. Lee, L. Reid, Ed. "],
                ["[2] ", "A. Lee, L. Reid and U. Hart, Eds. "],
            ],
        },
    },
    {
        name: "an organization with nothing after it",
        sources: [
            { tag: "T1", type: "book", corporateAuthor: "Board" },
            { tag: "T2", type: "report", corporateAuthor: "Agency" },
            { tag: "T3", type: "conferenceProceedings", corporateAuthor: "Society" },
            { tag: "T4", type: "journalArticle", corporateAuthor: "Council" },
            { tag: "T5", type: "website", corporateAuthor: "WHO" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "Board. "],
                ["[2] ", "Agency."],
                ["[3] ", "Society. "],
                ["[4] ", "Council. "],
                ["[5] ", "WHO, [Online]. "],
            ],
        },
    },
    {
        name: "titles with nothing after them",
        sources: [
            { tag: "T1", type: "journalArticle", title: "Salt" },
            { tag: "T2", type: "articleInAPeriodical", title: "Column" },
            { tag: "T3", type: "report", title: "Annual" },
            { tag: "T4", type: "conferenceProceedings", title: "Paper" },
            { tag: "T5", type: "bookSection", title: "Starters" },
            { tag: "T6", type: "book", title: "Pies" },
            { tag: "T7", type: "case", title: "A v. B" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "“Salt”. "],
                ["[2] ", "“Column”. "],
                ["[3] ", "“Annual”."],
                ["[4] ", "“Paper”. "],
                ["[5] ", "“Starters”. "],
                ["[6] ", "Pies. "],
                ["[7] ", "<i>A v. B.</i>"],
            ],
        },
    },
    {
        name: "authors and editors, and one more field",
        sources: [
            {
                tag: "T1",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
                title: "Starters",
            },
            { tag: "T2", type: "bookSection", authors: [{ lastName: "Fox", firstName: "Amy" }], title: "Starters" },
            {
                tag: "T3",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
                bookTitle: "Menus",
            },
            { tag: "T4", type: "bookSection", authors: [{ lastName: "Fox", firstName: "Amy" }], bookTitle: "Menus" },
            { tag: "T5", type: "bookSection", bookTitle: "Menus" },
            {
                tag: "T6",
                type: "book",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
                volume: "3",
            },
            { tag: "T7", type: "book", authors: [{ lastName: "Fox", firstName: "Amy" }], volume: "3" },
            { tag: "T8", type: "book", volume: "3" },
            {
                tag: "T9",
                type: "book",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
                edition: "2nd",
            },
            { tag: "T10", type: "book", authors: [{ lastName: "Fox", firstName: "Amy" }], edition: "2nd" },
            { tag: "T11", type: "book", edition: "2nd" },
            {
                tag: "T12",
                type: "book",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Reid", firstName: "Lou" }],
                title: "Pies",
            },
            { tag: "T13", type: "book", authors: [{ lastName: "Fox", firstName: "Amy" }], title: "Pies" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "A. Fox, “Starters,” L. Reid, Ed. "],
                ["[2] ", "A. Fox, “Starters”. "],
                ["[3] ", "A. Fox, in <i>Menus</i>, L. Reid, Ed. "],
                ["[4] ", "A. Fox, in <i>Menus</i>. "],
                ["[5] ", "in <i>Menus</i>. "],
                ["[6] ", "A. Fox, vol. 3, L. Reid, Ed. "],
                ["[7] ", "A. Fox, vol. 3. "],
                ["[8] ", "vol. 3. "],
                ["[9] ", "A. Fox, 2nd ed., L. Reid, Ed. "],
                ["[10] ", "A. Fox, 2nd ed. "],
                ["[11] ", "2nd ed. "],
                ["[12] ", "A. Fox, Pies, L. Reid, Ed. "],
                ["[13] ", "A. Fox, Pies. "],
            ],
        },
    },
    {
        name: "journal fields with nothing after them",
        sources: [
            { tag: "T1", type: "journalArticle", journalName: "Taste" },
            { tag: "T2", type: "articleInAPeriodical", periodicalTitle: "Daily" },
            { tag: "T3", type: "journalArticle", volume: "2-3" },
            { tag: "T4", type: "journalArticle", year: "2001", volume: "2, 4" },
            { tag: "T5", type: "journalArticle", volume: "7" },
            { tag: "T6", type: "journalArticle", issue: "4" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "<i>Taste.</i> "],
                ["[2] ", "<i>Daily.</i> "],
                ["[3] ", "Vols. 2-3. "],
                ["[4] ", "Vols. 2, 4, 2001. "],
                ["[5] ", "vol. 7. "],
                ["[6] ", "no. 4. "],
            ],
        },
    },
    {
        name: "places with nothing after them",
        sources: [
            { tag: "T1", type: "book", city: "Leeds" },
            { tag: "T2", type: "book", city: "Leeds", stateOrProvince: "Yorkshire" },
            { tag: "T3", type: "bookSection", city: "Leeds" },
            { tag: "T4", type: "book", stateOrProvince: "Yorkshire" },
            { tag: "T5", type: "book", year: "2001", stateOrProvince: "Yorkshire" },
            { tag: "T6", type: "report", publisher: "Press" },
            { tag: "T7", type: "website", productionCompany: "Studio" },
            { tag: "T8", type: "patent", countryOrRegion: "France" },
            { tag: "T9", type: "patent", year: "2001", countryOrRegion: "France" },
        ],
        bibliography: {
            rows: [
                ["[1] ", "Leeds. "],
                ["[2] ", "Leeds, Yorkshire. "],
                ["[3] ", "Leeds. "],
                ["[4] ", "Yorkshire. "],
                ["[5] ", "Yorkshire, 2001. "],
                ["[6] ", "Press."],
                ["[7] ", "Studio. [Online]. "],
                ["[8] ", "France."],
                ["[9] ", "France 2001."],
            ],
        },
    },
];

describe("ieee", () => {
    describeWordOutput(ieee, expected);

    describe("as Word's style writes", () => {
        for (const { name, sources, citations = [], cited = [], bibliography } of CASES) {
            it(`writes ${name}`, () => {
                const output = outputOf(ieee, { sources, citations });
                expect(output.citations).toEqual(cited);
                expect(output.bibliography).toEqual(bibliography);
            });
        }
    });
});
