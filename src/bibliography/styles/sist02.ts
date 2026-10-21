/**
 * Word's SIST02 style (SIST02.XSL), which writes citations and bibliographies as the Japanese standard SIST 02 has them,
 * with full-width punctuation: citations such as "（Baker，2010p.50）", and a bibliography of entries such as
 * "**SmithJohn, JonesMaryAnn** *Dough and Fire．*London，Crust Books，2011．", sorted by their authors.
 *
 * The style writes its own punctuation in place of Word's: full-width commas, dots and brackets, and nothing for a space,
 * so names and the parts of an entry are written one after another. Word reads a space between two of its bold or italic
 * elements that follow each other, as it does in each of the styles that write them.
 *
 * @module
 */
import { type FormattedText, bold, formatted, italic, join, textOf } from "./formatted-text";
import { LOCALS, type NamePatterns } from "./locals";
import type { CitedSource, FormattedBibliography, StyleDefinition } from "./style";
import { type Punctuation, sortByKey, translate, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordPerson, type WordSource, type WordSourceType, fieldOf } from "../word-source";

const { General, ISO690, SIST, Strings } = LOCALS;

// The style's punctuation, which it writes itself rather than reading Word's. Its spaces, the separator of a group and
// the dot after an initial are empty
const DOT = "．";
const LIST_SEPARATOR = "，";
const ENUM = "，";
const OPEN_BRACKET = "（";
const CLOSE_BRACKET = "）";

const PUNCTUATION: Punctuation = {
    Dot: DOT,
    DotInitial: "",
    EndChars: General.EndChars,
    Hyphens: General.Hyphens,
    ListSeparator: LIST_SEPARATOR,
    GroupSeparator: "",
    SimpleAuthor: General.SimpleAuthor,
    SimpleDate: General.SimpleDate,
};
const xsl = xslTemplates(PUNCTUATION);

/** The names of the people a source is named by, last name first: the style's own, which are Word's (`SIST_MainAuthors`) */
const MAIN_AUTHORS: NamePatterns = { FML: "%L%F%M", FM: "%F%M", ML: "%L%M", FL: "%L%F" };

/** The names of the other people: the style's own (`SIST_SecondaryAuthors`), with a middle name before a first name */
const SECONDARY_AUTHORS: NamePatterns = { FML: "%L%M%F", FM: "%M%F", ML: "%L%M", FL: "%L%F" };

/** The name of the first person in a citation: the last name, or the first name of someone who has no last name */
const CITATION_AUTHOR: NamePatterns = {
    FML: General.SimpleAuthor.L,
    FM: General.SimpleAuthor.F,
    ML: General.SimpleAuthor.L,
    FL: General.SimpleAuthor.L,
};

/** The roles a type of source is named by, in the order they're looked for (`MainContributors`) */
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
 * What the people a source is named by are, after their names, such as "[ed.]", by their role (`GetMainAuthorTitle`).
 * The template means to write the plural for more than one person, but its test of whether they are an organization
 * is always true, so it writes the singular
 */
const MAIN_AUTHOR_TITLES: Readonly<Partial<Record<Role, string>>> = {
    Editor: Strings.EditorShortUnCap,
    Translator: Strings.TranslatorShortUnCap,
    Performer: Strings.PerformerShortUnCap,
    Composer: Strings.ComposerShortUnCapIso,
    Conductor: Strings.ConductorShortUnCap,
    ProducerName: Strings.ProducerShortUnCap,
    Writer: Strings.WriterShortUnCap,
    Counsel: Strings.CounselShortUnCap,
    Compiler: Strings.CompilerShortUnCap,
};

/** The types whose entries start with their titles in italics, and whose citations name them by their titles */
const isTitledFirst = (type: WordSourceType): boolean => type === "JournalArticle" || type === "ConferenceProceedings";

/** The string value of the people with a role, or the organization: their names one after another, as XPath reads it */
const stringOf = (names: WordNames): string =>
    "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/** The people or organization a source is named by, and their role (`b:Author/b:Main` and `b:MainAuthorType`) */
type Main = { readonly role: Role; readonly names: WordNames };

/**
 * The people or organization a source is named by: those of the first of its type's roles it has a name in
 * (`MainContributors` and `populateMain`), if it has any
 */
const mainOf = (source: WordSource): Main | undefined =>
    MAIN_ROLES[source.type].flatMap((role) => {
        const names = source.names[role];
        return names !== undefined && stringOf(names).length > 0 ? [{ role, names }] : [];
    })[0];

/** The string value of the people or organization a source is named by, or "" (`b:Author/b:Main`) */
const mainStringOf = (source: WordSource): string => {
    const main = mainOf(source);
    return main === undefined ? "" : stringOf(main.names);
};

/**
 * The separator after a person of a list of people (`formatPersonSeparator`): "et al." after the first of four or more,
 * and a comma between the others
 */
const formatPersonSeparator = (position: number, count: number): string =>
    count > 3 ? Strings.AndOthersUnCap : count > position ? General.AuthorsSeparator : "";

/** People with a role, or the organization that has it (`formatPersons`). Of four or more people, only the first is written */
const formatPersons = (names: WordNames, patterns: NamePatterns): string => {
    if ("corporate" in names) {
        return names.corporate;
    }
    const count = names.people.length;
    const shown: readonly WordPerson[] = count >= 4 ? names.people.slice(0, 1) : names.people;
    return shown.map((person, index) => xsl.formatName(person, patterns) + formatPersonSeparator(index + 1, count)).join("");
};

/**
 * The people a source is named by, last name first, and what they are, such as "GarciaLucia, NguyenBao，[ed.]"
 * (`formatMain`)
 */
const formatMain = (source: WordSource): string => {
    const main = mainOf(source);
    if (main === undefined) {
        return "";
    }
    const title = main.role === "Writer" && source.type !== "Film" ? "" : (MAIN_AUTHOR_TITLES[main.role] ?? "");
    return formatPersons(main.names, MAIN_AUTHORS) + (title ? LIST_SEPARATOR + SIST.GeneralOpen + title + SIST.GeneralClose : "");
};

/** The volume, such as "Vol. 3", or "Vols. 2-3" for more than one */
const formatVolume = (volume: string, single: string, plural: string): string => {
    if (volume.length === 0) {
        return "";
    }
    const format = volume.includes(",") ? plural : translate(volume, General.Hyphens, "") === volume ? single : plural;
    return textOf(xsl.stringFormat(format, volume));
};

/** The pages, such as "p.5", or "pp.10-20" for more than one */
const formatPages = (pages: string): string => {
    if (pages.length === 0) {
        return "";
    }
    const prefix = pages.includes(",")
        ? Strings.PagesCountinousShort
        : translate(pages, General.Hyphens, "") === pages
          ? Strings.PageShort
          : Strings.PagesCountinousShort;
    return prefix + pages;
};

/** Parts with a comma between them, each written only when it isn't empty, and a dot after them (`templateC` and `templateJ`) */
const formatParts = (...parts: readonly string[]): string => xsl.appendDot(parts.filter((part) => part.length > 0).join(LIST_SEPARATOR));

/** Text in a bold or italic element of the style's HTML */
type Element = { readonly tag: "b" | "i"; readonly text: string };

/** What the style writes into an entry: text, or text in an element, which Word reads a space before when it follows another */
type Node = string | Element;

const boldElement = (text: string): Element => ({ tag: "b", text });

/** Text in italics (`ApplyItalicTitleNS` and `ApplyItalicFieldNS`), which the style writes as an element even when empty */
const italicElement = (text: string): Element => ({ tag: "i", text });

/** Text in italics, or nothing when it is empty, as the style's variables of titles write it */
const italicUnlessEmpty = (text: string): readonly Node[] => (text ? [italicElement(text)] : []);

const SPACE_BETWEEN_ELEMENTS: FormattedText = [{ text: " " }];

/**
 * An entry, as Word reads the style's HTML of it: with a space between two elements that follow each other, even when
 * the first is empty, as Word's XSLT processor writes a line break between them. Word doesn't read one at the end of the
 * paragraph
 */
const paragraphOf = (nodes: readonly Node[]): FormattedText => {
    const parts = nodes
        .filter((node) => node !== "")
        .flatMap((node, index, written) =>
            typeof node === "string"
                ? [formatted(node)]
                : [
                      ...(typeof written[index - 1] === "object" ? [SPACE_BETWEEN_ELEMENTS] : []),
                      node.tag === "b" ? bold(node.text) : italic(node.text),
                  ],
        )
        .filter((part) => part.length > 0);
    return join(...(parts[parts.length - 1] === SPACE_BETWEEN_ELEMENTS ? parts.slice(0, -1) : parts));
};

/**
 * Where a source was published and by whom, such as "London，Crust Books", with "s.l." or "s.n." for one that's missing
 * (`formatLocation`). A source of most types with neither has nothing
 */
const formatLocation = (type: WordSourceType, field: (name: Field) => string): string => {
    if (type === "Film") {
        // The style's separator of a group, between them, is empty
        return field("ProductionCompany") + field("Distributor");
    }
    if (type === "Patent") {
        return field("CountryRegion");
    }
    if (type === "DocumentFromInternetSite" || type === "InternetSite") {
        return "";
    }
    const published = [
        "Book",
        "BookSection",
        "JournalArticle",
        "ArticleInAPeriodical",
        "ConferenceProceedings",
        "Interview",
        "Report",
        "Misc",
    ].includes(type);
    const hasPlace = field("City") !== "" || (type === "Performance" && field("Theater") !== "");
    const hasPublisher =
        (type === "Report" && field("Publisher") !== "") ||
        (type === "Art" && field("Institution") !== "") ||
        ((type === "SoundRecording" || type === "Performance") && field("ProductionCompany") !== "") ||
        (type === "ElectronicSource" && (field("ProductionCompany") !== "" || field("Publisher") !== "")) ||
        (type === "Case" && field("Court") !== "") ||
        ((field("Publisher") !== "" || (type === "Interview" && field("Broadcaster") !== "")) && (published || type === "Art"));
    if (!hasPlace && !hasPublisher) {
        return "";
    }

    const before = (prefixType: WordSourceType, prefix: Field): string =>
        type === prefixType ? field(prefix) + (field(prefix) !== "" && field("City") !== "" ? LIST_SEPARATOR : "") : "";
    const place = hasPlace
        ? before("Performance", "Theater") +
          before("ElectronicSource", "Edition") +
          before("Interview", "Station") +
          (type === "Art" && field("Institution") !== "" && field("City") !== "" ? LIST_SEPARATOR : "") +
          field("City")
        : (type === "Art" && field("Institution") !== "" ? LIST_SEPARATOR : "") + Strings.SineLocoShort;
    const region = ["Performance", "Art", "ElectronicSource", "Case", "Misc"].includes(type)
        ? (field("StateProvince") !== "" || field("CountryRegion") !== "" ? LIST_SEPARATOR : "") +
          [field("StateProvince"), field("CountryRegion")].filter((part) => part !== "").join(LIST_SEPARATOR)
        : "";

    const both = (first: Field, second: Field): string => [field(first), field(second)].filter((part) => part !== "").join(LIST_SEPARATOR);
    const after =
        type === "Report" && field("Publisher") !== ""
            ? field("Publisher")
            : (type === "SoundRecording" || type === "Performance") && field("ProductionCompany") !== ""
              ? field("ProductionCompany")
              : type === "ElectronicSource" && (field("ProductionCompany") !== "" || field("Publisher") !== "")
                ? both("Publisher", "ProductionCompany")
                : type === "Case" && field("Court") !== ""
                  ? field("Court")
                  : type === "Art" && (field("Publisher") !== "" || field("Year") !== "")
                    ? both("Publisher", "Year")
                    : published && (field("Publisher") !== "" || (type === "Interview" && field("Broadcaster") !== ""))
                      ? (type === "Interview" ? field("Broadcaster") : "") + field("Publisher")
                      : type === "Interview" && field("Broadcaster") === ""
                        ? ""
                        : Strings.SineNomineShort;

    // The style writes a non-breaking space before the separator, which is empty
    return (type === "Art" ? field("Institution") : "") + place + region + (/[^ \t\r\n]/.test(after) ? LIST_SEPARATOR + after : "");
};

/**
 * A source's entry in the bibliography (the `b:Bibliography` part of the template that matches `/`): its title in
 * italics, for an article, then the people it's named by in bold, or "—．" when they're the ones of the entry before,
 * then the rest of it, by its type, each part ending with a dot.
 *
 * @param previous - The entry before it in the bibliography, if it has one
 */
const formatEntry = (source: WordSource, previous: WordSource | undefined): FormattedText => {
    const { type } = source;
    // populateMain leaves out an interview's editors, translators, compilers and publisher when it was broadcast, and
    // its station when it wasn't
    const broadcast = type === "Interview" && (fieldOf(source, "Broadcaster") !== "" || fieldOf(source, "BroadcastTitle") !== "");
    const field = (name: Field): string =>
        type === "Interview" && name === (broadcast ? "Publisher" : "Station") ? "" : fieldOf(source, name);
    const namesOf = (role: Role): WordNames | undefined =>
        broadcast && (role === "Editor" || role === "Translator" || role === "Compiler") ? undefined : source.names[role];

    const mainString = mainStringOf(source);
    /**
     * The people with a role, and the role, such as "HemingwayErnested.．" (`formatEditor`, `formatTranslator` and the
     * like), unless they're the people the source is named by
     */
    const formatRole = (role: Role, label: string): string => {
        const names = namesOf(role);
        return names !== undefined && stringOf(names) !== mainString && stringOf(names).length > 0
            ? formatPersons(names, SECONDARY_AUTHORS) + label + DOT
            : "";
    };
    const editors = formatRole("Editor", Strings.EditorShortUnCap);
    const translators = formatRole("Translator", Strings.TranslatorShortUnCap);
    const bookAuthors = formatRole("BookAuthor", Strings.BookAuthorShortUnCap);
    const compilers = formatRole("Compiler", Strings.CompilerShortUnCapIso);
    const composers = formatRole("Composer", Strings.ComposerShortUnCapIso);
    const conductors = formatRole("Conductor", Strings.ConductorShortUnCap);
    const counsel = formatRole("Counsel", Strings.CounselShortUnCap);
    const directors = formatRole("Director", Strings.DirectorShortUnCap);
    const performers = formatRole("Performer", Strings.PerformerShortUnCap);
    const producers = formatRole("ProducerName", Strings.ProducerShortUnCap);
    const writers = formatRole("Writer", Strings.WriterShortUnCap);
    // The interviewers, and the abbreviation for an interviewee, which `formatInterviewer` writes when there are interviewees
    const interviewerNames = namesOf("Interviewer");
    const interviewers =
        interviewerNames !== undefined &&
        stringOf(interviewerNames) !== mainString &&
        stringOf(namesOf("Interviewee") ?? { people: [] }) !== ""
            ? formatPersons(interviewerNames, SECONDARY_AUTHORS) + Strings.IntervieweeShortUnCap + DOT
            : "";

    const location = formatLocation(type, field);
    const date = xsl.formatDatePrivate(field("Day"), field("Month"), field("Year"), SIST.Date);
    // `formatDayMonthYearAccessed` looks for the day it was accessed, three times, rather than for each part of the date
    const accessed = field("DayAccessed")
        ? SIST.GeneralOpen +
          textOf(
              xsl.stringFormatDot(
                  Strings.CitedCap,
                  xsl.formatDatePrivate(field("DayAccessed"), field("MonthAccessed"), field("YearAccessed"), SIST.DateAccessed),
              ),
          ) +
          SIST.GeneralClose
        : "";
    const volume = formatVolume(field("Volume"), Strings.VolumeShortCap, Strings.VolumesShortCap);
    const pages = formatPages(field("Pages"));
    const ended = (name: Field): string => (field(name) ? field(name) + DOT : "");
    const comments = ended("Comments");
    const standardNumber = field("StandardNumber") ? OPEN_BRACKET + field("StandardNumber") + CLOSE_BRACKET + DOT : "";
    const url = ended("URL");
    const medium = field("Medium") ? SIST.GeneralOpen + field("Medium") + SIST.GeneralClose : "";
    const mediumDot = medium && medium + DOT;
    const title = xsl.appendDot(field("Title"));
    const italicTitle = italicUnlessEmpty(title);
    const italicField = (name: Field): readonly Node[] => italicUnlessEmpty(xsl.appendDot(field(name)));
    const internetSiteTitle: readonly Node[] = [
        ...italicField("InternetSiteTitle"),
        SIST.GeneralOpen + Strings.OnlineCap + SIST.GeneralClose,
    ];
    const versionAndDate = formatParts(field("Version"), type === "InternetSite" ? field("ProductionCompany") : "", date);
    const printList = (...items: readonly string[]): string => textOf(xsl.printList(items));

    // Each type's own parts, after the people it's named by
    const sectionsOf: Readonly<Record<WordSourceType, () => readonly Node[]>> = {
        Book: () => [
            ...italicTitle,
            editors,
            translators,
            printList(location, field("Edition"), field("Year"), volume, pages),
            comments,
            standardNumber,
        ],
        BookSection: () => [
            title,
            bookAuthors,
            editors,
            translators,
            ...italicField("BookTitle"),
            printList(location, field("Year"), field("Edition"), volume, pages),
            comments,
        ],
        JournalArticle: () => [
            editors,
            field("Issue") && field("Issue") + LIST_SEPARATOR,
            printList(location, date, field("JournalName"), volume, pages),
            comments,
            standardNumber,
        ],
        ArticleInAPeriodical: () => [
            title,
            editors,
            ...italicField("PeriodicalTitle"),
            printList(field("Edition"), date, volume, field("Issue"), pages),
            comments,
        ],
        ConferenceProceedings: () => [
            editors,
            printList(location, field("Year")),
            xsl.appendDot(field("ConferenceName")),
            printList(volume, pages),
            comments,
            standardNumber,
        ],
        Report: () => [
            ...italicTitle,
            formatParts(field("Department"), field("Institution")),
            printList(location, field("Year")),
            printList(pages, field("ThesisType")),
            comments,
            standardNumber,
        ],
        SoundRecording: () => [
            title,
            performers,
            composers,
            conductors,
            producers,
            ...italicField("AlbumTitle"),
            medium,
            printList(location, field("Year")),
            comments,
            standardNumber,
        ],
        Performance: () => [...italicTitle, directors, performers, producers, printList(location, date), comments, standardNumber],
        Art: () => [...italicTitle, printList(location), comments],
        DocumentFromInternetSite: () => [title, ...internetSiteTitle, versionAndDate, accessed, comments, url, standardNumber],
        // The template writes the text of its title, without its italics
        InternetSite: () => [title, ...internetSiteTitle, versionAndDate, accessed, comments, url, standardNumber],
        Film: () => [
            ...italicTitle,
            mediumDot,
            writers,
            performers,
            producers,
            printList(location, field("Year")),
            comments,
            standardNumber,
        ],
        Interview: () => [
            // The text of its title, in italics again when it wasn't broadcast
            broadcast ? title : italicElement(title),
            interviewers,
            editors,
            translators,
            compilers,
            ...italicUnlessEmpty(xsl.appendDot(field("BroadcastTitle"))),
            printList(location, date),
            printList(pages),
            comments,
            standardNumber,
        ],
        Patent: () => [
            ...italicTitle,
            ...italicUnlessEmpty(field("PatentNumber")),
            editors,
            translators,
            printList(location, date),
            xsl.appendDot(field("Type")),
            comments,
        ],
        ElectronicSource: () => [
            ...italicTitle,
            medium,
            editors,
            producers,
            translators,
            printList(location, date),
            printList(field("PublicationTitle"), xsl.appendDot(volume)),
            comments,
            standardNumber,
        ],
        Case: () => [
            ...italicTitle,
            field("CaseNumber") && field("CaseNumber") + LIST_SEPARATOR,
            ended("AbbreviatedCaseNumber"),
            counsel,
            printList(location, date),
            ended("Reporter"),
            comments,
        ],
        Misc: () => [
            title,
            field("Edition"),
            editors,
            compilers,
            translators,
            // The text of its publication's title, in an element in italics even when it has none
            italicElement(xsl.appendDot(field("PublicationTitle"))),
            mediumDot,
            printList(location, date),
            printList(volume, field("Issue"), pages),
            comments,
            standardNumber,
        ],
    };

    // XPath compares the entry before's title and people with this one's only when it has an entry before it
    const previousTitled = previous !== undefined && isTitledFirst(previous.type);
    const sameTitle = previousTitled && fieldOf(previous, "Title") !== "" && fieldOf(previous, "Title") === field("Title");
    const sameMain = previous !== undefined && mainStringOf(previous) === mainString;
    const head: readonly Node[] = [
        ...(isTitledFirst(type) ? [italicElement(sameTitle ? ISO690.SameAuthor + DOT : title)] : []),
        boldElement(previousTitled || isTitledFirst(type) || !sameMain ? formatMain(source) : mainString && SIST.SameAuthor + DOT),
    ];
    return paragraphOf([...head, ...sectionsOf[type]()]);
};

/** What the bibliography is sorted by (`b:SortingString`, as `populateMain` writes it): the authors, with the title */
const sortingStringOf = (source: WordSource): string => {
    const main = mainOf(source);
    const author = main === undefined ? "" : formatPersons(main.names, MAIN_AUTHORS);
    const title = fieldOf(source, "Title");
    const titledFirst = isTitledFirst(source.type);
    return (titledFirst && title ? ` ${title}` : "") + (author ? ` ${author}` : "") + (!titledFirst && title ? ` ${title}` : "");
};

/**
 * A source of a citation (the `b:Citation` part of the template that matches `/`), such as "（Baker，2010p.50）": the last
 * name of the first of the people it's named by, with "et al." when there are more, or an article's title, its year,
 * and the volume or pages cited. It is its tag when it has neither a name nor a year
 */
const formatCitation = ({ source, first, last, hideAuthor, hideYear, pages, volume, prefix, suffix }: CitedSource): FormattedText => {
    const main = mainOf(source);
    const title = fieldOf(source, "Title");
    const author0 =
        isTitledFirst(source.type) && title
            ? title
            : main === undefined
              ? ""
              : "corporate" in main.names
                ? main.names.corporate
                : xsl.formatName(main.names.people[0], CITATION_AUTHOR) + (main.names.people.length > 1 ? Strings.AndOthersUnCap : "");
    const year0 = fieldOf(source, "Year");
    const author = hideAuthor ? "" : author0;
    const year = hideYear ? "" : year0;
    return join(
        first ? OPEN_BRACKET : "",
        prefix ?? "",
        author,
        year ? (author ? LIST_SEPARATOR : "") + year : "",
        author0 === "" && year0 === "" ? source.tag : "",
        // The style's space before them is empty
        volume && pages
            ? volume + ENUM + pages
            : formatVolume(volume, Strings.VolumeShortUnCap, Strings.VolumesShortUnCap) || formatPages(pages),
        suffix ?? "",
        last ? CLOSE_BRACKET : "",
    );
};

/** The bibliography: each source's entry, sorted by the people it's named by, after the entry before it */
const formatBibliography = (sources: readonly WordSource[]): FormattedBibliography => {
    const sorted = sortByKey(sources, sortingStringOf);
    return { hangingIndent: false, paragraphs: sorted.map((source, index) => formatEntry(source, sorted[index - 1])) };
};

/**
 * Word's SIST02 style.
 *
 * @internal
 */
export const sist02: StyleDefinition = {
    name: "SIST02",
    file: "SIST02.XSL",
    version: "2003",
    citation: formatCitation,
    bibliography: formatBibliography,
};
