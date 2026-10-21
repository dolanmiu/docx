/**
 * The templates of Word's two GOST styles, GOST - Name Sort (GostName.XSL) and GOST - Title Sort (GostTitle.XSL), which
 * write citations and bibliographies as the Russian standard GOST 7.1 has them, such as "Dickens Charles John How to
 * Write Bibliographies [Book]. - Chicago : Adventure Works Press, 2006."
 *
 * The two styles are the same but for how an entry starts and how the bibliography is sorted. GOST - Name Sort starts an
 * entry with its authors in bold, and leaves out the people who are those authors from the rest of it. GOST - Title Sort
 * starts it with its title in bold, and names its authors after the title.
 *
 * @module
 */
import { type FormattedText, bold, join, textOf } from "./formatted-text";
import { LOCALS } from "./locals";
import type { CitedSource } from "./style";
import { translate, xslTemplates } from "./xsl";
import {
    type Field,
    type Role,
    type WordNames,
    type WordPerson,
    type WordSource,
    type WordSourceType,
    fieldOf,
    peopleOf,
} from "../word-source";

const { General, Gost, Strings, SourceNames } = LOCALS;
const xsl = xslTemplates(General);

// The style's constants (constGost_*), each the wording it is made of
const NON_BREAKING_SPACE = General.NonBreakingSpace;
const SOURCE_TYPE_OPEN = General.Space + Gost.GeneralOpen;
const SOURCE_TYPE_CLOSE = Gost.GeneralClose;
const SHORT_TITLE_HEADER = NON_BREAKING_SPACE + General.Equal + General.Space;
const COLON_SEPARATOR = NON_BREAKING_SPACE + General.EnumSeparator;
const SEMICOLON_SEPARATOR = NON_BREAKING_SPACE + General.GroupSeparator;
const HYPHEN_SECTION_HEADER = General.Dot + NON_BREAKING_SPACE + General.FromToDash + General.Space;
const SLASH_HEADER = NON_BREAKING_SPACE + Gost.OneSlash + General.Space;
const COLLECTION_NAME_HEADER = NON_BREAKING_SPACE + Gost.TwoSlash + General.Space;
const PERSON_AND_OTHERS = General.Space + Gost.GeneralOpen + Strings.AndOthersUnCap + Gost.GeneralClose;
const SINE_LOCO = Gost.GeneralOpen + Strings.SineLocoShort + Gost.GeneralClose;
const SINE_NOMINE = Gost.GeneralOpen + Strings.SineNomineShort + Gost.GeneralClose;

/** Which of the two styles is writing: GOST - Name Sort, or GOST - Title Sort */
export type GostSort = "name" | "title";

/**
 * The roles a type of source is named by, in the order they're looked for (`MainContributors`). GOST looks for more
 * roles than Word does to tell sources apart
 */
const MAIN_ROLES: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor", "Translator"],
    BookSection: ["Author"],
    JournalArticle: ["Author", "Editor"],
    ArticleInAPeriodical: ["Author"],
    ConferenceProceedings: ["Author"],
    Report: ["Author"],
    SoundRecording: ["Artist", "Performer", "Composer", "Conductor", "ProducerName"],
    Performance: ["Writer", "Director", "Performer", "ProducerName"],
    Art: ["Artist"],
    DocumentFromInternetSite: ["Author"],
    InternetSite: ["Author"],
    Film: ["Director", "Writer", "Performer", "ProducerName"],
    Interview: ["Interviewee"],
    Patent: ["Inventor"],
    ElectronicSource: ["Author", "Editor", "ProducerName", "Translator"],
    Case: ["Author", "Counsel"],
    Misc: ["Author", "Editor", "Compiler", "Translator"],
};

/** The string value of the people with a role, or the organization: their names one after another, as XPath reads it */
const stringOf = (names: WordNames): string =>
    "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/** The people a source is named by (`b:Author/b:Main`, as `populateMain` writes it), an organization, or no one */
type Main = { readonly people: readonly WordPerson[]; readonly corporate: string };

/** The people or organization a source is named by: those of the first of its type's roles it has a name in (`populateMain`) */
export const mainOf = (source: WordSource): Main => {
    const role = MAIN_ROLES[source.type].find((candidate) => {
        const candidateNames = source.names[candidate];
        return candidateNames !== undefined && stringOf(candidateNames).length > 0;
    });
    const names = role === undefined ? undefined : source.names[role];
    if (names === undefined) {
        return { people: [], corporate: "" };
    }
    return "corporate" in names ? { people: [], corporate: names.corporate } : { people: names.people, corporate: "" };
};

const stringOfMain = (main: Main): string => (main.corporate ? main.corporate : stringOf({ people: main.people }));

/**
 * The separator after a person of a list of people (`formatPersonSeparator`): " [et al.]" after the first of four or more,
 * a comma between the others, and "and" before the last
 */
const formatPersonSeparator = (position: number, count: number): string => {
    if (count > 3) {
        return PERSON_AND_OTHERS;
    }
    if (count - 1 > position) {
        return General.ListSeparator;
    }
    return position === count - 1 ? General.Space + Strings.AndUnCap + General.Space : "";
};

/**
 * People with a role, last name first (`formatPersons`). Of four or more, only the first is written, with " [et al.]".
 * The template writes an organization in their place, which its callers here write themselves
 */
export const formatPersons = (people: readonly WordPerson[]): string => {
    const count = people.length;
    const shown = count >= 4 ? people.slice(0, 1) : people;
    return shown.map((person, index) => xsl.formatName(person, Gost.Authors) + formatPersonSeparator(index + 1, count)).join("");
};

/**
 * The people with a role, after the role's abbreviation, such as "ed. Hall Grace", when one of them has a last name
 * (`formatEditor`, `formatTranslator` and the like)
 */
const formatRole = (source: WordSource, role: Role, header: string): string => {
    const people = peopleOf(source, role);
    return people.some(({ last }) => last.length > 0) ? `${header}${General.Space}${formatPersons(people)}` : "";
};

/** The performers after "perf.", or the group that performed (`formatPerformer`) */
const formatPerformer = (source: WordSource): string => {
    const names = source.names.Performer;
    return names !== undefined && "corporate" in names
        ? `${Strings.PerformerShortUnCap}${General.Space}${names.corporate}`
        : formatRole(source, "Performer", Strings.PerformerShortUnCap);
};

/** The authors after "auth.", or the organization the source is named by (`formatAuthor`) */
const formatAuthor = (source: WordSource, main: Main): string => {
    if (main.corporate) {
        return `${Strings.AuthorShortUnCap}${General.Space}${main.corporate}`;
    }
    const people = peopleOf(source, "Author");
    return people.length > 0 ? `${Strings.AuthorShortUnCap}${General.Space}${formatPersons(people)}` : "";
};

/** The volume, such as "Vol. 3", or "Vols. 2-3" for more than one (the `volVolume` variable) */
const formatVolume = (volume: string, single: string, plural: string): string => {
    if (volume.length === 0) {
        return "";
    }
    const format = volume.includes(",") ? plural : translate(volume, General.Hyphens, "") === volume ? single : plural;
    return textOfFormat(format, volume);
};

/** The pages, such as "p. 5", or "pp. 10-20" for more than one */
const formatPages = (pages: string): string => {
    if (pages.length === 0) {
        return "";
    }
    const prefix = pages.includes(",")
        ? Strings.PagesCountinousShort
        : translate(pages, General.Hyphens, "") === pages
          ? Strings.PageShort
          : Strings.PagesCountinousShort;
    return `${prefix}${General.Space}${pages}`;
};

const textOfFormat = (format: string, parameter: string): string =>
    xsl
        .stringFormat(format, parameter)
        .map((run) => run.text)
        .join("");

/** Parts joined by a separator, each written only when it isn't empty */
const separated = (separator: string, ...parts: readonly string[]): string => parts.filter((part) => part.length > 0).join(separator);

/** Up to four parts with " : " between them (`formatColonElement`) */
const formatColonElement = (...parts: readonly string[]): string => separated(COLON_SEPARATOR, ...parts);

/**
 * Where a source was published and by whom, such as "Chicago : Press", with "[s.l.]" or "[s.n.]" for one that's missing
 * (`formatLocationElement`). With neither, it is the source's distributor
 */
const formatLocationElement = (
    source: WordSource,
    location: string,
    publisher: string,
    { distributor = "", noLocation = false }: { readonly distributor?: string; readonly noLocation?: boolean } = {},
): string => {
    if (location.length === 0 && publisher.length === 0) {
        // The template reads the source's distributor here, rather than the one it's given
        return formatColonElement("", "", fieldOf(source, "Distributor"));
    }
    return formatColonElement(
        noLocation ? "" : location.length === 0 ? SINE_LOCO : location,
        publisher.length === 0 ? SINE_NOMINE : publisher,
        distributor,
    );
};

/** A section after " - ", such as ". - Chicago : Press, 2006", or nothing when both its parts are empty (`formatHyphenSection`) */
const formatHyphenSection = (first: string, second = ""): string =>
    first.length === 0 && second.length === 0 ? "" : HYPHEN_SECTION_HEADER + separated(General.ListSeparator, first, second);

/** A date, such as "14 March 2018", or nothing without a year (`formatDateMonthYear` and `formatDateCore`) */
const formatDate = (day: string, month: string, year: string): string =>
    year.length === 0 ? "" : xsl.formatDatePrivate(day, month, year, Gost.Date);

/**
 * The people responsible for the source, other than the ones it's named by, after " / ", in brackets when there are more
 * than two kinds of them (`formatPrimaryResponsibilities`). How many there are counts the kinds the source has, less one
 * for the people it's named by in GOST - Name Sort
 */
const formatPrimaryResponsibilities = (count: number, first = "", second = "", third = ""): string =>
    (count > 0 ? SLASH_HEADER : "") +
    (count > 2 ? Gost.GeneralOpen : "") +
    first +
    (first !== "" && count > 1 ? SEMICOLON_SEPARATOR : "") +
    second +
    ((first === "" && count > 1) || count > 2 ? SEMICOLON_SEPARATOR : "") +
    third +
    (count > 2 ? Gost.GeneralClose : "");

/**
 * The people responsible for the source's publication, such as its editors, and the collection it is in, after " // "
 * (`formatSecondaryResponsibilities`)
 */
const formatSecondaryResponsibilities = (collection: string, ...elements: readonly string[]): string => {
    const written = elements.filter((element) => element.length > 0);
    if (collection.length > 0) {
        return COLLECTION_NAME_HEADER + collection + written.map((element) => SLASH_HEADER + element).join("");
    }
    return written.length > 0 ? SLASH_HEADER + written.join(SLASH_HEADER) : "";
};

/** The roles each type counts as primary responsibilities (`getNonEmpty_*_PrimSectionsCount`) */
const PRIMARY_ROLES: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author"],
    BookSection: ["Author"],
    JournalArticle: ["Author"],
    ArticleInAPeriodical: ["Author"],
    ConferenceProceedings: ["Author"],
    Report: ["Author"],
    SoundRecording: ["Composer", "Artist"],
    Performance: ["Writer", "Performer", "Director"],
    Art: ["Artist"],
    DocumentFromInternetSite: ["Author"],
    InternetSite: ["Author"],
    Film: ["Writer", "Performer", "Director"],
    Interview: ["Interviewee"],
    Patent: ["Inventor"],
    ElectronicSource: ["Author"],
    Case: ["Author"],
    Misc: ["Author"],
};

/**
 * How many of its type's roles that count as primary responsibilities the source has people or an organization in. GOST
 * - Name Sort doesn't count an organization as a book section's author, as its template counts only people
 */
const countOf = (source: WordSource, sort: GostSort): number =>
    PRIMARY_ROLES[source.type].filter((role) => {
        const names = source.names[role];
        return names !== undefined && ("corporate" in names ? sort === "title" || source.type !== "BookSection" : names.people.length > 0);
    }).length;

const field = (source: WordSource, name: Field): string => fieldOf(source, name);

/** Text after " : ", such as a report's type, when it isn't empty */
const colonHeaded = (text: string): string => (text.length > 0 ? COLON_SEPARATOR + text : "");

/**
 * A source's entry in a bibliography (the `b:Bibliography` part of the template that matches `/`): who it's by, its
 * title and type, the people responsible for it, where and when it was published, then its comments and its standard
 * number, each after " - ", and a dot.
 */
export const formatEntry = (source: WordSource, sort: GostSort): FormattedText => {
    const main = mainOf(source);
    const mainString = stringOfMain(main);
    // GOST - Name Sort leaves out the people of a role who are the people the source is named by
    const unlessMain = (role: Role, write: () => string): string => {
        const names = source.names[role];
        return sort === "title" || (names !== undefined && stringOf(names) !== mainString) ? write() : "";
    };
    const authors = unlessMain("Author", () => formatAuthor(source, main));
    const editors = unlessMain("Editor", () => formatRole(source, "Editor", Strings.EditorShortUnCap));
    const translators = unlessMain("Translator", () => formatRole(source, "Translator", Strings.TranslatorShortUnCap));
    const artists = unlessMain("Artist", () => formatRole(source, "Artist", Strings.ArtistShortUnCap));
    const composers = unlessMain("Composer", () => formatRole(source, "Composer", Strings.ComposerShortUnCapIso));
    const conductors = unlessMain("Conductor", () => formatRole(source, "Conductor", Strings.ConductorShortUnCap));
    const performers = unlessMain("Performer", () => formatPerformer(source));
    const writers = unlessMain("Writer", () => formatRole(source, "Writer", Strings.WriterShortUnCap));
    const directors = unlessMain("Director", () => formatRole(source, "Director", Strings.DirectorShortUnCap));
    const producers = unlessMain("ProducerName", () => formatRole(source, "ProducerName", Strings.ProducerShortUnCap));
    const interviewees = unlessMain("Interviewee", () => formatRole(source, "Interviewee", Strings.IntervieweeShortUnCap));
    const compilers = unlessMain("Compiler", () => formatRole(source, "Compiler", Strings.CompilerShortUnCapIso));
    const inventors = unlessMain("Inventor", () => formatRole(source, "Inventor", Strings.InventorShortUnCap));
    const counsel = unlessMain("Counsel", () => formatRole(source, "Counsel", Strings.CounselShortUnCap));
    const bookAuthors = unlessMain("BookAuthor", () => formatRole(source, "BookAuthor", Strings.BookAuthorShortUnCap));

    const volume = formatVolume(field(source, "Volume"), Strings.VolumeShortCap, Strings.VolumesShortCap);
    const pages = formatPages(field(source, "Pages"));
    const date = formatDate(field(source, "Day"), field(source, "Month"), field(source, "Year"));
    const city = field(source, "City");
    const publisher = field(source, "Publisher");
    const productionCompany = field(source, "ProductionCompany");

    const cityPublisherYear = formatHyphenSection(formatLocationElement(source, city, publisher), field(source, "Year"));
    const cityPublisherDate = formatHyphenSection(formatLocationElement(source, city, publisher), date);
    const issueVolume = formatHyphenSection(formatColonElement(field(source, "Issue"), volume));
    const pagesSection = formatHyphenSection(pages);
    const editionSection = formatHyphenSection(field(source, "Edition"));
    const volumeSection = formatHyphenSection(volume);
    const accessedSection = formatHyphenSection(
        formatDate(field(source, "DayAccessed"), field(source, "MonthAccessed"), field(source, "YearAccessed")),
    );

    // GOST - Name Sort leaves out the people the source is named by from how many primary responsibilities it has
    const mainSections = sort === "name" && (main.people.length > 0 || main.corporate.length > 0) ? 1 : 0;
    // GOST - Title Sort names the authors among them
    const primaryAuthors = sort === "title" ? authors : "";
    const primary = (first = "", second = "", third = ""): string =>
        formatPrimaryResponsibilities(countOf(source, sort) - mainSections, first, second, third);

    // Each type's own sections, after its titles
    const sectionsOf: Readonly<Record<WordSourceType, () => string>> = {
        Book: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities("", editors, translators) +
            cityPublisherYear +
            formatHyphenSection(formatColonElement(field(source, "Edition"), volume, field(source, "NumberVolumes"), pages)),
        BookSection: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "BookTitle"), bookAuthors, editors, translators) +
            cityPublisherYear +
            formatHyphenSection(formatColonElement(field(source, "Edition"), volume, field(source, "NumberVolumes"))),
        JournalArticle: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "JournalName"), editors) +
            cityPublisherDate +
            issueVolume +
            pagesSection,
        ArticleInAPeriodical: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "PeriodicalTitle"), editors) +
            cityPublisherDate +
            editionSection +
            issueVolume +
            pagesSection,
        ConferenceProceedings: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "ConferenceName"), editors) +
            cityPublisherYear +
            volumeSection +
            pagesSection,
        Report: () =>
            colonHeaded(field(source, "ThesisType")) +
            primary(primaryAuthors) +
            formatSecondaryResponsibilities("", separated(SEMICOLON_SEPARATOR, field(source, "Department"), field(source, "Institution"))) +
            cityPublisherYear +
            pagesSection,
        SoundRecording: () =>
            colonHeaded(field(source, "Medium")) +
            primary(artists, composers) +
            formatSecondaryResponsibilities(field(source, "AlbumTitle"), conductors, performers, producers) +
            formatHyphenSection(formatLocationElement(source, city, productionCompany), field(source, "Year")),
        Performance: () =>
            primary(writers, performers, directors) +
            formatSecondaryResponsibilities("", producers) +
            formatHyphenSection(
                formatLocationElement(source, separated(SEMICOLON_SEPARATOR, field(source, "Theater"), city), productionCompany),
                date,
            ),
        Art: () => primary(artists) + formatHyphenSection(formatLocationElement(source, city, field(source, "Institution"))),
        DocumentFromInternetSite: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "InternetSiteTitle"), editors, producers) +
            formatHyphenSection(productionCompany, date) +
            formatHyphenSection(field(source, "Version")) +
            accessedSection +
            formatHyphenSection(field(source, "URL")),
        InternetSite: () =>
            primary(primaryAuthors) +
            formatSecondaryResponsibilities(field(source, "InternetSiteTitle"), editors, producers) +
            formatHyphenSection(productionCompany, date) +
            accessedSection +
            formatHyphenSection(field(source, "URL")),
        Film: () =>
            primary(writers, performers, directors) +
            formatSecondaryResponsibilities("", producers) +
            formatHyphenSection(
                formatLocationElement(source, "", productionCompany, { distributor: field(source, "Distributor"), noLocation: true }),
                field(source, "Year"),
            ),
        Interview: () =>
            // GOST - Title Sort's template writes them only when one of the first three isn't empty, so not translators alone
            (sort === "title" && interviewees + compilers + editors === ""
                ? ""
                : formatSecondaryResponsibilities("", interviewees, compilers, editors, translators)) +
            formatHyphenSection(
                formatLocationElement(
                    source,
                    city,
                    separated(SEMICOLON_SEPARATOR, field(source, "Broadcaster"), field(source, "Station"), publisher),
                ),
                date,
            ) +
            pagesSection,
        Patent: () =>
            colonHeaded(field(source, "PatentNumber")) +
            colonHeaded(field(source, "Type")) +
            primary(inventors) +
            formatSecondaryResponsibilities("", editors, translators) +
            formatHyphenSection(field(source, "CountryRegion"), date),
        ElectronicSource: () =>
            primary(authors) +
            formatSecondaryResponsibilities("", editors, producers, translators) +
            formatHyphenSection(formatLocationElement(source, city, separated(SEMICOLON_SEPARATOR, publisher, productionCompany)), date) +
            editionSection +
            volumeSection,
        Case: () =>
            colonHeaded(field(source, "CaseNumber")) +
            colonHeaded(field(source, "AbbreviatedCaseNumber")) +
            primary(authors) +
            formatSecondaryResponsibilities("", counsel) +
            formatHyphenSection(formatLocationElement(source, city, field(source, "Court")), date),
        Misc: () =>
            primary(authors) +
            formatSecondaryResponsibilities(field(source, "PublicationTitle"), compilers, editors, translators) +
            cityPublisherDate +
            editionSection +
            volumeSection +
            pagesSection,
    };

    const { type } = source;
    const typeName =
        type === "InternetSite" || type === "DocumentFromInternetSite"
            ? SOURCE_TYPE_OPEN + Strings.OnlineCap + SOURCE_TYPE_CLOSE
            : type === "Misc" || type === "ElectronicSource" || type === "Film"
              ? field(source, "Medium") && SOURCE_TYPE_OPEN + field(source, "Medium") + SOURCE_TYPE_CLOSE
              : SOURCE_TYPE_OPEN + SourceNames[type] + SOURCE_TYPE_CLOSE;
    const titles =
        typeName +
        (type === "ElectronicSource" && field(source, "PublicationTitle") ? SHORT_TITLE_HEADER + field(source, "PublicationTitle") : "") +
        (type === "Case" && field(source, "Reporter") ? SHORT_TITLE_HEADER + field(source, "Reporter") : "") +
        (field(source, "ShortTitle") ? SHORT_TITLE_HEADER + field(source, "ShortTitle") : "");
    const head =
        sort === "name"
            ? join(bold(main.corporate ? main.corporate : formatPersons(main.people)), General.Space, field(source, "Title"))
            : bold(field(source, "Title"));
    const text = join(
        head,
        titles,
        sectionsOf[type](),
        formatHyphenSection(field(source, "Comments")),
        formatHyphenSection(field(source, "StandardNumber")),
    );
    // An entry of nothing but spaces, such as a miscellaneous source with no fields, is left empty, with no dot. A
    // non-breaking space isn't a space to XPath's normalize-space
    return /^[ \t\r\n]*$/.test(textOf(text)) ? [] : join(text, General.Dot);
};

/**
 * A source of a citation (the `b:Citation` part of the template that matches `/`), such as "(Baker, 2010 p. 50)": the
 * last name of the first of the people it's named by, with ", et al." when there are more, its year, and the volume or
 * pages cited. It is its tag when it has neither people nor a year
 */
export const formatCitation = ({
    source,
    first,
    last,
    hideAuthor,
    hideYear,
    pages,
    volume,
    prefix,
    suffix,
}: CitedSource): FormattedText => {
    const main = mainOf(source);
    const author0 = main.corporate
        ? main.corporate
        : main.people.length === 0
          ? ""
          : xsl.formatName(main.people[0], Gost.CitationShort) +
            (main.people.length > 1 ? General.AuthorsSeparator + Strings.AndOthersUnCap : "");
    const year0 = fieldOf(source, "Year");
    const author = hideAuthor ? "" : author0;
    const year = hideYear ? "" : year0;
    const volumeCited = formatVolume(volume, Strings.VolumeShortUnCap, Strings.VolumesShortUnCap);
    const pagesCited = formatPages(pages);
    return join(
        first ? General.OpenBracket : "",
        prefix ?? "",
        author,
        year ? (author ? General.ListSeparator : "") + year : "",
        author0 === "" && year0 === "" ? source.tag : "",
        volume || pages
            ? (author || year ? General.Space : "") + (volume && pages ? volume + General.Enum + pages : volumeCited || pagesCited)
            : "",
        suffix ?? "",
        last ? General.CloseBracket : General.GroupSeparator,
    );
};
