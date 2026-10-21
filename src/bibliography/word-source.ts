/**
 * Sources as Word keeps them: each field and role of people by its name in the bibliography's XML, which is what Word's
 * styles of citation read. The styles of `docx/bibliography` are written from Word's, so they read sources this way too.
 *
 * Reference: ooxml-schemas/ISO-IEC29500-4_2016/shared-bibliography.xsd
 *
 * @module
 */
import { BuilderElement, StringContainer, type XmlComponent } from "docx";

import type { Person, Source, SourceType } from "./source";

/** The roles of the people who made a source, in the order the schema lists them */
export const ROLES = [
    "Artist",
    "Author",
    "BookAuthor",
    "Compiler",
    "Composer",
    "Conductor",
    "Counsel",
    "Director",
    "Editor",
    "Interviewee",
    "Interviewer",
    "Inventor",
    "Performer",
    "ProducerName",
    "Translator",
    "Writer",
] as const;

/** A role of the people who made a source, by its name in the bibliography's XML */
export type Role = (typeof ROLES)[number];

/** Each field, by its name in the bibliography's XML, and the option of a {@link Source} it is from */
const FIELDS = {
    Title: "title",
    ShortTitle: "shortTitle",
    BookTitle: "bookTitle",
    JournalName: "journalName",
    PeriodicalTitle: "periodicalTitle",
    ConferenceName: "conferenceName",
    InternetSiteTitle: "websiteName",
    PublicationTitle: "publicationTitle",
    AlbumTitle: "albumTitle",
    BroadcastTitle: "broadcastTitle",
    Year: "year",
    Month: "month",
    Day: "day",
    YearAccessed: "yearAccessed",
    MonthAccessed: "monthAccessed",
    DayAccessed: "dayAccessed",
    City: "city",
    StateProvince: "stateOrProvince",
    CountryRegion: "countryOrRegion",
    Publisher: "publisher",
    ProductionCompany: "productionCompany",
    Distributor: "distributor",
    Institution: "institution",
    Department: "department",
    ThesisType: "reportType",
    Edition: "edition",
    Volume: "volume",
    NumberVolumes: "numberOfVolumes",
    Issue: "issue",
    Pages: "pages",
    Medium: "medium",
    Version: "version",
    StandardNumber: "standardNumber",
    URL: "url",
    RecordingNumber: "recordingNumber",
    Theater: "theater",
    Broadcaster: "broadcaster",
    Station: "station",
    Type: "patentType",
    PatentNumber: "patentNumber",
    CaseNumber: "caseNumber",
    AbbreviatedCaseNumber: "abbreviatedCaseNumber",
    Court: "court",
    Reporter: "reporter",
    Comments: "comments",
} as const satisfies Readonly<Record<string, keyof Source>>;

/** A field of a source, by its name in the bibliography's XML */
export type Field = keyof typeof FIELDS;

/** The people with each role, and the option of a {@link Source} they are from */
const PEOPLE = {
    Artist: "artists",
    Author: "authors",
    BookAuthor: "bookAuthors",
    Compiler: "compilers",
    Composer: "composers",
    Conductor: "conductors",
    Counsel: "counsel",
    Director: "directors",
    Editor: "editors",
    Interviewee: "interviewees",
    Interviewer: "interviewers",
    Inventor: "inventors",
    Performer: "performers",
    ProducerName: "producers",
    Translator: "translators",
    Writer: "writers",
} as const satisfies Readonly<Record<Role, keyof Source>>;

/** The roles an organization can have in place of people, and the option of a {@link Source} it is from */
const ORGANIZATIONS = { Author: "corporateAuthor", Performer: "corporatePerformer" } as const satisfies Partial<Record<Role, keyof Source>>;

/** Each type of source, and its name in the bibliography's XML */
const SOURCE_TYPES = {
    book: "Book",
    bookSection: "BookSection",
    journalArticle: "JournalArticle",
    articleInAPeriodical: "ArticleInAPeriodical",
    conferenceProceedings: "ConferenceProceedings",
    report: "Report",
    website: "InternetSite",
    documentFromWebsite: "DocumentFromInternetSite",
    electronicSource: "ElectronicSource",
    art: "Art",
    soundRecording: "SoundRecording",
    performance: "Performance",
    film: "Film",
    interview: "Interview",
    patent: "Patent",
    case: "Case",
    miscellaneous: "Misc",
} as const satisfies Readonly<Record<(typeof SourceType)[keyof typeof SourceType], string>>;

/** A type of source, by its name in the bibliography's XML */
export type WordSourceType = (typeof SOURCE_TYPES)[keyof typeof SOURCE_TYPES];

/** A person, as Word keeps one: each of their names, empty when it isn't given */
export type WordPerson = { readonly last: string; readonly first: string; readonly middle: string };

/** The people with a role, or the organization that has it */
export type WordNames = { readonly people: readonly WordPerson[] } | { readonly corporate: string };

/**
 * A source as Word keeps it. Its fields and people are by their names in the bibliography's XML, and its order is where it
 * is in the order the document cites its sources (`b:RefOrder`), from 1.
 */
export type WordSource = {
    readonly tag: string;
    readonly type: WordSourceType;
    readonly names: Readonly<Partial<Record<Role, WordNames>>>;
    readonly fields: Readonly<Partial<Record<Field, string>>>;
    readonly order: number;
};

const personOf = ({ lastName, firstName = "", middleName = "" }: Person): WordPerson => ({
    last: lastName,
    first: firstName,
    middle: middleName,
});

/**
 * A source as Word keeps it, numbered as cited in the order given.
 *
 * @throws If it has no tag, or both people and an organization with the same role
 */
export const wordSourceOf = (source: Source, order: number): WordSource => {
    if (!source.tag) {
        throw new Error('A bibliography\'s source has no tag. Give each source the tag its citations refer to it by, such as "Dic06"');
    }
    const names: Partial<Record<Role, WordNames>> = {};
    for (const role of ROLES) {
        const people = source[PEOPLE[role]];
        const organization = role in ORGANIZATIONS ? source[ORGANIZATIONS[role as keyof typeof ORGANIZATIONS]] : undefined;
        if (organization && people?.length) {
            throw new Error(
                `The source "${source.tag}" has both ${PEOPLE[role]} and ${ORGANIZATIONS[role as keyof typeof ORGANIZATIONS]}. Give one or the other`,
            );
        }
        if (organization) {
            // eslint-disable-next-line functional/immutable-data
            names[role] = { corporate: organization };
        } else if (people?.length) {
            // eslint-disable-next-line functional/immutable-data
            names[role] = { people: people.map(personOf) };
        }
    }
    const fields: Partial<Record<Field, string>> = {};
    for (const [field, option] of Object.entries(FIELDS) as readonly (readonly [Field, keyof Source])[]) {
        const value = source[option];
        if (value !== undefined && value !== "") {
            // eslint-disable-next-line functional/immutable-data
            fields[field] = String(value);
        }
    }
    return { tag: source.tag, type: SOURCE_TYPES[source.type], names, fields, order };
};

/** A field of a source, or "" when it doesn't have it, as Word's styles read a field */
export const fieldOf = (source: WordSource, field: Field): string => source.fields[field] ?? "";

/** The people with a role, or none when it has an organization or nobody in it */
export const peopleOf = (source: WordSource, role: Role): readonly WordPerson[] => {
    const names = source.names[role];
    return names && "people" in names ? names.people : [];
};

/** The organization with a role, or "" when it has people or nobody in it */
export const organizationOf = (source: WordSource, role: Role): string => {
    const names = source.names[role];
    return names && "corporate" in names ? names.corporate : "";
};

const text = (name: string, value: string): XmlComponent => new StringContainer(`b:${name}`, value);

const personXml = ({ last, first, middle }: WordPerson): XmlComponent =>
    new BuilderElement({
        name: "b:Person",
        children: [
            ...(last ? [text("Last", last)] : []),
            ...(first ? [text("First", first)] : []),
            ...(middle ? [text("Middle", middle)] : []),
        ],
    });

/**
 * A source's XML, as Word writes it: its tag, type, people and fields, and the order it is cited in.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SourceType">
 *   <xsd:sequence>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element name="AbbreviatedCaseNumber" type="s:ST_String"/>
 *       <xsd:element name="Author" type="CT_AuthorType"/>
 *       ...
 *       <xsd:element name="Year" type="s:ST_String"/>
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createSourceXml = (source: WordSource): XmlComponent => {
    const roles = ROLES.filter((role) => source.names[role] !== undefined);
    return new BuilderElement({
        name: "b:Source",
        children: [
            text("Tag", source.tag),
            text("SourceType", source.type),
            ...(roles.length > 0
                ? [
                      new BuilderElement({
                          name: "b:Author",
                          children: roles.map((role) => {
                              const names = source.names[role]!;
                              return new BuilderElement({
                                  name: `b:${role}`,
                                  children: [
                                      "corporate" in names
                                          ? text("Corporate", names.corporate)
                                          : new BuilderElement({ name: "b:NameList", children: names.people.map(personXml) }),
                                  ],
                              });
                          }),
                      }),
                  ]
                : []),
            ...(Object.keys(FIELDS) as readonly Field[])
                .filter((field) => source.fields[field] !== undefined)
                .map((field) => text(field, source.fields[field]!)),
            text("RefOrder", String(source.order)),
        ],
    });
};
