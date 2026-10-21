/**
 * Harvard - Anglia: Word's `HarvardAnglia2008OfficeOnline.xsl`, written in TypeScript.
 *
 * Citations name each source's authors and year, such as "(Baker, 2010)". The bibliography lists the sources by author,
 * each with its year after the authors, such as "Baker, A., 2010. The Art of Pizza. London: Baker Books.".
 *
 * Each function follows the XSL template or variable named in its description, including where that doesn't do what it
 * looks like it should, so the citations and bibliography are the ones Word writes.
 *
 * @module
 */
// The names of the XSL's templates and parameters
// cspell:words Hypen templ Unavailale
import { type FormattedText, LINE_BREAK, italic, join, textOf, underline } from "./formatted-text";
import { LOCALS } from "./locals";
import type { CitedSource, StyleDefinition } from "./style";
import { sortByKey, translate, xslTemplates } from "./xsl";
import {
    type Role,
    type WordNames,
    type WordPerson,
    type WordSource,
    type WordSourceType,
    fieldOf,
    organizationOf,
    peopleOf,
} from "../word-source";

const general = LOCALS.General;
const strings = LOCALS.Strings;
const xsl = xslTemplates(general);
// The wording the style reads from APA's: the "&" before the last person, and the square brackets
const apaWording = LOCALS.APA;

/** "&" with a space each side, between the last two people (`templ_prop_BeforeLastAuthor`) */
const AND = general.Space + apaWording.BeforeLastAuthor + general.Space;

/** What the bibliography names a source by when it has nobody to name it by, which the style writes as it is */
const ANONYMOUS = "Anon., ";

/** The roles a source is named by, in the order the style looks for them (`MainContributors`, `MainImportantContributors`) */
const MAIN_CONTRIBUTORS: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor"],
    BookSection: ["Author", "Editor"],
    ConferenceProceedings: ["Author", "Editor"],
    Misc: ["Author", "Editor"],
    JournalArticle: ["Author", "Editor"],
    ArticleInAPeriodical: ["Author", "Editor"],
    InternetSite: ["Author"],
    ElectronicSource: ["Author"],
    Report: ["Author"],
    DocumentFromInternetSite: ["Author"],
    SoundRecording: ["Composer", "Conductor", "Performer"],
    Performance: ["Writer"],
    Art: ["Artist"],
    Interview: ["Interviewee"],
    Patent: ["Inventor"],
    Case: [],
    Film: [],
};

/** The text of the people with a role, or of the organization, as `string-length(b:Author/b:Role)` reads it */
const namesText = (names: WordNames | undefined): string =>
    !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/** The first of the roles the source is named by that has anybody's name in it */
const mainContributorsOf = (source: WordSource): Role | undefined =>
    MAIN_CONTRIBUTORS[source.type].find((role) => namesText(source.names[role]) !== "");

/** The text with each part replaced, left to right (`FindReplaceString`) */
const findReplaceString = (originalString: string, stringToBeReplaced: string, stringReplacement: string): string =>
    originalString.split(stringToBeReplaced).join(stringReplacement);

/** The text without the spaces, tabs and line breaks at its end (`right-trim`) */
const rightTrim = (s: string): string => s.replace(/[ \t\r\n]+$/, "");

/** The text without the spaces at its start (`left-trim`) */
const leftTrim = (s: string): string => s.replace(/^ +/, "");

/** The initials of a name, each with a dot, such as "M. A." of "Mary Ann" (`splitAuthorSpace`) */
const splitAuthorSpace = (first: string): string => {
    const space = first.indexOf(" ");
    return space < 0
        ? first.slice(0, 1) + general.Dot
        : first.slice(0, space).slice(0, 1) + general.Dot + general.Space + splitAuthorSpace(leftTrim(first.slice(space + 1)));
};

/** The initials of a name with hyphens, such as "J.-P." of "Jean-Paul" (`HandleHypenInAuthor`) */
const handleHypenInAuthor = (authour: string, retVal = ""): string => {
    const dash = general.FromToDash;
    const initial = !authour.startsWith(dash) && retVal === "" ? authour.slice(0, 1) + general.Dot : "";
    const index = authour.indexOf(dash);
    if (index < 0) {
        return initial + retVal;
    }
    const after = authour.slice(index + dash.length);
    return initial + handleHypenInAuthor(after, retVal + dash + after.slice(0, 1) + general.Dot);
};

/** The initials of each word of a name with hyphens, such as "M. J.-P." of "Mary Jean-Paul" (`HandleSPaceHypenInAuthor`) */
const handleSpaceHypenInAuthor = (author: string): string => {
    const space = author.indexOf(" ");
    return space < 0
        ? handleHypenInAuthor(author)
        : handleHypenInAuthor(author.slice(0, space)) + general.Space + handleSpaceHypenInAuthor(leftTrim(author.slice(space + 1)));
};

/** The initials of a first or middle name, with or without hyphens (`xsl:when test="contains(b:First,$prop_APA_FromToDash)"`) */
const initialsOf = (name: string): string =>
    name.includes(general.FromToDash) ? handleSpaceHypenInAuthor(rightTrim(name)) : splitAuthorSpace(rightTrim(name));

/**
 * People, last name first, such as "Smith, J. & Jones, M. A., ", or the first of five or more and "et al., " (the
 * people of `BibDisplayAuthor`, which `BibDisplayArtist`, `BibDisplayAuthorSoundRec` and the others write the same way)
 */
const bibDisplayPeople = (people: readonly WordPerson[]): string => {
    if (people.length >= 5) {
        const [{ last, first, middle }] = people;
        return (
            (last ? last + general.ListSeparator : "") +
            // A first name with a hyphen has no space after it, so what follows it runs on, as in "Lee, J.-P.et al., "
            (first ? initialsOf(first) + (first.includes(general.FromToDash) ? "" : general.Space) : "") +
            (middle ? initialsOf(middle) + general.Space : "") +
            strings.AndOthersUnCap +
            general.ListSeparator
        );
    }
    return people
        .map(({ last, first, middle }, index) => {
            const beforeLast = index === people.length - 2;
            return (
                (last ? last + (!first && !middle && beforeLast ? AND : general.ListSeparator) : "") +
                (first ? initialsOf(first) + (middle ? general.Space : beforeLast ? AND : general.ListSeparator) : "") +
                (middle ? initialsOf(middle) + (beforeLast ? AND : general.ListSeparator) : "")
            );
        })
        .join("");
};

/**
 * The editors, last name first, such as "Hall, G., ed." or "Garcia, L. & Nguyen, B. eds.", which a source with no
 * authors is listed by (`BibDisplayEditorNL`)
 */
const bibDisplayEditorNL = (editors: readonly WordPerson[]): string => {
    const [{ last, first, middle }] = editors;
    if (editors.length === 1) {
        return (
            (last ? last + (first || middle ? general.ListSeparator : general.Space) : "") +
            (first ? initialsOf(first) + (middle ? general.Space : general.ListSeparator) : "") +
            (middle ? initialsOf(middle) + general.Space : "") +
            strings.EditorShortUnCap
        );
    }
    if (editors.length >= 5) {
        return (
            (last ? last + general.ListSeparator : "") +
            (first ? initialsOf(first) + general.Space : "") +
            (middle ? initialsOf(middle) + general.Space : "") +
            strings.AndOthersUnCap +
            general.Space +
            strings.UnCapEditorsShort
        );
    }
    return (
        editors
            .map((editor, index) => {
                const beforeLast = index === editors.length - 2;
                const after = index === editors.length - 1 ? general.Space : general.ListSeparator;
                // Its "&" after a last name is only for an editor with no last name, so it never writes one
                return (
                    (editor.last ? editor.last + general.ListSeparator : "") +
                    (editor.first ? initialsOf(editor.first) + (editor.middle ? general.Space : beforeLast ? AND : after) : "") +
                    (editor.middle ? initialsOf(editor.middle) + (beforeLast ? AND : after) : "")
                );
            })
            .join("") + strings.UnCapEditorsShort
    );
};

/**
 * The authors, or else the organization that is the author, or else when it is asked for the editors, or "Anon., "
 * (`BibDisplayAuthor`, and its `DisplayEditorIfAuthorUnavailale`)
 */
const bibDisplayAuthor = (source: WordSource, displayEditorIfAuthorUnavailable = false): string => {
    const authors = peopleOf(source, "Author");
    const corporate = organizationOf(source, "Author");
    const editors = peopleOf(source, "Editor");
    if (authors.length) {
        return bibDisplayPeople(authors);
    }
    if (corporate) {
        return corporate + general.ListSeparator;
    }
    return editors.length && displayEditorIfAuthorUnavailable ? bibDisplayEditorNL(editors) + general.ListSeparator : ANONYMOUS;
};

/**
 * The people with a role, or "Anon., " (`BibDisplayArtist`, and `BibDisplayAuthorPerformance` and
 * `BibDisplayAuthorInterview` with the writers and interviewees)
 */
const bibDisplayArtist = (people: readonly WordPerson[]): string => (people.length ? bibDisplayPeople(people) : ANONYMOUS);

/** The inventors, or else the organization that is the author, or "Anon., " (`BibDisplayAuthorPatent`) */
const bibDisplayAuthorPatent = (source: WordSource): string => {
    const inventors = peopleOf(source, "Inventor");
    const corporate = organizationOf(source, "Author");
    return inventors.length ? bibDisplayPeople(inventors) : corporate ? corporate + general.ListSeparator : ANONYMOUS;
};

/** The composers, or else the conductors or the performers, or the organization that performs, or "Anon., " (`BibDisplayAuthorSoundRec`) */
const bibDisplayAuthorSoundRec = (source: WordSource): string => {
    const people = [peopleOf(source, "Composer"), peopleOf(source, "Conductor"), peopleOf(source, "Performer")].find((list) => list.length);
    const corporate = organizationOf(source, "Performer");
    return people ? bibDisplayPeople(people) : corporate ? corporate + general.ListSeparator : ANONYMOUS;
};

/**
 * The editors of the book a section is in, first name first, such as "G. Hall, ed. ", when the section has authors
 * (`BibDisplayEditor`)
 */
const bibDisplayEditor = (source: WordSource): string => {
    const editors = peopleOf(source, "Editor");
    if (!peopleOf(source, "Author").length && !organizationOf(source, "Author")) {
        return "";
    }
    const [{ last, first, middle }] = editors;
    if (editors.length === 1) {
        return (
            (first ? splitAuthorSpace(rightTrim(first)) + general.Space : "") +
            (middle ? splitAuthorSpace(rightTrim(middle)) + general.Space : "") +
            (last ? last + general.ListSeparator : "") +
            strings.EditorShortUnCap +
            general.Space
        );
    }
    if (editors.length >= 5) {
        return (
            (first ? splitAuthorSpace(rightTrim(first)) + general.Space : "") +
            (middle ? splitAuthorSpace(rightTrim(middle)) + general.Space : "") +
            (last ? last + general.ListSeparator : "") +
            strings.AndOthersUnCap +
            general.Space +
            strings.UnCapEditorsShort +
            general.Space
        );
    }
    return (
        editors
            .map((editor, index) => {
                const beforeLast = index === editors.length - 2;
                const end = beforeLast ? AND : general.ListSeparator;
                return (
                    (editor.first
                        ? splitAuthorSpace(rightTrim(editor.first)) + (!editor.middle && !editor.last ? end : general.Space)
                        : "") +
                    (editor.middle ? splitAuthorSpace(rightTrim(editor.middle)) + (!editor.last ? end : general.Space) : "") +
                    (editor.last ? editor.last + end : "")
                );
            })
            .join("") +
        strings.UnCapEditorsShort +
        general.Space
    );
};

/** "Directed by John Smith. ", or by several directors, when the film has any (`BibDisplayDirector`) */
const bibDisplayDirector = (source: WordSource): string => {
    const directors = peopleOf(source, "Director");
    const directorName = directors
        .map(({ last, first, middle }, index) => {
            const isLast = index === directors.length - 1;
            // A first or middle name that ends the last of several directors has a dot and no space, as in "Ann Bo.Italy"
            const end = !isLast ? general.ListSeparator : directors.length === 1 ? general.Dot + general.Space : general.Dot;
            return (
                (first ? first + (last || middle ? general.Space : end) : "") +
                (middle ? middle + (last ? general.Space : end) : "") +
                (last ? last + (isLast ? general.Dot + general.Space : general.ListSeparator) : "")
            );
        })
        .join("");
    return directorName ? findReplaceString(strings.DirectedByCap, "%1", directorName) : "";
};

/** The year and a dot, or "n.d.", and a space (`BibDisplayYear`) */
const bibDisplayYear = (source: WordSource): string =>
    (fieldOf(source, "Year") ? fieldOf(source, "Year") + general.Dot : strings.NoDateShortUnCap) + general.Space;

/** A case's year in brackets, or "(n.d.)", with a dot when it has no reporter, and a space (`BibDisplayYearCase`) */
const bibDisplayYearCase = (source: WordSource): string =>
    general.OpenBracket +
    (fieldOf(source, "Year") || strings.NoDateShortUnCap) +
    general.CloseBracket +
    (fieldOf(source, "Reporter") ? "" : general.Dot) +
    general.Space;

/** An interview's date, such as "(3 May 2010).", or its year, or "n.d." (`BibDisplayDayMonthYear`) */
const bibDisplayDayMonthYear = (source: WordSource): string => {
    const day = fieldOf(source, "Day");
    const month = fieldOf(source, "Month");
    const year = fieldOf(source, "Year");
    if (!year) {
        return strings.NoDateShortUnCap;
    }
    return month
        ? general.OpenBracket + (day ? day + general.Space : "") + month + general.Space + year + general.CloseBracket + general.Dot
        : year + general.Dot;
};

/** The title, a dot and a space (`BibDisplayTitle`) */
const bibDisplayTitle = (source: WordSource): string =>
    fieldOf(source, "Title") ? rightTrim(fieldOf(source, "Title")) + general.Dot + general.Space : "";

/** The title and a space (`BibDisplayTitleInt`, and `BibDisplayTitleCase`, which is the same) */
const bibDisplayTitleInt = (source: WordSource): string => (fieldOf(source, "Title") ? fieldOf(source, "Title") + general.Space : "");

/** The title, a comma and a space (`BibDisplayTitleES`) */
const bibDisplayTitleES = (source: WordSource): string =>
    fieldOf(source, "Title") ? fieldOf(source, "Title") + general.ListSeparator + general.Space : "";

/** A section's title and a dot, and a space when it has authors (`BibDisplayTitleBC`) */
const bibDisplayTitleBC = (source: WordSource): string =>
    fieldOf(source, "Title") ? fieldOf(source, "Title") + general.Dot + (peopleOf(source, "Author").length ? general.Space : "") : "";

/** The title of the book a section is in, a dot and a space (`BibDisplayBookTitle`) */
const bibDisplayBookTitle = (source: WordSource): string =>
    fieldOf(source, "BookTitle") ? fieldOf(source, "BookTitle") + general.Dot + general.Space : "";

/** The journal's name, and a comma when more follows or else a dot (`BibDisplayJournalName`) */
const bibDisplayJournalName = (source: WordSource): string => {
    const more = ["Month", "Pages", "Volume", "Issue"] as const;
    return fieldOf(source, "JournalName")
        ? fieldOf(source, "JournalName") +
              (more.some((field) => fieldOf(source, field)) ? general.ListSeparator + general.Space : general.Dot)
        : "";
};

/** The volume and issue, such as "7(2)", "Volume 7" or "Issue 2", and a comma before pages or else a dot */
const volumeAndIssueOf = (source: WordSource): string => {
    const volume = fieldOf(source, "Volume");
    const issue = fieldOf(source, "Issue");
    const end = fieldOf(source, "Pages") ? general.ListSeparator : general.Dot;
    if (volume) {
        return (
            (issue ? volume + general.OpenBracket + issue + general.CloseBracket : findReplaceString(strings.VolumeCap, "%1", volume)) + end
        );
    }
    // "Issue" is the style's own
    return issue ? `Issue${general.Space}${issue}${end}` : "";
};

/** A journal article's date, then its volume and issue (`BibDisplayVolumeIssueJA`) */
const bibDisplayVolumeIssueJA = (source: WordSource): string => {
    const day = fieldOf(source, "Day");
    const month = fieldOf(source, "Month");
    const date = month
        ? (day ? day + general.Space + month : month) +
          ((fieldOf(source, "Volume") || fieldOf(source, "Issue")) && fieldOf(source, "Pages") ? general.ListSeparator : general.Dot)
        : "";
    return date + volumeAndIssueOf(source);
};

/** A periodical's title in italics, its date, then its volume and issue (`BibDisplayVolumeIssue`) */
const bibDisplayVolumeIssue = (source: WordSource): FormattedText => {
    const periodicalTitle = fieldOf(source, "PeriodicalTitle");
    const day = fieldOf(source, "Day");
    const month = fieldOf(source, "Month");
    const afterTitle = ["Month", "Volume", "Issue", "Pages"] as const;
    const afterMonth = ["Volume", "Issue", "Pages"] as const;
    const end = (fields: readonly ("Month" | "Volume" | "Issue" | "Pages")[]): string =>
        (fields.some((field) => fieldOf(source, field)) ? general.ListSeparator : general.Dot) + general.Space;
    return join(
        periodicalTitle ? join(italic(periodicalTitle), end(afterTitle)) : "",
        month ? (day ? day + general.Space : "") + month + end(afterMonth) : "",
        volumeAndIssueOf(source),
    );
};

/** The city, with its state or province in brackets, or "s.l.", and a colon (`BibDisplayCity`) */
const bibDisplayCity = (source: WordSource): string => {
    const city = fieldOf(source, "City");
    const state = fieldOf(source, "StateProvince");
    const place = city && state ? city + general.OpenBracket + state + general.CloseBracket : city || state || strings.SineLocoShort;
    // With no place, the colon has no space after it
    return place + (city || state ? general.EnumSeparator : general.Enum);
};

/** The city, or "s.l.", and ": " (`BibDisplayCityReport`) */
const bibDisplayCityReport = (source: WordSource): string => (fieldOf(source, "City") || strings.SineLocoShort) + general.EnumSeparator;

/** The city, or "s.l.", and a comma (`BibDisplayConfCityConfProc`) */
const bibDisplayConfCityConfProc = (source: WordSource): string =>
    fieldOf(source, "City")
        ? fieldOf(source, "City") + general.ListSeparator + general.Space
        : strings.SineLocoShort + general.ListSeparator;

/** The publisher and a dot, or "s.n." (`BibDisplayPublisher`) */
const bibDisplayPublisher = (source: WordSource): string =>
    fieldOf(source, "Publisher") ? fieldOf(source, "Publisher") + general.Dot : strings.SineNomineShort;

/**
 * The publisher, or "s.n.", and a comma before pages, or else a dot after a publisher (`BibDisplayConfPublisher`, and
 * `BibDisplayPublisherBC`, which is the same)
 */
const bibDisplayConfPublisher = (source: WordSource): string => {
    const pages = fieldOf(source, "Pages");
    return fieldOf(source, "Publisher")
        ? fieldOf(source, "Publisher") + (pages ? general.ListSeparator + general.Space : general.Dot)
        : strings.SineNomineShort + (pages ? general.ListSeparator + general.Space : "");
};

/** Pages, such as "p. 5" or "pp. 5-9", which the style writes in English whatever the language (`DisplayPageOrPages`) */
const displayPageOrPages = (pages: string): string => (pages.includes("-") || pages.includes(",") ? "pp. " : "p. ") + pages;

/** The pages and a dot (`BibDisplayPages`) */
const bibDisplayPages = (source: WordSource): string =>
    fieldOf(source, "Pages") ? displayPageOrPages(fieldOf(source, "Pages")) + general.Dot : "";

/** The edition and "ed. ", which is the style's word for an editor (`BibDisplayEdition`) */
const bibDisplayEdition = (source: WordSource): string =>
    fieldOf(source, "Edition") ? fieldOf(source, "Edition") + general.Space + strings.EditorShortUnCap + general.Space : "";

/** "[Online]", and a space before where it is or a dot (`BibDisplayStrOnline`) */
const bibDisplayStrOnline = (source: WordSource): string =>
    apaWording.SecondaryOpen +
    strings.OnlineCap +
    apaWording.SecondaryClose +
    (fieldOf(source, "URL") || fieldOf(source, "YearAccessed") ? general.Space : general.Dot);

/** "Available at: " and the address, underlined, on a line of its own (`BibDisplayURL`) */
const bibDisplayURL = (source: WordSource): FormattedText =>
    // "Available at:" is the style's own
    fieldOf(source, "URL") ? join(LINE_BREAK, "Available at:", general.Space, underline(fieldOf(source, "URL"))) : [];

/** "[Accessed 20 April 2023].", on a line of its own (`BibDisplayAccessedDates`) */
const bibDisplayAccessedDates = (source: WordSource): FormattedText => {
    const year = fieldOf(source, "YearAccessed");
    const month = fieldOf(source, "MonthAccessed");
    const day = fieldOf(source, "DayAccessed");
    if (!year) {
        return [];
    }
    const date = month ? (day ? day + general.Space : "") + month + general.Space + year : year;
    return join(
        LINE_BREAK,
        general.Space +
            apaWording.SecondaryOpen +
            findReplaceString(strings.AccessedCap, " %1", general.Space) +
            date +
            apaWording.SecondaryClose +
            general.Dot,
    );
};

/** The country or region, and a comma before the patent's number or else a dot, or "s.l. " (`BibDisplayCountryRegionPatent`) */
const bibDisplayCountryRegionPatent = (source: WordSource): string =>
    fieldOf(source, "CountryRegion")
        ? fieldOf(source, "CountryRegion") + (fieldOf(source, "PatentNumber") ? general.ListSeparator : general.Dot)
        : strings.SineLocoShort + general.Space;

/** "Patent No. 123." (`BibDisplayPatentNumber`) */
const bibDisplayPatentNumber = (source: WordSource): string =>
    fieldOf(source, "PatentNumber")
        ? findReplaceString(strings.PatentNumberShortCap, "%1", fieldOf(source, "PatentNumber")) + general.Dot
        : "";

/** The country or region, or "s.l.", and ": " (`BibDisplayCountryRegion`) */
const bibDisplayCountryRegion = (source: WordSource): string =>
    (fieldOf(source, "CountryRegion") || strings.SineLocoShort) + general.EnumSeparator;

/** The production company and a dot, or "s.n." (`BibDisplayProductionCompany`) */
const bibDisplayProductionCompany = (source: WordSource): string =>
    fieldOf(source, "ProductionCompany") ? fieldOf(source, "ProductionCompany") + general.Dot : strings.SineNomineShort;

/** The text of a source's entry in the bibliography, by its type (`ProceedBibliography`) */
const proceedBibliography = (source: WordSource): FormattedText => {
    const field = (name: "Institution" | "ProductionCompany" | "Reporter"): string => fieldOf(source, name);
    switch (source.type) {
        case "BookSection":
            return join(
                bibDisplayAuthor(source, true),
                bibDisplayYear(source),
                bibDisplayTitleBC(source),
                general.Space,
                findReplaceString(strings.InNameCap, " %1", general.EnumSeparator),
                peopleOf(source, "Editor").length
                    ? bibDisplayEditor(source) + (peopleOf(source, "Author").length ? general.Space : "")
                    : "",
                italic(bibDisplayBookTitle(source)),
                bibDisplayEdition(source),
                bibDisplayCity(source),
                bibDisplayConfPublisher(source),
                bibDisplayPages(source),
            );
        case "InternetSite":
        case "DocumentFromInternetSite":
            return join(
                bibDisplayAuthor(source),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                bibDisplayStrOnline(source),
                bibDisplayURL(source),
                bibDisplayAccessedDates(source),
            );
        case "JournalArticle":
            return join(
                bibDisplayAuthor(source, true),
                bibDisplayYear(source),
                bibDisplayTitle(source),
                italic(bibDisplayJournalName(source)),
                bibDisplayVolumeIssueJA(source),
                bibDisplayPages(source),
            );
        case "ArticleInAPeriodical":
            return join(
                bibDisplayAuthor(source, true),
                bibDisplayYear(source),
                bibDisplayTitle(source),
                bibDisplayVolumeIssue(source),
                bibDisplayPages(source),
            );
        case "ConferenceProceedings":
            return join(
                bibDisplayAuthor(source, true),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                bibDisplayConfCityConfProc(source),
                bibDisplayConfPublisher(source),
                bibDisplayPages(source),
            );
        case "Report":
            return join(
                bibDisplayAuthor(source),
                bibDisplayYear(source),
                italic(bibDisplayTitleES(source)),
                bibDisplayCityReport(source),
                bibDisplayPublisher(source),
            );
        case "ElectronicSource":
            return join(
                bibDisplayAuthor(source),
                bibDisplayYear(source),
                italic(bibDisplayTitleES(source)),
                bibDisplayCityReport(source),
                bibDisplayConfPublisher(source),
            );
        case "Art":
            // BibDisplayStrArt, and BibDisplayInstitutionArt
            return join(
                bibDisplayArtist(peopleOf(source, "Artist")),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                apaWording.SecondaryOpen + LOCALS.SourceNames.Art + apaWording.SecondaryClose,
                field("Institution") ? general.Space + general.OpenBracket + field("Institution") + general.CloseBracket : "",
                general.Dot,
            );
        case "SoundRecording":
            // BibDisplayStrSoundRecording, and BibDisplayProductionCompanySRec
            return join(
                bibDisplayAuthorSoundRec(source),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                apaWording.SecondaryOpen + LOCALS.SourceNames.SoundRecording + apaWording.SecondaryClose,
                field("ProductionCompany")
                    ? general.Space + general.OpenBracket + field("ProductionCompany") + general.CloseBracket + general.Dot
                    : general.Dot,
            );
        case "Performance":
            // BibDisplayProductionCompanyPerformance: the city as BibDisplayCityReport writes it, and the company
            return join(
                bibDisplayArtist(peopleOf(source, "Writer")),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                bibDisplayCityReport(source),
                bibDisplayProductionCompany(source),
            );
        case "Interview":
            // BibDisplayStrInterview
            return join(
                bibDisplayArtist(peopleOf(source, "Interviewee")),
                bibDisplayYear(source),
                italic(bibDisplayTitleInt(source)),
                apaWording.SecondaryOpen + strings.InterviewCap + apaWording.SecondaryClose + general.Space,
                bibDisplayDayMonthYear(source),
            );
        case "Patent":
            return join(
                bibDisplayAuthorPatent(source),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                bibDisplayCountryRegionPatent(source),
                bibDisplayPatentNumber(source),
            );
        case "Film":
            // BibDisplayStrFilm
            return join(
                italic(bibDisplayTitle(source)),
                bibDisplayYear(source),
                apaWording.SecondaryOpen + LOCALS.SourceNames.Film + apaWording.SecondaryClose + general.Space,
                bibDisplayDirector(source),
                bibDisplayCountryRegion(source),
                bibDisplayProductionCompany(source),
            );
        case "Case":
            // BibDisplayReporter
            return join(
                italic(bibDisplayTitleInt(source)),
                bibDisplayYearCase(source),
                field("Reporter") ? field("Reporter") + general.Dot + general.Space : "",
            );
        default:
            // A book, or a source of another kind
            return join(
                bibDisplayAuthor(source, true),
                bibDisplayYear(source),
                italic(bibDisplayTitle(source)),
                bibDisplayEdition(source),
                bibDisplayCity(source),
                bibDisplayPublisher(source),
            );
    }
};

/** The initials of a name, with no dots or spaces, such as "MA" of "Mary Ann" (`splitNameSpace`) */
const splitNameSpace = (first: string): string => {
    const space = first.indexOf(" ");
    return space < 0 ? first.slice(0, 1) : first.slice(0, space).slice(0, 1) + splitNameSpace(first.slice(space + 1));
};

/** The first four people, each as their last name and initials with nothing between, such as "SmithJJonesMA" (`formatPersonsAuthor`) */
const formatPersonsAuthor = (people: readonly WordPerson[]): string =>
    people
        .slice(0, 4)
        .map(({ last, first, middle }) => last + splitNameSpace(first) + splitNameSpace(middle))
        .join("");

/**
 * A source's key in the order of the bibliography: who it is named by, or "Anon.", its year, or "n.d.", and its title,
 * or a case's or film's title and year (`b:SortingString`)
 */
const sortingStringOf = (source: WordSource): string => {
    const role = mainContributorsOf(source);
    const title = fieldOf(source, "Title");
    // "n.d." and "Anon." are the style's own
    const year = fieldOf(source, "Year") || "n.d.";
    if (source.type === "Case" || source.type === "Film") {
        return title + year;
    }
    const author = (role ? organizationOf(source, role) || formatPersonsAuthor(peopleOf(source, role)) : "") || "Anon.";
    return author + year + title;
};

/**
 * How a citation names a source by its main people: one person's last name, two joined by "&", or the first of three
 * or more and "et al.", or else the organization that is the author, or "Anon." (`MainContributors`, as the citation
 * calls it, with no `returnType`)
 */
const mainContributorsNameOf = (source: WordSource): string => {
    const role = mainContributorsOf(source);
    const people = role ? peopleOf(source, role) : [];
    if (!people.length) {
        return organizationOf(source, "Author") || "Anon.";
    }
    // Each person's last name, or if nobody has one their first names, or their middle names, as the XSL's `xsl:when`s
    const part = people.some((person) => person.last) ? "last" : people.some((person) => person.first) ? "first" : "middle";
    // The first person's who has one, as `value-of select="b:NameList/b:Person/b:Last"`
    const [name] = people.map((person) => person[part]).filter((value) => value !== "");
    // " & " and ", et al." are the style's own
    return people.length === 1 ? name : people.length === 2 ? `${name} & ${people[1][part]}` : `${name}, et al.`;
};

/** The volume or pages cited, such as "2:5", "vol. 2" or "pp. 5-9" (`VolumePages`) */
const volumePages = (volume: string, pages: string): string => {
    if (volume && pages) {
        return volume + general.Enum + pages;
    }
    if (volume) {
        // A volume with a comma or a hyphen is several
        const several = volume.includes(",") || translate(volume, general.Hyphens, "") !== volume;
        return textOf(xsl.stringFormat(several ? strings.VolumesShortUnCap : strings.VolumeShortUnCap, volume));
    }
    return pages ? displayPageOrPages(pages) : "";
};

/**
 * A source of a citation, such as "(Baker, 2010, p. 50" before the next source's "; ": a case or a film by its title, and
 * any other source by its people (`Citation`)
 */
const citation = (cited: CitedSource): FormattedText => {
    const { source } = cited;
    const year = fieldOf(source, "Year") || strings.NoDateShortUnCap;
    const volpagesInfo = volumePages(cited.volume, cited.pages);
    const isCaseOrFilm = source.type === "Case" || source.type === "Film";
    const name = isCaseOrFilm ? (cited.hideTitle ? "" : fieldOf(source, "Title")) : cited.hideAuthor ? "" : mainContributorsNameOf(source);

    let text = cited.first ? general.OpenBracket : "";
    text += cited.prefix ?? "";
    if (name) {
        text += name + (!cited.hideYear || volpagesInfo ? general.ListSeparator : "");
    }
    if (!cited.hideYear) {
        text += year + (volpagesInfo ? general.ListSeparator : "");
    }
    text += volpagesInfo;
    text += cited.suffix ?? "";
    text += cited.last ? general.CloseBracket : general.GroupSeparator;
    return join(text);
};

/** Harvard - Anglia: Word's `HarvardAnglia2008OfficeOnline.xsl` */
export const harvardAnglia: StyleDefinition = {
    name: "Harvard - Anglia",
    file: "HarvardAnglia2008OfficeOnline.xsl",
    version: "2008",
    citation,
    bibliography: (sources) => ({
        paragraphs: sortByKey(sources, sortingStringOf).map(proceedBibliography),
        hangingIndent: false,
    }),
};
