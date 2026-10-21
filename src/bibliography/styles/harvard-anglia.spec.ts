import { describe, expect, it } from "vitest";

import { type CorpusOutput, describeWordOutput, outputOf } from "tests/bibliography";

import { harvardAnglia } from "./harvard-anglia";
import type { CitedSourceOptions } from "../format";
import type { Source } from "../source";
import expected from "./fixtures/harvard-anglia.json";

// Sources none of the corpora have, which take the style down paths it has for them. What Word's style writes for each
// is from running Word's own XSL with libxslt and Word's English wording, as corpus s is
const CASES: readonly {
    readonly name: string;
    readonly sources: readonly Source[];
    readonly citations: readonly (readonly CitedSourceOptions[])[];
    readonly expected: Required<CorpusOutput>;
}[] = [
    {
        name: "authors with middle names, or with only some of their names",
        sources: [
            {
                tag: "B1",
                type: "book",
                authors: [
                    { lastName: "Hall", firstName: "Ann", middleName: "Mary Jean-Paul" },
                    { lastName: "Fox", firstName: "Bob" },
                ],
                title: "Bread",
                year: "2010",
            },
            {
                tag: "B2",
                type: "book",
                authors: [
                    { lastName: "Lee", firstName: "Jean-Paul", middleName: "Ann Marie" },
                    { lastName: "Ray", firstName: "Cy" },
                    { lastName: "Moss", firstName: "Dee" },
                    { lastName: "Kim", firstName: "Eve" },
                    { lastName: "Ward", firstName: "Max" },
                ],
                title: "Crust",
                year: "2011",
            },
            {
                tag: "B3",
                type: "book",
                authors: [
                    { lastName: "", middleName: "Lu" },
                    { lastName: "Ray", firstName: "Cy" },
                    { lastName: "Moss", firstName: "Dee" },
                    { lastName: "Kim", firstName: "Eve" },
                    { lastName: "Ward", firstName: "Max" },
                ],
                title: "Dough",
                year: "2012",
            },
            {
                tag: "B4",
                type: "book",
                authors: [{ lastName: "Hall" }, { lastName: "Fox", firstName: "Bob" }],
                title: "Flour",
                year: "2013",
            },
        ],
        citations: [[{ source: "B1" }], [{ source: "B2" }], [{ source: "B3" }], [{ source: "B4" }]],
        expected: {
            citations: ["(Hall &amp; Fox, 2010)", "(Lee, et al., 2011)", "(Ray, et al., 2012)", "(Hall &amp; Fox, 2013)"],
            bibliography: {
                hangingIndent: false,
                paragraphs: [
                    "Hall, A. M. J.-P. &amp; Fox, B., 2010. <i>Bread. </i>s.l.:s.n.",
                    "Hall &amp; Fox, B., 2013. <i>Flour. </i>s.l.:s.n.",
                    "Lee, J.-P.A. M. et al., 2011. <i>Crust. </i>s.l.:s.n.",
                    "L. et al., 2012. <i>Dough. </i>s.l.:s.n.",
                ],
            },
        },
    },
    {
        name: "books listed by their editors, with only some of their names",
        sources: [
            { tag: "E1", type: "book", editors: [{ lastName: "Hall" }], title: "Bread", year: "2010" },
            { tag: "E2", type: "book", editors: [{ lastName: "Hall", middleName: "Ann" }], title: "Crust", year: "2011" },
            { tag: "E3", type: "book", editors: [{ lastName: "", firstName: "Gil", middleName: "Lee" }], title: "Dough", year: "2012" },
            {
                tag: "E4",
                type: "book",
                editors: [
                    { lastName: "", middleName: "Lu" },
                    { lastName: "Ray", firstName: "Cy" },
                    { lastName: "Moss", firstName: "Dee" },
                    { lastName: "Kim", firstName: "Eve" },
                    { lastName: "Ward", firstName: "Max" },
                ],
                title: "Flour",
                year: "2013",
            },
            {
                tag: "E5",
                type: "book",
                editors: [
                    { lastName: "", firstName: "Ann", middleName: "Lu" },
                    { lastName: "", middleName: "Bo" },
                    { lastName: "Ray", firstName: "Cy", middleName: "Dee" },
                ],
                title: "Salt",
                year: "2014",
            },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: {
                hangingIndent: false,
                paragraphs: [
                    "A. L., B. &amp; Ray, C. D. eds., 2014. <i>Salt. </i>s.l.:s.n.",
                    "G. L. ed., 2012. <i>Dough. </i>s.l.:s.n.",
                    "Hall ed., 2010. <i>Bread. </i>s.l.:s.n.",
                    "Hall, A. ed., 2011. <i>Crust. </i>s.l.:s.n.",
                    "L. et al. eds., 2013. <i>Flour. </i>s.l.:s.n.",
                ],
            },
        },
    },
    {
        name: "a patent by an organization",
        sources: [{ tag: "P1", type: "patent", corporateAuthor: "Oven Works", title: "Oven", year: "2015", patentNumber: "123" }],
        citations: [[{ source: "P1" }]],
        expected: {
            citations: ["(Oven Works, 2015)"],
            bibliography: { hangingIndent: false, paragraphs: ["Oven Works, 2015. <i>Oven. </i>s.l. Patent No. 123."] },
        },
    },
    {
        name: "book sections with editors, with only some of their names",
        sources: [
            {
                tag: "S1",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "Hall", middleName: "Ann" }],
                title: "Starters",
                bookTitle: "Menus",
                year: "2020",
            },
            {
                tag: "S2",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [{ lastName: "", firstName: "Gil" }],
                title: "Mains",
                bookTitle: "Menus",
                year: "2021",
            },
            {
                tag: "S3",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [
                    { lastName: "", firstName: "Gil", middleName: "Lee" },
                    { lastName: "Ray", firstName: "Cy" },
                    { lastName: "Moss", firstName: "Dee" },
                    { lastName: "Kim", firstName: "Eve" },
                    { lastName: "Ward", firstName: "Max" },
                ],
                title: "Sides",
                bookTitle: "Menus",
                year: "2022",
            },
            {
                tag: "S4",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [
                    { lastName: "Hall" },
                    { lastName: "Ray", firstName: "Cy" },
                    { lastName: "Moss", firstName: "Dee" },
                    { lastName: "Kim", firstName: "Eve" },
                    { lastName: "Ward", firstName: "Max" },
                ],
                title: "Sauces",
                bookTitle: "Menus",
                year: "2023",
            },
            {
                tag: "S5",
                type: "bookSection",
                authors: [{ lastName: "Fox", firstName: "Amy" }],
                editors: [
                    { lastName: "", firstName: "Ann" },
                    { lastName: "Ray", middleName: "Bo" },
                    { lastName: "", middleName: "Cy" },
                ],
                title: "Desserts",
                bookTitle: "Menus",
                year: "2024",
            },
        ],
        citations: [],
        expected: {
            citations: [],
            bibliography: {
                hangingIndent: false,
                paragraphs: [
                    "Fox, A., 2020. Starters. In: A. Hall, ed. <i>Menus. </i>s.l.:s.n.",
                    "Fox, A., 2021. Mains. In: G. ed. <i>Menus. </i>s.l.:s.n.",
                    "Fox, A., 2022. Sides. In: G. L. et al. eds. <i>Menus. </i>s.l.:s.n.",
                    "Fox, A., 2023. Sauces. In: Hall, et al. eds. <i>Menus. </i>s.l.:s.n.",
                    "Fox, A., 2024. Desserts. In: A., B. Ray &amp; C., eds. <i>Menus. </i>s.l.:s.n.",
                ],
            },
        },
    },
    {
        name: "a film with several directors, with only some of their names",
        sources: [
            {
                tag: "F1",
                type: "film",
                directors: [
                    { lastName: "", firstName: "Pedro" },
                    { lastName: "Fox", middleName: "Lu" },
                    { lastName: "", firstName: "Ann", middleName: "Bo" },
                ],
                title: "Deep Dish",
                year: "2011",
                countryOrRegion: "Italy",
                productionCompany: "Pan",
            },
        ],
        citations: [[{ source: "F1" }]],
        expected: {
            citations: ["(Deep Dish, 2011)"],
            bibliography: {
                hangingIndent: false,
                paragraphs: ["<i>Deep Dish. </i>2011. [Film] Directed by Pedro, Lu Fox, Ann Bo.Italy: Pan."],
            },
        },
    },
];

describe("harvard-anglia", () => {
    describeWordOutput(harvardAnglia, expected);

    for (const { name, sources, citations, expected: output } of CASES) {
        it(`writes ${name} as Word does`, () => {
            expect(outputOf(harvardAnglia, { sources, citations })).toEqual(output);
        });
    }

    it("names Word's style", () => {
        expect(harvardAnglia).toMatchObject({ name: "Harvard - Anglia", file: "HarvardAnglia2008OfficeOnline.xsl", version: "2008" });
    });
});
