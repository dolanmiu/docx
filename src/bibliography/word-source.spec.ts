import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";

import { SourceType } from "./source";
import { createSourceXml, fieldOf, organizationOf, peopleOf, wordSourceOf } from "./word-source";

const format = (component: Parameters<Formatter["format"]>[0]): unknown => {
    const file = new File({ sections: [] });
    return new Formatter().format(component, { file, viewWrapper: file.Document, stack: [] });
};

describe("wordSourceOf", () => {
    it("names each field and role as Word's XML does, and gives each field as text", () => {
        const source = wordSourceOf(
            {
                tag: "Dic06",
                type: SourceType.BOOK,
                authors: [{ lastName: "Dickens", firstName: "Charles", middleName: "John" }],
                editors: [{ lastName: "Hemingway" }],
                title: "How to Write Bibliographies",
                websiteName: "Site",
                stateOrProvince: "Illinois",
                reportType: "Thesis",
                patentType: "Utility",
                year: 2006,
                day: 4,
                volume: 3,
                numberOfVolumes: 4,
                issue: 2,
            },
            1,
        );

        expect(source).to.deep.equal({
            tag: "Dic06",
            type: "Book",
            names: {
                Author: { people: [{ last: "Dickens", first: "Charles", middle: "John" }] },
                Editor: { people: [{ last: "Hemingway", first: "", middle: "" }] },
            },
            fields: {
                Title: "How to Write Bibliographies",
                InternetSiteTitle: "Site",
                StateProvince: "Illinois",
                ThesisType: "Thesis",
                Type: "Utility",
                Year: "2006",
                Day: "4",
                Volume: "3",
                NumberVolumes: "4",
                Issue: "2",
            },
            order: 1,
        });
    });

    it("names each type of source as Word does", () => {
        expect(Object.values(SourceType).map((type) => wordSourceOf({ tag: "T", type }, 1).type)).to.deep.equal([
            "Book",
            "BookSection",
            "JournalArticle",
            "ArticleInAPeriodical",
            "ConferenceProceedings",
            "Report",
            "InternetSite",
            "DocumentFromInternetSite",
            "ElectronicSource",
            "Art",
            "SoundRecording",
            "Performance",
            "Film",
            "Interview",
            "Patent",
            "Case",
            "Misc",
        ]);
    });

    it("leaves out empty fields and roles with nobody in them", () => {
        expect(wordSourceOf({ tag: "T", type: "book", title: "", authors: [] }, 1)).to.deep.equal({
            tag: "T",
            type: "Book",
            names: {},
            fields: {},
            order: 1,
        });
    });

    it("gives an organization the role of author or performer", () => {
        const source = wordSourceOf({ tag: "T", type: "soundRecording", corporateAuthor: "Board", corporatePerformer: "Band" }, 1);

        expect(source.names).to.deep.equal({ Author: { corporate: "Board" }, Performer: { corporate: "Band" } });
        expect(organizationOf(source, "Author")).to.equal("Board");
        expect(peopleOf(source, "Author")).to.deep.equal([]);
    });

    it("throws for a source with no tag", () => {
        expect(() => wordSourceOf({ tag: "", type: "book" }, 1)).toThrow("A bibliography's source has no tag");
    });

    it("throws for a source whose type isn't one of SourceType's, such as Word's own name for it", () => {
        expect(() => wordSourceOf({ tag: "T", type: "InternetSite" as "website" }, 1)).toThrow(
            'The source "T" has the type "InternetSite", which isn\'t a type of source. Give one of SourceType\'s, such as SourceType.BOOK',
        );
        expect(() => wordSourceOf({ tag: "T", type: "constructor" as "book" }, 1)).toThrow('has the type "constructor"');
    });

    it("throws for a source with both people and an organization in one role", () => {
        expect(() => wordSourceOf({ tag: "T", type: "book", authors: [{ lastName: "Lee" }], corporateAuthor: "Board" }, 1)).toThrow(
            'The source "T" has both authors and corporateAuthor',
        );
    });
});

describe("fieldOf, peopleOf and organizationOf", () => {
    const source = wordSourceOf({ tag: "T", type: "book", title: "Title", authors: [{ lastName: "Lee" }] }, 1);

    it("reads a field, or gives an empty one, as Word's styles do", () => {
        expect(fieldOf(source, "Title")).to.equal("Title");
        expect(fieldOf(source, "Year")).to.equal("");
    });

    it("reads the people with a role, or none", () => {
        expect(peopleOf(source, "Author")).to.deep.equal([{ last: "Lee", first: "", middle: "" }]);
        expect(peopleOf(source, "Editor")).to.deep.equal([]);
    });

    it("reads the organization with a role, or none", () => {
        expect(organizationOf(source, "Author")).to.equal("");
        expect(organizationOf(source, "Editor")).to.equal("");
    });
});

describe("createSourceXml", () => {
    it("writes a source as Word does: its tag, type, people, fields and the order it's cited in", () => {
        const source = wordSourceOf(
            {
                tag: "Dic06",
                type: "book",
                authors: [
                    { lastName: "Dickens", firstName: "Charles", middleName: "John" },
                    { lastName: "", firstName: "Plato" },
                    { lastName: "Homer" },
                ],
                corporatePerformer: "Band",
                title: "Bibliographies",
                year: "2006",
            },
            2,
        );

        expect(format(createSourceXml(source))).to.deep.equal({
            "b:Source": [
                { "b:Tag": ["Dic06"] },
                { "b:SourceType": ["Book"] },
                {
                    "b:Author": [
                        {
                            "b:Author": [
                                {
                                    "b:NameList": [
                                        { "b:Person": [{ "b:Last": ["Dickens"] }, { "b:First": ["Charles"] }, { "b:Middle": ["John"] }] },
                                        { "b:Person": [{ "b:First": ["Plato"] }] },
                                        { "b:Person": [{ "b:Last": ["Homer"] }] },
                                    ],
                                },
                            ],
                        },
                        { "b:Performer": [{ "b:Corporate": ["Band"] }] },
                    ],
                },
                { "b:Title": ["Bibliographies"] },
                { "b:Year": ["2006"] },
                { "b:RefOrder": ["2"] },
            ],
        });
    });

    it("writes a source with no people and no fields", () => {
        expect(format(createSourceXml(wordSourceOf({ tag: "T", type: "miscellaneous" }, 1)))).to.deep.equal({
            "b:Source": [{ "b:Tag": ["T"] }, { "b:SourceType": ["Misc"] }, { "b:RefOrder": ["1"] }],
        });
    });
});
