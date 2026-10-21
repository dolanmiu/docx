/**
 * The templates of Word's ISO 690 styles and of GB7714, written in TypeScript. GB.XSL and ISO690.XSL differ in only a few
 * of their templates, and ISO690Nmerical.XSL, ISO 690's numerical style, shares most of theirs: how each type of source
 * is written, its people, its place of publication and its dates.
 *
 * These styles write the names that a source starts with in bold, and its titles in italics. Word reads the HTML they
 * write with quirks, which {@link readHtml} follows: a space between two elements next to each other, and at the end of
 * a copy of a variable after an element, and formatting left on after an element of ISO 690's numerical style that is
 * empty.
 *
 * @module
 */
// cspell:words Countinous MSXML Nmerical
import { type FormattedRun, type FormattedText, textOf } from "./formatted-text";
import { LOCALS } from "./locals";
import type { CitedSource, FormattedBibliography } from "./style";
import { sortByKey, translate, xslTemplates } from "./xsl";
import {
    type Field,
    type Role,
    type WordNames,
    type WordPerson,
    type WordSource,
    type WordSourceType,
    fieldOf,
    organizationOf,
    peopleOf,
} from "../word-source";

const { General, Strings, ISO690 } = LOCALS;

/**
 * Which of the styles is writing: GB7714 and ISO 690 differ in a few of their templates. ISO 690's numerical style
 * writes its entries as ISO 690 by first element and date does
 */
export type Iso690Family = "GB7714" | "ISO 690";
const { appendDot, formatDatePrivate, formatName, needDot, printList, stringFormat, stringFormatDot } = xslTemplates(General);

/**
 * What these styles write into their HTML: text, the text of an `xsl:value-of`, which MSXML keeps as a text node even
 * when it is empty, an element, bold (`<b>`) or italics (`<i>`), or a copy of a variable (`xsl:copy-of`), whose ends are
 * where MSXML writes a line break between elements
 */
export type HtmlNode =
    | string
    | { readonly value: string }
    | { readonly element: "b" | "i"; readonly content: readonly HtmlNode[] }
    | { readonly copy: readonly HtmlNode[] };

/** An element with its content */
export const element = (name: "b" | "i", ...content: readonly HtmlNode[]): HtmlNode => ({ element: name, content });

/** A copy of a variable with its content */
export const copy = (...content: readonly HtmlNode[]): HtmlNode => ({ copy: content });

/** The text of what a style writes, as its string value */
export const textOfHtml = (nodes: readonly HtmlNode[]): string =>
    nodes
        .map((node) =>
            typeof node === "string" ? node : "value" in node ? node.value : textOfHtml("element" in node ? node.content : node.copy),
        )
        .join("");

type Token =
    { readonly text: string } | { readonly open: "b" | "i"; readonly copied: boolean } | { readonly close: "b" | "i" } | "boundary";

/** What a style writes, as the tokens of its HTML. An element is copied when it's in a copy of a variable */
const tokensOf = (nodes: readonly HtmlNode[], copied = false): readonly Token[] =>
    nodes.flatMap((node): readonly Token[] => {
        if (typeof node === "string") {
            return node ? [{ text: node }] : [];
        }
        if ("value" in node) {
            return [{ text: node.value }];
        }
        return "element" in node
            ? [{ open: node.element, copied }, ...tokensOf(node.content, copied), { close: node.element }]
            : ["boundary", ...tokensOf(node.copy, true), "boundary"];
    });

/**
 * Paragraphs of a style's HTML, read as Word reads them: each run of spaces becomes one, as in HTML, and there's none at
 * the start of a paragraph. MSXML writes a line break, which Word reads as a space, between an element and an element
 * after it, and at the end of a copy of a variable between an element and the end of the paragraph.
 *
 * An element written into a variable and copied, with nothing in it, such as the bold of an entry of ISO 690's
 * numerical style with no author, is written as `<b/>`, which Word reads as a start tag that isn't ended: the rest of the
 * bibliography is bold, or in italics. An element with an `xsl:value-of` in it has a text node, though it is empty, so it
 * isn't written that way.
 */
export const readHtml = (paragraphs: readonly (readonly HtmlNode[])[]): readonly FormattedText[] => {
    const marks = { b: 0, i: 0 };
    return paragraphs.map((paragraph) => {
        // eslint-disable-next-line functional/prefer-readonly-type
        const runs: FormattedRun[] = [];
        let lastNode: "text" | "start" | "end" | undefined;
        let boundary = false;
        // A copied element that has nothing written in it yet
        let emptyCopy: "b" | "i" | undefined;
        const lastText = (): string => runs[runs.length - 1]?.text ?? "";
        const space = (): void => {
            if (runs.length > 0 && !lastText().endsWith(" ")) {
                // eslint-disable-next-line functional/immutable-data
                runs.push({ text: " " });
            }
        };
        for (const token of tokensOf(paragraph)) {
            if (token === "boundary") {
                boundary = true;
            } else if ("text" in token) {
                let text = token.text.replace(/[ \t\r\n]+/g, " ");
                if (text.startsWith(" ") && (lastText() === "" || lastText().endsWith(" "))) {
                    text = text.slice(1);
                }
                const run: FormattedRun = { text, ...(marks.b > 0 ? { bold: true } : {}), ...(marks.i > 0 ? { italics: true } : {}) };
                const last = runs[runs.length - 1];
                if (!text) {
                    // Nothing to add
                } else if (last && !!last.bold === !!run.bold && !!last.italics === !!run.italics) {
                    // eslint-disable-next-line functional/immutable-data
                    runs[runs.length - 1] = { ...last, text: last.text + text };
                } else {
                    // eslint-disable-next-line functional/immutable-data
                    runs.push(run);
                }
                lastNode = "text";
                boundary = false;
                emptyCopy = undefined;
            } else if ("open" in token) {
                if (lastNode === "end") {
                    space();
                }
                // eslint-disable-next-line functional/immutable-data
                marks[token.open]++;
                emptyCopy = token.copied ? token.open : undefined;
                lastNode = "start";
                boundary = false;
            } else {
                if (emptyCopy !== token.close) {
                    // eslint-disable-next-line functional/immutable-data
                    marks[token.close]--;
                }
                emptyCopy = undefined;
                lastNode = "end";
                boundary = false;
            }
        }
        if (boundary && lastNode === "end") {
            space();
        }
        return runs;
    });
};

/** The data in italics, as `ApplyItalicTitleNS` and `ApplyItalicFieldNS` write it: `<i>` around a copy of the data */
export const applyItalic = (...data: readonly HtmlNode[]): HtmlNode => element("i", copy(...data));

/**
 * A source as the styles read it after `populateMain`: its fields, of which an interview drops some, its people, and its
 * main contributors, the role whose people it is listed by
 */
// eslint-disable-next-line functional/no-mixed-types -- its fields and people are read as an interview has them
export type PopulatedSource = {
    readonly source: WordSource;
    readonly type: WordSourceType;
    /** A field, or "" when it doesn't have it */
    readonly field: (field: Field) => string;
    /** The people with a role, or the organization with it, if the source has it */
    readonly names: (role: Role) => WordNames | undefined;
    /** The role of its main contributors (`b:MainAuthorType`), or "" when it has none */
    readonly mainRole: Role | "";
    /** Its main contributors (`b:Author/b:Main`): the people with the main role, or the organization */
    readonly main: WordNames;
};

/** The roles each type of source can be listed by, in the order the styles look for them (`MainContributors`) */
const MAIN_ROLES: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor", "Translator"],
    BookSection: ["Author"],
    JournalArticle: ["Author", "Editor"],
    ArticleInAPeriodical: ["Author"],
    ConferenceProceedings: ["Author", "Editor"],
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

/**
 * The string value of the people with a role, as XSL reads an element: each person's last, first and middle names, one
 * after another, or the organization
 */
export const stringOfNames = (names: WordNames | undefined): string =>
    names === undefined
        ? ""
        : "corporate" in names
          ? names.corporate
          : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/**
 * A source as the styles read it, with its main contributors (`populateMain`). An interview with a broadcaster or the
 * title of a broadcast has no editors, translators, compilers or publisher, and one with neither has no station
 */
export const populate = (source: WordSource): PopulatedSource => {
    const { type } = source;
    const broadcast = type === "Interview" && (fieldOf(source, "Broadcaster") !== "" || fieldOf(source, "BroadcastTitle") !== "");
    const names = (role: Role): WordNames | undefined =>
        broadcast && (role === "Editor" || role === "Translator" || role === "Compiler") ? undefined : source.names[role];
    const field = (name: Field): string =>
        (type === "Interview" && !broadcast && name === "Station") || (broadcast && name === "Publisher") ? "" : fieldOf(source, name);
    const mainRole = MAIN_ROLES[type].find((role) => stringOfNames(source.names[role]) !== "") ?? "";
    const corporate = mainRole ? organizationOf(source, mainRole) : "";
    return {
        source,
        type,
        field,
        names,
        mainRole,
        main: corporate ? { corporate } : { people: mainRole ? peopleOf(source, mainRole) : [] },
    };
};

/** What follows a person in a list of people: ", et al." after the first of four or more, ", " or " and " (`formatPersonSeparator`) */
const formatPersonSeparator = (position: number, count: number): string => {
    if (count > 3) {
        // NoCommaBeforeAnd is "no"
        return General.AuthorsSeparator + Strings.AndOthersUnCap;
    }
    if (count - 1 > position) {
        return General.AuthorsSeparator;
    }
    // NoAndBeforeLastAuthor is "no"
    return position === count - 1 ? General.Space + Strings.AndUnCap + General.Space : "";
};

/**
 * People, written as the styles list them: the first followed by ", et al." when there are four or more, and the
 * others' names "First Middle Last", or the main contributors' "Last, First Middle", or the organization (`formatPersons`)
 */
export const formatPersons = (names: WordNames, isMain: boolean): string => {
    if ("corporate" in names) {
        return names.corporate;
    }
    const people = names.people.length >= 4 ? names.people.slice(0, 1) : names.people;
    return people
        .map(
            (person: WordPerson, index) =>
                formatName(person, isMain ? ISO690.MainAuthors : ISO690.SecondaryAuthors) +
                formatPersonSeparator(index + 1, names.people.length),
        )
        .join("");
};

/**
 * What the main contributors are, after their names, such as "ed.", by their role (`GetMainAuthorTitle`). The template
 * compares whether they're an organization, a string, with `true()`, which a string always is, so it doesn't depend on how
 * many of them there are
 */
const mainAuthorTitle = (source: PopulatedSource): string => {
    switch (source.mainRole) {
        case "Editor":
            return Strings.EditorShortUnCap;
        case "Translator":
            return Strings.TranslatorShortUnCap;
        case "Performer":
            return Strings.PerformerShortUnCap;
        case "Composer":
            return Strings.ComposerShortUnCapIso;
        case "Conductor":
            return Strings.ConductorShortUnCap;
        case "ProducerName":
            return Strings.ProducerShortUnCap;
        case "Writer":
            return source.type === "Film" ? Strings.WriterShortUnCap : "";
        case "Counsel":
            return Strings.CounselShortUnCap;
        case "Compiler":
            return Strings.CompilerShortUnCap;
        default:
            return "";
    }
};

/** The main contributors, and what they are, such as "Garcia, Lucia, [ed.]" (`formatMain`) */
export const formatMain = (source: PopulatedSource): string => {
    if ("people" in source.main && source.main.people.length === 0) {
        return "";
    }
    const title = mainAuthorTitle(source);
    return formatPersons(source.main, true) + (title ? General.ListSeparator + ISO690.GeneralOpen + title + ISO690.GeneralClose : "");
};

/**
 * The people with a role who aren't the main contributors, after what they are, such as "[ed.] Ernest Hemingway. ",
 * as the variables of the bibliography's templates write them (such as `Editors` with `formatEditor`). They're written
 * when the source has the role and its people aren't its main contributors
 */
export const formatRole = (source: PopulatedSource, role: Role, label: string, labelledBy: Role = role): string => {
    const names = source.names(role);
    // `b:Author/b:Main != b:Author/b:Editor` compares the string values of the elements, and is false without editors
    if (names === undefined || stringOfNames(source.main) === stringOfNames(names)) {
        return "";
    }
    // formatInterviewer tests whether there are people interviewed, rather than interviewers
    if (stringOfNames(source.names(labelledBy)) === "") {
        return General.Space;
    }
    const people = formatPersons(names, false);
    return ISO690.GeneralOpen + label + ISO690.GeneralClose + General.Space + people + needDot(people) + General.Space;
};

/** Whether a string has text other than spaces, as `string-length(normalize-space($text)) > 0` */
export const hasText = (text: string): boolean => /[^ \t\r\n]/.test(text);

/** The types of source written with their place of publication and publisher */
const PUBLISHED: ReadonlySet<WordSourceType> = new Set([
    "Book",
    "BookSection",
    "JournalArticle",
    "ArticleInAPeriodical",
    "ConferenceProceedings",
    "Report",
    "SoundRecording",
    "Performance",
    "Art",
    "Interview",
    "ElectronicSource",
    "Case",
    "Misc",
]);

/** The types of source whose publisher, or broadcaster, follows their place */
const BY_PUBLISHER: ReadonlySet<WordSourceType> = new Set([
    "Book",
    "BookSection",
    "JournalArticle",
    "ArticleInAPeriodical",
    "ConferenceProceedings",
    "Interview",
    "Report",
    "Misc",
]);

/** The publisher of a source, or who produced it, after its place: "s.n." when it has none (`after` of `formatLocation`) */
const publisherOf = (source: PopulatedSource): string => {
    const { type, field } = source;
    if (field("Publisher") && type === "Report") {
        return field("Publisher");
    }
    if (field("ProductionCompany") && (type === "SoundRecording" || type === "Performance")) {
        return field("ProductionCompany");
    }
    if ((field("ProductionCompany") || field("Publisher")) && type === "ElectronicSource") {
        return (
            field("Publisher") +
            (field("Publisher") && field("ProductionCompany") ? General.ListSeparator : "") +
            field("ProductionCompany")
        );
    }
    if (field("Court") && type === "Case") {
        return field("Court");
    }
    if (type === "Art" && (field("Publisher") || field("Year"))) {
        return field("Publisher") + (field("Publisher") && field("Year") ? General.ListSeparator : "") + field("Year");
    }
    if ((field("Publisher") || (field("Broadcaster") && type === "Interview")) && BY_PUBLISHER.has(type)) {
        return (type === "Interview" ? field("Broadcaster") : "") + field("Publisher");
    }
    return !field("Broadcaster") && type === "Interview" ? "" : Strings.SineNomineShort;
};

/**
 * Whether a source with no place has nothing to write in its place either: none of the publisher, the institution, the
 * production company or the court its type is written with (`nothing` of `formatLocation`)
 */
const hasNoPublisher = (source: PopulatedSource): boolean => {
    const { type, field } = source;
    return !(
        (field("Publisher") && type === "Report") ||
        (field("Institution") && type === "Art") ||
        (field("ProductionCompany") && (type === "SoundRecording" || type === "Performance")) ||
        ((field("ProductionCompany") || field("Publisher")) && type === "ElectronicSource") ||
        (field("Court") && type === "Case") ||
        ((field("Publisher") || (field("Broadcaster") && type === "Interview")) && (BY_PUBLISHER.has(type) || type === "Art"))
    );
};

/**
 * Where a source was published, and by whom, such as "Chicago : Adventure Works Press", "s.l." and "s.n." when it has
 * no place or publisher, or for a film, its production company and distributor (`formatLocation`)
 */
export const formatLocation = (source: PopulatedSource): string => {
    const { type, field } = source;
    if (type === "Film") {
        return (
            field("ProductionCompany") +
            (field("ProductionCompany") && field("Distributor") ? General.GroupSeparator : "") +
            field("Distributor")
        );
    }
    if (type === "Patent") {
        return field("CountryRegion");
    }
    if (!PUBLISHED.has(type)) {
        return "";
    }
    const hasPlace = !!field("City") || (!!field("Theater") && type === "Performance");
    if (!hasPlace && hasNoPublisher(source)) {
        return "";
    }
    const separated = (first: string): string => first + (first && field("City") ? General.ListSeparator + General.Space : "");
    const place = hasPlace
        ? (type === "Performance" ? separated(field("Theater")) : "") +
          (type === "ElectronicSource" ? separated(field("Edition")) : "") +
          (type === "Interview" ? separated(field("Station")) : "") +
          (type === "Art" && field("Institution") && field("City") ? General.ListSeparator : "") +
          field("City")
        : (type === "Art" && field("Institution") ? General.ListSeparator : "") + Strings.SineLocoShort;
    const state = field("StateProvince");
    const country = field("CountryRegion");
    const region =
        type === "Performance" || type === "Art" || type === "ElectronicSource" || type === "Case" || type === "Misc"
            ? (state || country ? General.ListSeparator : "") + state + (state && country ? General.ListSeparator : "") + country
            : "";
    const publisher = publisherOf(source);
    return (
        (type === "Art" ? field("Institution") : "") +
        place +
        region +
        (hasText(publisher) ? General.NonBreakingSpace + General.EnumSeparator + publisher : "")
    );
};

/** The date a source was published, such as "14 March 2018" (`formatDayMonthYear`) */
export const formatDayMonthYear = (source: PopulatedSource): string =>
    formatDatePrivate(source.field("Day"), source.field("Month"), source.field("Year"), ISO690.Date);

/**
 * The date a website was read, such as "[Cited: 3 February 2022.]". The template tests for the day it was read three
 * times, so it is written only when it has the day (`formatDayMonthYearAccessed`)
 */
export const formatDayMonthYearAccessed = (source: PopulatedSource): string => {
    if (!source.field("DayAccessed")) {
        return "";
    }
    const date = formatDatePrivate(
        source.field("DayAccessed"),
        source.field("MonthAccessed"),
        source.field("YearAccessed"),
        ISO690.DateAccessed,
    );
    return ISO690.GeneralOpen + textOf(stringFormatDot(Strings.CitedCap, date)) + ISO690.GeneralClose;
};

/** The first, second and third that it has, with ", " between them, and a dot after them (`templateJ` and `templateC`) */
const joinWithDot = (...parts: readonly string[]): string => appendDot(parts.filter((part) => part).join(General.ListSeparator));

/** "vol." or "vols.", for a volume such as "2" or "2-3", or "Vol." and "Vols." in a bibliography */
export const volumeFormatOf = (volume: string, single: string, several: string): string =>
    volume.includes(",") || translate(volume, General.Hyphens, "") !== volume ? several : single;

/** Pages such as "p. 50" or "pp. 50-62", the way the styles write them in a bibliography and in a citation */
export const pagesOf = (pages: string): string =>
    pages
        ? (pages.includes(",") || translate(pages, General.Hyphens, "") !== pages ? Strings.PagesCountinousShort : Strings.PageShort) +
          General.Space +
          pages
        : "";

/** A source's entry in a bibliography after its title, its main contributors and the year: what each type has */
type Entry = {
    /** What starts the entry, before the main contributors: a journal article's or a paper's title, in italics */
    readonly start: readonly HtmlNode[];
    /** What follows the main contributors, by the type of source */
    readonly rest: readonly HtmlNode[];
};

/**
 * A source's entry in the bibliography, without its main contributors (the `xsl:choose` by `b:SourceType`, and the
 * bibliography's variables). The title of a journal article or a paper is "—." when it is the same as the one before's.
 * GB7714 writes a space after a website's version and date, or a report's department and institution, by different
 * fields than ISO 690
 */
export const entryOf = (source: PopulatedSource, previous: PopulatedSource | undefined, style: Iso690Family): Entry => {
    const { type, field } = source;
    const italicWithDot = (text: string): readonly HtmlNode[] => (text ? [applyItalic(appendDot(text) + General.Space)] : []);
    const spaced = (text: string): string => (text ? General.Space + text + General.Dot : "");

    const title = italicWithDot(field("Title"));
    const titleOfMonographParts = field("Title") ? appendDot(field("Title")) + General.Space : "";
    const volume = field("Volume")
        ? textOf(stringFormat(volumeFormatOf(field("Volume"), Strings.VolumeShortCap, Strings.VolumesShortCap), field("Volume")))
        : "";
    const pages = pagesOf(field("Pages"));
    const dayMonthYear = formatDayMonthYear(source);
    const location = formatLocation(source);
    const comments = spaced(field("Comments"));
    const standardNumber = spaced(field("StandardNumber"));
    const editors = formatRole(source, "Editor", Strings.EditorShortUnCap);
    const translators = formatRole(source, "Translator", Strings.TranslatorShortUnCap);
    const performers = formatRole(source, "Performer", Strings.PerformerShortUnCap);
    const producers = formatRole(source, "ProducerName", Strings.ProducerShortUnCap);
    const compilers = formatRole(source, "Compiler", Strings.CompilerShortUnCapIso);
    const medium = field("Medium") ? ISO690.GeneralOpen + field("Medium") + ISO690.GeneralClose : "";
    const mediumDot = medium ? medium + General.Dot + General.Space : "";
    const list = (...items: readonly string[]): string => textOf(printList(items));
    const spaceAndList = (...items: readonly string[]): readonly HtmlNode[] => {
        const result = list(...items);
        return result ? [General.Space, copy(result)] : [];
    };
    const websiteTitle = [
        ...italicWithDot(field("InternetSiteTitle")),
        ISO690.GeneralOpen + Strings.OnlineCap + ISO690.GeneralClose + General.Space,
    ];
    const website = [
        joinWithDot(field("Version"), type === "InternetSite" ? field("ProductionCompany") : "", dayMonthYear) +
            (field("Version") || dayMonthYear || (style === "ISO 690" && field("ProductionCompany")) ? General.Space : ""),
        formatDayMonthYearAccessed(source),
        comments,
        spaced(field("URL")),
        standardNumber,
    ];

    const start =
        type === "ConferenceProceedings" || type === "JournalArticle"
            ? [
                  applyItalic(
                      previous &&
                          (previous.type === "JournalArticle" || previous.type === "ConferenceProceedings") &&
                          previous.field("Title") !== "" &&
                          previous.field("Title") === field("Title")
                          ? ISO690.SameAuthor + General.Dot
                          : copy(titleOfMonographParts),
                  ),
              ]
            : [];

    const rest = ((): readonly HtmlNode[] => {
        switch (type) {
            case "Book":
                return [
                    copy(...title),
                    editors,
                    translators,
                    field("Edition") ? appendDot(field("Edition")) + General.Space : "",
                    list(location, field("Year")),
                    pages ? General.Space + appendDot(pages) : "",
                    ...spaceAndList(volume, comments),
                    standardNumber,
                ];
            case "BookSection":
                return [
                    copy(titleOfMonographParts),
                    formatRole(source, "BookAuthor", Strings.BookAuthorShortUnCap),
                    editors,
                    translators,
                    copy(...italicWithDot(field("BookTitle"))),
                    field("Edition") ? appendDot(field("Edition")) + General.Space : "",
                    // The chapter number, between the volume and the pages, is a field Word's sources don't have
                    list(location, field("Year"), volume, pages),
                    comments,
                ];
            case "JournalArticle":
                return [
                    editors,
                    field("Issue") ? field("Issue") + General.ListSeparator : "",
                    list(location, dayMonthYear, field("JournalName"), volume, pages),
                    comments,
                    standardNumber,
                ];
            case "ArticleInAPeriodical":
                return [
                    copy(titleOfMonographParts),
                    editors,
                    copy(...italicWithDot(field("PeriodicalTitle"))),
                    list(field("Edition"), dayMonthYear, volume, field("Issue"), pages),
                    comments,
                ];
            case "ConferenceProceedings":
                return [
                    editors,
                    list(location, field("Year")),
                    copy(field("ConferenceName") ? General.Space + appendDot(field("ConferenceName")) : ""),
                    ...spaceAndList(volume, pages),
                    comments,
                    standardNumber,
                ];
            case "Report":
                return [
                    copy(...title),
                    joinWithDot(field("Department"), field("Institution")) +
                        (field("Department") || field("Institution") || (style === "GB7714" && field("ProductionCompany"))
                            ? General.Space
                            : ""),
                    list(location, field("Year")),
                    ...spaceAndList(pages, field("ThesisType")),
                    comments,
                    standardNumber,
                ];
            case "SoundRecording":
                return [
                    copy(titleOfMonographParts),
                    performers,
                    formatRole(source, "Composer", Strings.ComposerShortUnCapIso),
                    formatRole(source, "Conductor", Strings.ConductorShortUnCap),
                    producers,
                    copy(...italicWithDot(field("AlbumTitle"))),
                    copy(medium ? medium + General.Space : ""),
                    list(location, field("Year")),
                    comments,
                    standardNumber,
                ];
            case "Performance":
                return [
                    copy(...title),
                    formatRole(source, "Director", Strings.DirectorShortUnCap),
                    performers,
                    producers,
                    list(location, dayMonthYear),
                    comments,
                    standardNumber,
                ];
            case "Art":
                return [copy(...title), list(location), comments];
            case "DocumentFromInternetSite":
                return [copy(titleOfMonographParts), copy(...websiteTitle), ...website];
            case "InternetSite":
                return [textOfHtml(title), copy(...websiteTitle), ...website];
            case "Film":
                return [
                    copy(...title),
                    mediumDot,
                    formatRole(source, "Writer", Strings.WriterShortUnCap),
                    performers,
                    producers,
                    list(location, field("Year")),
                    comments,
                    standardNumber,
                ];
            case "Interview": {
                const broadcastTitle = field("BroadcastTitle") ? appendDot(field("BroadcastTitle")) + General.Space : "";
                return [
                    !field("Broadcaster") && !field("BroadcastTitle") ? applyItalic({ value: textOfHtml(title) }) : textOfHtml(title),
                    formatRole(source, "Interviewer", Strings.IntervieweeShortUnCap, "Interviewee"),
                    editors,
                    translators,
                    compilers,
                    broadcastTitle ? applyItalic({ value: broadcastTitle }) : "",
                    list(location, dayMonthYear),
                    ...spaceAndList(pages),
                    comments,
                    standardNumber,
                ];
            }
            case "Patent":
                return [
                    copy(...title),
                    copy(...(field("PatentNumber") ? [applyItalic(field("PatentNumber") + General.Space)] : [])),
                    editors,
                    translators,
                    list(location, dayMonthYear),
                    field("Type") ? General.Space + appendDot(field("Type")) : "",
                    comments,
                ];
            case "ElectronicSource":
                return [
                    copy(...title),
                    copy(medium ? medium + General.Space : ""),
                    editors,
                    producers,
                    translators,
                    list(location, dayMonthYear),
                    ...spaceAndList(field("PublicationTitle"), volume ? General.Space + appendDot(volume) : ""),
                    comments,
                    standardNumber,
                ];
            case "Case":
                return [
                    copy(...title),
                    copy(field("CaseNumber") ? field("CaseNumber") + General.ListSeparator : ""),
                    copy(field("AbbreviatedCaseNumber") ? field("AbbreviatedCaseNumber") + General.Dot + General.Space : ""),
                    formatRole(source, "Counsel", Strings.CounselShortUnCap),
                    list(location, dayMonthYear),
                    spaced(field("Reporter")),
                    comments,
                ];
            default:
                return [
                    copy(titleOfMonographParts),
                    field("Edition"),
                    General.Space,
                    editors,
                    compilers,
                    translators,
                    applyItalic({ value: textOfHtml(italicWithDot(field("PublicationTitle"))) }),
                    mediumDot,
                    list(location, dayMonthYear),
                    ...spaceAndList(volume, field("Issue"), pages),
                    comments,
                    standardNumber,
                ];
        }
    })();

    return { start, rest };
};

/** Whether a source is a journal article or a paper, which these styles start with its title */
export const startsWithTitle = (source: PopulatedSource | undefined): boolean =>
    source?.type === "JournalArticle" || source?.type === "ConferenceProceedings";

/** Whether the source before has the same main contributors, as the string values of their elements */
export const hasSameMain = (source: PopulatedSource, previous: PopulatedSource | undefined): boolean =>
    previous !== undefined && stringOfNames(previous.main) === stringOfNames(source.main);

/**
 * A citation's volume and pages, such as "vol. 2", "p. 50" or "2:50", after a space when the citation has something
 * before them
 *
 * @param separator - Between a volume and pages: ":" for ISO 690 by first element and date, ": " for its numerical style
 */
export const citedVolumeAndPages = (volume: string, pages: string, separator: string, spaced: boolean): string => {
    if (!volume && !pages) {
        return "";
    }
    const cited =
        volume && pages
            ? volume + separator + pages
            : volume
              ? textOf(stringFormat(volumeFormatOf(volume, Strings.VolumeShortUnCap, Strings.VolumesShortUnCap), volume))
              : pagesOf(pages);
    return (spaced ? General.Space : "") + cited;
};

/** The patterns GB7714 writes the first of a citation's people with: Word's simple patterns, the last name */
const GB7714_CITATION = { FML: General.SimpleAuthor.L, FM: General.SimpleAuthor.F, ML: General.SimpleAuthor.L, FL: General.SimpleAuthor.L };

/**
 * What a source is sorted by in the bibliography (`b:SortingString` of `populateMain`): a journal article's or a paper's
 * title, then its main contributors, then any other source's title
 */
const sortingStringOf = (source: PopulatedSource): string => {
    const title = source.field("Title");
    const author = formatPersons(source.main, true);
    return (
        (startsWithTitle(source) && title ? General.Space + title : "") +
        (author ? General.Space + author : "") +
        (title && !startsWithTitle(source) ? General.Space + title : "")
    );
};

/**
 * A source of a citation, as ISO 690 by first element and date, and GB7714, write it: the main contributors, or for
 * a journal article or a paper its title, then the year, such as "(Baker, 2010 p. 50)". A source with no contributors,
 * title or year is cited by its tag, and in GB7714 one with no contributors or year (the template's `b:Citation`)
 */
export const firstElementCitation =
    (style: Iso690Family): ((cited: CitedSource) => FormattedText) =>
    (cited: CitedSource): FormattedText => {
        const source = populate(cited.source);
        const { field, main } = source;
        const title = field("ShortTitle") || field("Title");
        const year = field("Year");
        const people = "people" in main ? main.people : [];
        const author =
            startsWithTitle(source) && field("Title")
                ? field("Title")
                : "corporate" in main
                  ? main.corporate
                  : // NoCommaBeforeAnd is "no"
                    (people.length > 0 ? formatName(people[0], style === "GB7714" ? GB7714_CITATION : ISO690.CitationShort) : "") +
                    (people.length > 1 ? General.AuthorsSeparator + Strings.AndOthersUnCap : "");
        const shownAuthor = cited.hideAuthor ? "" : author;
        const shownYear = cited.hideYear ? "" : year;
        return [
            {
                text:
                    (cited.first ? General.OpenBracket : "") +
                    (cited.prefix ?? "") +
                    shownAuthor +
                    (shownYear ? (shownAuthor ? General.ListSeparator : "") + shownYear : "") +
                    (!author && (style === "GB7714" || !title) && !year ? cited.source.tag : "") +
                    citedVolumeAndPages(cited.volume, cited.pages, General.Enum, !!shownAuthor || !!shownYear) +
                    (cited.suffix ?? "") +
                    (cited.last ? General.CloseBracket : General.GroupSeparator),
            },
        ];
    };

/**
 * The bibliography as ISO 690 by first element and date, and GB7714, write it: sorted by its sources' main
 * contributors, each with the year after them in bold, such as "**Baker, Anna. 2010.** _The Art of Pizza._", or "—."
 * for the same contributors as the source before (the template's `b:Bibliography`)
 */
export const firstElementBibliography =
    (style: Iso690Family): ((sources: readonly WordSource[]) => FormattedBibliography) =>
    (sources: readonly WordSource[]): FormattedBibliography => {
        const sorted = sortByKey(sources.map(populate), sortingStringOf);
        const paragraphs = sorted.map((source, index): readonly HtmlNode[] => {
            const previous = sorted[index - 1];
            const main = formatMain(source);
            const { start, rest } = entryOf(source, previous, style);
            const year = source.field("Year");
            const named =
                startsWithTitle(previous) || startsWithTitle(source) || !hasSameMain(source, previous)
                    ? [copy(main), needDot(main)]
                    : [stringOfNames(source.main) ? ISO690.SameAuthor + General.Dot : ""];
            return [...start, element("b", ...named, year ? General.Space + year + General.Dot : ""), General.Space, ...rest];
        });
        return { paragraphs: readHtml(paragraphs), hangingIndent: false };
    };
