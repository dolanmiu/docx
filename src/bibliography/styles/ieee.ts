/**
 * IEEE: citations such as "[1]" or "[1, p. 50]", and a bibliography that is a table of each source's number and its
 * entry, such as "[1] A. Baker, The Art of Pizza, Naples: Pizza Press, 2010.", in the order the sources are cited.
 *
 * Written from Word's style, IEEE2006OfficeOnline.xsl, whose templates each function names. Unlike Word's other styles,
 * it writes people's initials and its lists of people with templates of its own, and has some English words written
 * into it, such as "Available:" and "Artist".
 *
 * @module
 */
import { type FormattedText, type TextLike, italic, join } from "./formatted-text";
import { LOCALS } from "./locals";
import type { StyleDefinition } from "./style";
import {
    type Field,
    type Role,
    type WordPerson,
    type WordSource,
    type WordSourceType,
    fieldOf,
    organizationOf,
    peopleOf,
} from "../word-source";

// The names of some of the style's templates, as the style spells them
// cspell:words Hypen Artcicle

const { General, Strings, APA, SourceNames } = LOCALS;
const SPACE = General.Space;
const DOT = General.Dot;
const LIST = General.ListSeparator;
const DASH = General.FromToDash;
// The style's brackets are APA's secondary ones, which its SecondaryOpen and SecondaryClose read
const OPEN = APA.SecondaryOpen;
const CLOSE = APA.SecondaryClose;

/** Whether the source has any of the fields, as the style's `count(b:Field)!=0` */
const hasAny = (source: WordSource, ...fields: readonly Field[]): boolean => fields.some((field) => fieldOf(source, field) !== "");

/** The text without the spaces, tabs and line feeds at its end (`right-trim`) */
const rightTrim = (text: string): string => text.replace(/[ \t\r\n]+$/, "");

/** The text without the spaces at its start (`left-trim`) */
const leftTrim = (text: string): string => text.replace(/^ +/, "");

/** The text with each occurrence of a string replaced (`FindReplaceString`) */
const findReplace = (text: string, find: string, replacement: string): string => text.split(find).join(replacement);

/** The list separator without its spaces, such as "," (`List_Separator_NoSpace`) */
const LIST_WITHOUT_SPACE = findReplace(LIST, " ", "");

/** Pages, such as "p. 50" or "pp. 50-62", in English whatever the language (`DisplayPageOrPages`) */
const pageOrPages = (cited: string): string => (cited.includes("-") || cited.includes(",") ? `pp. ${cited}` : `p. ${cited}`);

/** The initial of each word of a name, such as "M. A." of "Mary Ann" (`splitAuthorSpace`) */
const splitAuthorSpace = (name: string): string => {
    const space = name.indexOf(" ");
    return space < 0
        ? name.slice(0, 1) + DOT
        : name.slice(0, space).slice(0, 1) + DOT + SPACE + splitAuthorSpace(leftTrim(name.slice(space + 1)));
};

/** The initials of a hyphenated name, such as "J.-P." of "Jean-Paul" (`HandleHypenInAuthor`) */
const handleHyphenInAuthor = (name: string, initials: string = ""): string => {
    const initial = !name.startsWith(DASH) && initials === "" ? name.slice(0, 1) + DOT : "";
    const dash = name.indexOf(DASH);
    if (dash < 0) {
        return initial + initials;
    }
    const after = name.slice(dash + DASH.length);
    return initial + handleHyphenInAuthor(after, initials + DASH + after.slice(0, 1) + DOT);
};

/** The initials of each word of a name, each word's hyphenated parts too, such as "J.-P. A." (`HandleSPaceHypenInAuthor`) */
const handleSpaceHyphenInAuthor = (name: string): string => {
    const space = name.indexOf(" ");
    return space < 0
        ? handleHyphenInAuthor(name)
        : handleHyphenInAuthor(name.slice(0, space)) + SPACE + handleSpaceHyphenInAuthor(leftTrim(name.slice(space + 1)));
};

/** How a list of people writes a first or middle name's initials */
type Initials = (name: string) => string;

/** The initials of a name, which has its trailing spaces trimmed, with hyphenated names' (most lists of people) */
const hyphenated: Initials = (name) =>
    name.includes(DASH) ? handleSpaceHyphenInAuthor(rightTrim(name)) : splitAuthorSpace(rightTrim(name));

/** The initials of a name, hyphenated without its trailing spaces trimmed (a single director's first name) */
const hyphenatedUntrimmed: Initials = (name) => (name.includes(DASH) ? handleSpaceHyphenInAuthor(name) : splitAuthorSpace(rightTrim(name)));

/** The initials of a name, its trailing spaces trimmed, without hyphenated names' (editors after the authors) */
const unhyphenated: Initials = (name) => splitAuthorSpace(rightTrim(name));

/**
 * People as the style lists them: each one's initials and last name, a list separator after each but the last two, and
 * "and" before the last, such as "A. Baker, J. Smith and R. Patel". After the list comes its ending, and after one
 * person, it comes only when they have a last name.
 *
 * @param initials - How the first name's initials are written, then the middle name's
 * @param initialsOfOne - How they're written when there is one person
 */
const namesOf = (
    people: readonly WordPerson[],
    ending: string,
    initials: readonly [Initials, Initials] = [hyphenated, hyphenated],
    initialsOfOne: readonly [Initials, Initials] = initials,
): string => {
    const nameOf = ({ first, middle }: WordPerson, [firstInitials, middleInitials]: readonly [Initials, Initials]): string =>
        (first ? firstInitials(first) + SPACE : "") + (middle ? middleInitials(middle) + SPACE : "");
    if (people.length === 1) {
        const [person] = people;
        return nameOf(person, initialsOfOne) + (person.last ? person.last + ending : "");
    }
    return (
        people
            .map(
                (person, index) =>
                    (index === people.length - 1 ? SPACE + Strings.AndUnCap + SPACE : "") +
                    nameOf(person, initials) +
                    (person.last ? person.last + (index + 2 !== people.length && index + 1 < people.length ? LIST : "") : ""),
            )
            .join("") + ending
    );
};

/** People with a role, their role after them, such as "M. Lane, Composer, " */
const peopleWithRole = (people: readonly WordPerson[], one: string, many: string): string =>
    people.length === 0 ? "" : namesOf(people, LIST) + (people.length === 1 ? one : many);

/**
 * The separator after a book's, a book section's or a miscellaneous source's editors, when they're named in place of
 * its authors (`Seperator`)
 */
const separator = (source: WordSource): string => {
    switch (source.type) {
        case "Book":
        case "Misc":
            return hasAny(source, "Title", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ? LIST : SPACE;
        case "BookSection":
            return hasAny(source, "Title", "BookTitle", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages")
                ? LIST
                : SPACE;
        default:
            return "";
    }
};

/** The editors, named in place of the authors, such as "E. Hemingway, Ed., " (`BibDisplayEditorNL`) */
const editorNL = (source: WordSource): string => {
    const editors = peopleOf(source, "Editor");
    return namesOf(editors, LIST) + (editors.length === 1 ? Strings.EditorShortCap : Strings.EditorsShortCap) + separator(source);
};

/**
 * The editors after the authors, such as "E. Hemingway, Ed., ", when the source has authors (`BibDisplayEditor` and
 * `BibDisplayEditorBook`)
 */
const editor = (source: WordSource): string => {
    const editors = peopleOf(source, "Editor");
    if (editors.length === 0 || (peopleOf(source, "Author").length === 0 && !organizationOf(source, "Author"))) {
        return "";
    }
    return (
        namesOf(editors, LIST, [unhyphenated, unhyphenated]) +
        (editors.length === 1 ? Strings.EditorShortCap : Strings.EditorsShortCap) +
        (hasAny(source, "City", "Publisher", "StateProvince", "Year", "Pages") ? LIST : SPACE)
    );
};

/**
 * The authors, or the organization that wrote it, and a list separator after them when the entry goes on, or a dot. With
 * neither, a book, a book section, a journal article and a miscellaneous source name their editors instead
 *
 * @param following - The fields the entry goes on with
 * @param editorsFollow - Whether the entry goes on with the editors after the authors
 * @param editorsInstead - Whether the editors are named when the source has no authors
 */
const authorsOf = (
    source: WordSource,
    following: readonly Field[],
    {
        editorsFollow = false,
        editorsInstead = false,
        organizationEnding,
    }: { readonly editorsFollow?: boolean; readonly editorsInstead?: boolean; readonly organizationEnding?: string } = {},
): string => {
    const authors = peopleOf(source, "Author");
    if (authors.length > 0) {
        const goesOn = hasAny(source, ...following) || (editorsFollow && peopleOf(source, "Editor").length > 0);
        return namesOf(authors, goesOn ? LIST : DOT);
    }
    const organization = organizationOf(source, "Author");
    if (organization) {
        return organization + (organizationEnding ?? (hasAny(source, ...following) ? LIST : DOT));
    }
    return editorsInstead && peopleOf(source, "Editor").length > 0 ? editorNL(source) : "";
};

/** A book's or a miscellaneous source's authors (`BibDisplayAuthorBook`) */
const authorBook = (source: WordSource): string =>
    authorsOf(source, ["Title", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages"], {
        editorsFollow: true,
        editorsInstead: true,
    });

/** A book section's authors (`BibDisplayAuthorBookSection`) */
const authorBookSection = (source: WordSource): string =>
    authorsOf(source, ["Title", "BookTitle", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages"], {
        editorsFollow: true,
        editorsInstead: true,
    });

/** A website's or a document's authors, whose organization is always followed by a list separator (`BibDisplayAuthorWebsite`) */
const authorWebsite = (source: WordSource): string =>
    authorsOf(source, ["Title", "ProductionCompany", "Year"], { organizationEnding: LIST });

/**
 * An article's authors, in a journal or a periodical. Both look for a journal's name, not a periodical's title
 * (`BibDisplayAuthorJArtcicle`)
 */
const authorJournalArticle = (source: WordSource): string =>
    authorsOf(source, ["Title", "JournalName", "Volume", "Issue", "Year", "Pages"], { editorsInstead: true });

/** A conference paper's authors (`BibDisplayAuthorConPr`) */
const authorConferenceProceedings = (source: WordSource): string => authorsOf(source, ["Title", "ConferenceName", "City", "Year"]);

/** A report's or an electronic source's authors (`BibDisplayAuthorReport`) */
const authorReport = (source: WordSource): string => authorsOf(source, ["Title", "City", "Publisher", "Year"]);

/** A patent's inventors (`BibDisplayAuthorPatent`) */
const authorPatent = (source: WordSource): string => {
    const inventors = peopleOf(source, "Inventor");
    return inventors.length === 0 ? "" : namesOf(inventors, hasAny(source, "Title") ? LIST : DOT);
};

/** A sound recording's composers, or its conductors, or its performers, with their role (`BibDisplayAuthorSoundRec`) */
const authorSoundRecording = (source: WordSource): string => {
    const roles: readonly (readonly [Role, string, string])[] = [
        ["Composer", Strings.ComposerCap, Strings.ComposersCap],
        ["Conductor", Strings.ConductorCap, Strings.ConductorsCap],
        ["Performer", Strings.PerformerCap, Strings.PerformersCap],
    ];
    for (const [role, one, many] of roles) {
        const people = peopleOf(source, role);
        if (people.length > 0) {
            return peopleWithRole(people, one + LIST, many + LIST);
        }
    }
    const performer = organizationOf(source, "Performer");
    return performer ? performer + LIST + Strings.PerformerCap + LIST : "";
};

/** A performance's writers, with their role (`BibDisplayAuthorPerformance`) */
const authorPerformance = (source: WordSource): string =>
    peopleWithRole(peopleOf(source, "Writer"), Strings.WriterCap + LIST, Strings.WritersCap + LIST);

/** An interview's interviewees, with their role in English (`BibDisplayAuthorInterview`) */
const authorInterview = (source: WordSource): string =>
    peopleWithRole(peopleOf(source, "Interviewee"), `Interviewee${LIST}${SPACE}`, `Interviewees${LIST}${SPACE}`);

/** A work of art's artists, with their role in English (`BibDisplayArtist`) */
const artist = (source: WordSource): string =>
    peopleWithRole(peopleOf(source, "Artist"), `Artist${LIST}${SPACE}`, `Artists${LIST}${SPACE}`);

/** A film's directors, with their role. A single director's hyphenated first name isn't trimmed first (`BibDisplayDirector`) */
const director = (source: WordSource): string => {
    const directors = peopleOf(source, "Director");
    if (directors.length === 0) {
        return "";
    }
    return (
        namesOf(directors, LIST, [hyphenated, hyphenated], [hyphenatedUntrimmed, hyphenated]) +
        (directors.length === 1 ? Strings.DirectorCap : Strings.DirectorsCap) +
        LIST
    );
};

/** A title in quotes, and a list separator in the quotes when the entry goes on, or a dot after them */
const quotedTitle = (source: WordSource, goesOn: boolean): string => {
    if (!hasAny(source, "Title")) {
        return "";
    }
    const quoted = General.OpenQuote + rightTrim(fieldOf(source, "Title"));
    return goesOn ? quoted + LIST_WITHOUT_SPACE + General.CloseQuote + SPACE : quoted + General.CloseQuote + DOT;
};

/** A journal article's title (`BibDisplayTitleJournal`) */
const titleJournal = (source: WordSource): string => quotedTitle(source, hasAny(source, "JournalName", "Volume", "Issue", "Pages", "Year"));

/** An article's title in a periodical (`BibDisplayTitleAP`) */
const titleArticleInAPeriodical = (source: WordSource): string => quotedTitle(source, hasAny(source, "Volume", "Issue", "Pages", "Year"));

/** A report's or an electronic source's title (`BibDisplayTitleReport`) */
const titleReport = (source: WordSource): string => quotedTitle(source, hasAny(source, "City", "Year", "Publisher"));

/** A conference paper's title (`BibDisplayTitleConferenceProceedings`) */
const titleConferenceProceedings = (source: WordSource): string => quotedTitle(source, hasAny(source, "ConferenceName", "City", "Year"));

/** A book section's title (`BibDisplayTitleBC`) */
const titleBookSection = (source: WordSource): string =>
    quotedTitle(
        source,
        hasAny(source, "BookTitle", "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ||
            (peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0),
    );

/** A web page's title, with a list separator in the quotes (`BibDisplayTitleWebSite`) */
const titleWebsite = (source: WordSource): string =>
    hasAny(source, "Title")
        ? General.OpenQuote + rightTrim(fieldOf(source, "Title")) + LIST_WITHOUT_SPACE + General.CloseQuote + SPACE
        : "";

/** A patent's title (`BibDisplayTitlePatent`) */
const titlePatent = (source: WordSource): string =>
    hasAny(source, "Title") ? General.OpenQuote + rightTrim(fieldOf(source, "Title")) + General.CloseQuote + DOT + SPACE : "";

/** A book's or a miscellaneous source's title (`BibDisplayTitleBook`) */
const titleBook = (source: WordSource): string => {
    if (!hasAny(source, "Title")) {
        return "";
    }
    const goesOn =
        hasAny(source, "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ||
        (peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0);
    return rightTrim(fieldOf(source, "Title")) + (goesOn ? LIST : DOT);
};

/** A title and a dot (`BibDisplayTitle`, `BibDisplayTitleInt` and `BibDisplayTitlePerformance`) */
const title = (source: WordSource): string => (hasAny(source, "Title") ? rightTrim(fieldOf(source, "Title")) + DOT + SPACE : "");

/** A court case's title (`BibDisplayTitleCase`) */
const titleCase = (source: WordSource): string =>
    hasAny(source, "Title") ? rightTrim(fieldOf(source, "Title")) + (hasAny(source, "Year") ? LIST : DOT) : "";

/** The title of the book a book section is in, after "in" (`BibDisplayBookTitle`) */
const bookTitle = (source: WordSource): FormattedText => {
    if (!hasAny(source, "BookTitle")) {
        return [];
    }
    const goesOn =
        hasAny(source, "Edition", "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ||
        (peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0);
    return join(findReplace(Strings.InNameUnCap, " %1", SPACE) + SPACE, italic(fieldOf(source, "BookTitle")), goesOn ? LIST : DOT);
};

/** The name of the conference a paper is from, after "in" (`BibDisplayConferenceName`) */
const conferenceName = (source: WordSource): FormattedText =>
    hasAny(source, "ConferenceName")
        ? join(
              findReplace(Strings.InNameUnCap, " %1", SPACE) + SPACE,
              italic(fieldOf(source, "ConferenceName")),
              hasAny(source, "City", "Year") ? LIST : DOT,
          )
        : [];

/** A journal's name (`BibDisplayJournalName`) */
const journalName = (source: WordSource): string =>
    hasAny(source, "JournalName") ? fieldOf(source, "JournalName") + (hasAny(source, "Volume", "Issue", "Pages", "Year") ? LIST : DOT) : "";

/** A periodical's title (`BibDisplayJournalNameAP`) */
const periodicalTitle = (source: WordSource): string =>
    hasAny(source, "PeriodicalTitle")
        ? fieldOf(source, "PeriodicalTitle") + (hasAny(source, "Volume", "Issue", "Pages", "Year") ? LIST : DOT)
        : "";

/** A volume, such as "vol. 3", or volumes, such as "Vols. 2-3" */
const volumeOf = (source: WordSource): string => {
    const volume = fieldOf(source, "Volume");
    return volume.includes("-") || volume.includes(",")
        ? findReplace(Strings.VolumesOfShortCap, "%1 of %2", SPACE) + volume
        : SPACE + findReplace(Strings.VolumeShortUnCap, " %1", SPACE) + volume;
};

/** A journal's or a periodical's volume (`BibDisplayVolumeJournal`) */
const volumeJournal = (source: WordSource): string =>
    hasAny(source, "Volume") ? volumeOf(source) + (hasAny(source, "Pages", "Year", "Issue") ? LIST : DOT) : "";

/** A book's volume (`BibDisplayVolumeBook`) */
const volumeBook = (source: WordSource): string => {
    if (!hasAny(source, "Volume")) {
        return "";
    }
    const goesOn =
        hasAny(source, "City", "StateProvince", "Publisher", "Year", "Pages") ||
        (peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0);
    return volumeOf(source) + (goesOn ? LIST : DOT);
};

/** A journal's or a periodical's issue, such as "no. 4" (`BibDisplayIssueJournal`) */
const issueJournal = (source: WordSource): string =>
    hasAny(source, "Issue")
        ? SPACE +
          findReplace(Strings.NumberShortUnCap, " %1", SPACE) +
          fieldOf(source, "Issue") +
          (hasAny(source, "Pages", "Year") ? LIST : DOT)
        : "";

/** An article's pages (`BibDisplayPagesJournal`) */
const pagesJournal = (source: WordSource): string =>
    hasAny(source, "Pages") ? pageOrPages(fieldOf(source, "Pages")) + (hasAny(source, "Year") ? LIST : DOT) : "";

/** A book's pages (`BibDisplayPages`) */
const pagesBook = (source: WordSource): string => (hasAny(source, "Pages") ? pageOrPages(fieldOf(source, "Pages")) + DOT : "");

/** An edition, such as "2nd ed." (`BibDisplayEdition`) */
const edition = (source: WordSource): string => {
    if (!hasAny(source, "Edition")) {
        return "";
    }
    const goesOn =
        hasAny(source, "Volume", "City", "StateProvince", "Publisher", "Year", "Pages") ||
        (peopleOf(source, "Author").length > 0 && peopleOf(source, "Editor").length > 0);
    return fieldOf(source, "Edition") + SPACE + Strings.EditorShortUnCap + (goesOn ? LIST : "");
};

/** A book's or a miscellaneous source's city (`BibDisplayCity`) */
const city = (source: WordSource): string => {
    if (!hasAny(source, "City")) {
        return "";
    }
    const ending =
        hasAny(source, "Publisher") && !hasAny(source, "StateProvince")
            ? General.EnumSeparator
            : hasAny(source, "StateProvince", "Year", "Pages")
              ? LIST
              : DOT;
    return fieldOf(source, "City") + ending;
};

/** A book section's city (`BibDisplayCityBookSection`) */
const cityBookSection = (source: WordSource): string =>
    hasAny(source, "City") ? fieldOf(source, "City") + (hasAny(source, "Publisher", "StateProvince", "Year", "Pages") ? LIST : DOT) : "";

/** A city with a list separator after it when the source has a year, or a dot (`BibDisplayCityReport` and `BibDisplayConfCityConfProc`) */
const cityBeforeYear = (source: WordSource): string =>
    hasAny(source, "City") ? fieldOf(source, "City") + (hasAny(source, "Year") ? LIST : DOT) : "";

/** A state or province (`BibDisplayStateProvinceBook` and `BibDisplayStateProvinceBC`) */
const stateProvince = (source: WordSource): string => {
    if (!hasAny(source, "StateProvince")) {
        return "";
    }
    const ending = hasAny(source, "Publisher") ? General.EnumSeparator + SPACE : hasAny(source, "Year", "Pages") ? LIST : DOT;
    return fieldOf(source, "StateProvince") + ending;
};

/** A report's or an electronic source's publisher (`BibDisplayPublisher`) */
const publisher = (source: WordSource): string =>
    hasAny(source, "Publisher") ? fieldOf(source, "Publisher") + (hasAny(source, "City", "Year") ? LIST : DOT) : "";

/** A book's publisher (`BibDisplayPublisherBC`) */
const publisherBook = (source: WordSource): string =>
    hasAny(source, "Publisher") ? fieldOf(source, "Publisher") + (hasAny(source, "Year", "Pages") ? LIST : DOT) : "";

/** A year and a dot, and a space after it, with or without the year (`BibDisplayYear`) */
const year = (source: WordSource): string => (hasAny(source, "Year") ? fieldOf(source, "Year") + DOT : "") + SPACE;

/** A year and a dot (`BibDisplayYearReport`, `BibDisplayYearCase` and `BibDisplayYearSoundrecording`) */
const yearAndDot = (source: WordSource): string => (hasAny(source, "Year") ? fieldOf(source, "Year") + DOT : "");

/** A book's year, and a space after it, with or without the year (`BibDisplayYearBC`) */
const yearBook = (source: WordSource): string =>
    (hasAny(source, "Year") ? fieldOf(source, "Year") + (hasAny(source, "Pages") ? LIST : DOT) : "") + SPACE;

/**
 * A date, such as "14 March 2018.", or the year alone when it has no month. A date with no year is left out
 * (`BibDisplayDayMonthYearInterview` and `BibDisplayDayMonthYearPatent`)
 */
const dayMonthYear = (source: WordSource): string => {
    if (!hasAny(source, "Year")) {
        return "";
    }
    const month = hasAny(source, "Month");
    const date =
        month && hasAny(source, "Day")
            ? [fieldOf(source, "Day"), fieldOf(source, "Month"), fieldOf(source, "Year")]
            : month
              ? [fieldOf(source, "Month"), fieldOf(source, "Year")]
              : [fieldOf(source, "Year")];
    return date.join(SPACE) + DOT;
};

/** A website's or an article's date, and a space after it (`BibDisplayDayMonthYearWebSiteJournal`) */
const dayMonthYearWebsiteJournal = (source: WordSource): string => dayMonthYear(source) + SPACE;

/** When a website or a document on one was read, such as " [Accessed 3 February 2022]." (`BibDisplayAccessedDates`) */
const accessedDates = (source: WordSource): string => {
    if (!hasAny(source, "YearAccessed")) {
        return "";
    }
    const month = hasAny(source, "MonthAccessed");
    const date =
        month && hasAny(source, "DayAccessed")
            ? [fieldOf(source, "DayAccessed"), fieldOf(source, "MonthAccessed"), fieldOf(source, "YearAccessed")]
            : month && !hasAny(source, "DayAccessed")
              ? [fieldOf(source, "MonthAccessed"), fieldOf(source, "YearAccessed")]
              : [fieldOf(source, "YearAccessed")];
    return SPACE + OPEN + findReplace(Strings.AccessedCap, " %1", SPACE) + date.join(SPACE) + CLOSE + DOT;
};

/** A website's address, after "Available:" in English (`BibDisplayURL`) */
const url = (source: WordSource): string => (hasAny(source, "URL") ? `Available:${SPACE}${fieldOf(source, "URL")}${DOT}` : "");

/** A website's production company (`BibDisplayProductionCompanywebsite`) */
const productionCompanyWebsite = (source: WordSource): string =>
    hasAny(source, "ProductionCompany")
        ? fieldOf(source, "ProductionCompany") + (hasAny(source, "Month", "Day", "Year", "URL") ? LIST : DOT)
        : "";

/** A sound recording's production company (`BibDisplayProductionCompanySRec`) */
const productionCompanySoundRecording = (source: WordSource): string =>
    hasAny(source, "ProductionCompany") ? fieldOf(source, "ProductionCompany") + DOT + SPACE : "";

/** A production company or an institution, and a list separator when the source has a year, or a dot */
const beforeYear = (source: WordSource, field: Field): string =>
    hasAny(source, field) ? fieldOf(source, field) + (hasAny(source, "Year") ? LIST + SPACE : DOT) : "";

/** A film's country or region (`BibDisplayCountryRegionFilm`) */
const countryRegionFilm = (source: WordSource): string =>
    hasAny(source, "CountryRegion")
        ? fieldOf(source, "CountryRegion") + (hasAny(source, "ProductionCompany") ? General.EnumSeparator : DOT)
        : "";

/** A patent's country or region (`BibDisplayCountryRegionPatent`) */
const countryRegionPatent = (source: WordSource): string =>
    hasAny(source, "CountryRegion") ? fieldOf(source, "CountryRegion") + (hasAny(source, "PatentNumber", "Year") ? SPACE : DOT) : "";

/** A patent's number, such as "Patent 7,123,456" (`BibDisplayPatent`) */
const patent = (source: WordSource): string =>
    hasAny(source, "PatentNumber")
        ? findReplace(Strings.PatentCap, " %1", SPACE) + fieldOf(source, "PatentNumber") + (hasAny(source, "Year") ? LIST + SPACE : DOT)
        : "";

/** A kind of source in brackets, such as "[Online]. " */
const kindOf = (kind: string): string => OPEN + kind + CLOSE + DOT + SPACE;

/** A book's entry, with its title in italics for a miscellaneous source */
const bookEntry = (source: WordSource, titleOf: (title: string) => TextLike): TextLike =>
    join(
        authorBook(source),
        titleOf(titleBook(source)),
        edition(source),
        volumeBook(source),
        editor(source),
        city(source),
        stateProvince(source),
        publisherBook(source),
        yearBook(source),
        pagesBook(source),
    );

/** A website's or a document's entry */
const websiteEntry = (source: WordSource): TextLike =>
    join(
        authorWebsite(source),
        titleWebsite(source),
        productionCompanyWebsite(source),
        dayMonthYearWebsiteJournal(source),
        kindOf(Strings.OnlineCap),
        url(source),
        accessedDates(source),
    );

/** A report's or an electronic source's entry */
const reportEntry = (source: WordSource): TextLike =>
    join(authorReport(source), titleReport(source), publisher(source), cityBeforeYear(source), yearAndDot(source));

/** Each type of source's entry in the bibliography (the template that matches `b:Source`) */
const ENTRIES: Readonly<Record<WordSourceType, (source: WordSource) => TextLike>> = {
    Book: (source) => bookEntry(source, (text) => text),
    Misc: (source) => bookEntry(source, italic),
    BookSection: (source) =>
        join(
            authorBookSection(source),
            titleBookSection(source),
            bookTitle(source),
            edition(source),
            volumeBook(source),
            editor(source),
            cityBookSection(source),
            stateProvince(source),
            publisherBook(source),
            yearBook(source),
            pagesBook(source),
        ),
    InternetSite: websiteEntry,
    DocumentFromInternetSite: websiteEntry,
    JournalArticle: (source) =>
        join(
            authorJournalArticle(source),
            titleJournal(source),
            italic(journalName(source)),
            volumeJournal(source),
            issueJournal(source),
            pagesJournal(source),
            dayMonthYearWebsiteJournal(source),
        ),
    ArticleInAPeriodical: (source) =>
        join(
            authorJournalArticle(source),
            titleArticleInAPeriodical(source),
            italic(periodicalTitle(source)),
            volumeJournal(source),
            issueJournal(source),
            pagesJournal(source),
            dayMonthYearWebsiteJournal(source),
        ),
    ConferenceProceedings: (source) =>
        join(
            authorConferenceProceedings(source),
            titleConferenceProceedings(source),
            conferenceName(source),
            cityBeforeYear(source),
            year(source),
        ),
    Report: reportEntry,
    ElectronicSource: reportEntry,
    Art: (source) => join(artist(source), italic(title(source)), kindOf("Art"), beforeYear(source, "Institution"), year(source)),
    SoundRecording: (source) =>
        join(
            authorSoundRecording(source),
            italic(title(source)),
            kindOf(SourceNames.SoundRecording),
            productionCompanySoundRecording(source),
            yearAndDot(source),
        ),
    Performance: (source) =>
        join(
            authorPerformance(source),
            italic(title(source)),
            kindOf("Performance"),
            beforeYear(source, "ProductionCompany"),
            year(source),
        ),
    Interview: (source) => join(authorInterview(source), italic(title(source)), kindOf(Strings.InterviewCap), dayMonthYear(source)),
    Patent: (source) => join(authorPatent(source), titlePatent(source), countryRegionPatent(source), patent(source), dayMonthYear(source)),
    Film: (source) =>
        join(
            director(source),
            italic(title(source)),
            kindOf(SourceNames.Film),
            countryRegionFilm(source),
            beforeYear(source, "ProductionCompany"),
            year(source),
        ),
    Case: (source) => join(italic(titleCase(source)), yearAndDot(source)),
};

/** IEEE, as Word writes it with IEEE2006OfficeOnline.xsl */
export const ieee: StyleDefinition = {
    name: "IEEE",
    file: "IEEE2006OfficeOnline.xsl",
    version: "2006",
    // The source's number, and the pages, after "p." or "pp." in English (`Citation`)
    citation: ({ source, first, last, pages: cited }) =>
        join(first ? OPEN : "", String(source.order), cited ? LIST + pageOrPages(cited) : "", last ? CLOSE : LIST + SPACE),
    // Each source's number and entry, in the order they're cited (`Bibliography` and `BibRefOrder`)
    bibliography: (sources) => ({
        rows: [...sources]
            .sort((a, b) => a.order - b.order)
            .map((source) => [join(OPEN, String(source.order), CLOSE, SPACE), join(ENTRIES[source.type](source))] as const),
    }),
};
