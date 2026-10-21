/**
 * The templates Word's two styles from the Chicago Manual of Style share, Chicago (CHICAGO.XSL) and Turabian
 * (TURABIAN.XSL): they write the same citations, find the people a source is named by and sort their bibliographies in
 * the same way, and write some parts of an entry, such as the city and the publisher, alike.
 *
 * Each function follows the XSL template its description names, as both styles have it.
 *
 * @module
 */
// Turabian's name, and the XSL's spelling of "sufix" in the names of its variables
// cspell:words Turabian TURABIAN sufix
import { type FormattedText, type TextLike, join, textOf } from "./formatted-text";
import { LOCALS } from "./locals";
import type { CitedSource, FormattedBibliography } from "./style";
import { sortByKey, translate, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordSource, type WordSourceType, fieldOf } from "../word-source";

const { General, Strings, Chicago } = LOCALS;
const xsl = xslTemplates(General);

/** The parts, when the test passes: a text that isn't empty, or true */
export const when = (test: string | boolean, ...parts: readonly TextLike[]): FormattedText => (test ? join(...parts) : []);

/** A space, when any of the texts isn't empty, as the styles write one between the parts of an entry */
export const spaceIf = (...texts: readonly string[]): string => (texts.some((text) => text.length > 0) ? General.Space : "");

/** ", " when any of the texts isn't empty, as a citation separates its volume or pages from what comes before them */
const listSeparatorIf = (...texts: readonly string[]): string => (texts.some((text) => text.length > 0) ? General.ListSeparator : "");

/** The text with its spaces at the start and end removed, and each run of them made one space, as XPath's `normalize-space` */
export const normalizeSpace = (text: string): string => text.replace(/[ \t\r\n]+/g, " ").trim();

/** A format with one text in place of %1, or "" when the text is empty, as the styles' `StringFormat` calls are guarded */
export const formatIf = (format: string, text: string): string => (text ? textOf(xsl.stringFormat(format, text)) : "");

/** A volume, as "Vol. 2", or "Vols. 2-3" for more than one (the styles' choice of `VolumeShortCap` and `VolumesShortCap`) */
export const volumeFormatOf = (volume: string, single: string, several: string): string =>
    volume.includes(",") || translate(volume, General.Hyphens, "").length !== volume.length ? several : single;

/**
 * The word for one or more people, such as "Trans.", then their names, and a dot (`prefixTranslatorDot` and others). Its
 * people are editors, translators, conductors, composers or compilers, who are never an organization, so the list has a
 * name only when it has people
 */
export const prefixed = (text: string, count: number, single: string, several: string): string =>
    text ? (count > 1 ? several : single) + General.Space + xsl.appendDot(text) : "";

/**
 * A list of people last name first, ", " and the word for one or more of them, such as "ed." (`sufixEditorLFDot` and
 * others). Its people are editors, compilers or translators, who are never an organization, so the list has a name only
 * when it has people
 */
export const suffixed = (text: string, count: number, single: string, several: string): string =>
    text ? text + General.ListSeparator + (count > 1 ? several : single) : "";

/** A title in quotes */
export const quoted = (text: string): string => General.OpenQuote + text + General.CloseQuote;

/** The text of a role's people, their names one after another, or of its organization, as XPath reads `b:Author/b:Editor` */
const roleTextOf = (names: WordNames | undefined): string =>
    names === undefined
        ? ""
        : "corporate" in names
          ? names.corporate
          : names.people.map((person) => person.last + person.first + person.middle).join("");

/** How many people have a role, as `count(b:Author/b:Editor/b:NameList/b:Person)` */
export const countOf = (names: WordNames | undefined): number => (names !== undefined && "people" in names ? names.people.length : 0);

// The roles a source is named by, in the order the styles look for them, by type of source (`MainContributors`)
const MAIN_CONTRIBUTORS: Readonly<Record<WordSourceType, readonly Role[]>> = {
    Book: ["Author", "Editor", "Translator"],
    BookSection: ["Author", "BookAuthor"],
    JournalArticle: ["Author", "Editor"],
    ArticleInAPeriodical: ["Author", "Editor"],
    ConferenceProceedings: ["Author"],
    Report: ["Author"],
    SoundRecording: ["Performer", "Conductor", "Composer", "Artist"],
    Performance: ["Writer", "Performer", "Director"],
    Art: ["Artist"],
    DocumentFromInternetSite: ["Author"],
    InternetSite: ["Author"],
    Film: ["Writer", "Performer", "Director"],
    Interview: ["Interviewee", "Editor", "Translator"],
    Patent: ["Inventor", "Editor", "Translator"],
    ElectronicSource: ["Author", "Editor"],
    Case: ["Author"],
    Misc: ["Author", "Editor", "Compiler", "Translator"],
};

/** The role a source is named by: the first of its type's roles that has a name (`MainContributors`) */
const mainContributorOf = (source: WordSource): Role | undefined =>
    MAIN_CONTRIBUTORS[source.type].find((role) => roleTextOf(source.names[role]).length > 0);

/** The people or the organization a source is named by, as `populateMain` copies them to `b:Author/b:Main` */
export const mainOf = (source: WordSource): WordNames | undefined => {
    const role = mainContributorOf(source);
    return role === undefined ? undefined : source.names[role];
};

// The field a citation's title falls back to after the short title, when the source has no title, by type of source
// (`populateMain`, for `b:Citation`)
const CITATION_TITLES: Readonly<Partial<Record<WordSourceType, Field>>> = {
    BookSection: "BookTitle",
    ArticleInAPeriodical: "PeriodicalTitle",
    InternetSite: "InternetSiteTitle",
    DocumentFromInternetSite: "InternetSiteTitle",
    ElectronicSource: "PublicationTitle",
    Art: "PublicationTitle",
    Misc: "PublicationTitle",
    SoundRecording: "AlbumTitle",
    Interview: "BroadcastTitle",
};

/** A source's title in a citation: its title, or its short title, or the title of what it's in (`populateMain`) */
const citationTitleOf = (source: WordSource): string => {
    const fallback = CITATION_TITLES[source.type];
    return fieldOf(source, "Title") || fieldOf(source, "ShortTitle") || (fallback === undefined ? "" : fieldOf(source, fallback));
};

/** The year, or "n.d." (`getYear`) */
export const getYear = (source: WordSource): string => fieldOf(source, "Year") || Strings.NoDateShortUnCap;

/** The first, the second after ": ", and the third after ", ", of those that aren't empty (`templateANoDot`) */
export const templateANoDot = (first: string, second: string, third: string): string =>
    first + (first && second ? General.EnumSeparator : "") + second + ((first || second) && third ? General.ListSeparator : "") + third;

/** {@link templateANoDot}, with a dot after it (`templateA`) */
export const templateA = (first: string, second: string, third: string): string => xsl.appendDot(templateANoDot(first, second, third));

/** The first and the second, with a space between them, and a dot after (`templateSpaceAB`) */
const templateSpaceAB = (first: string, second: string): string => xsl.appendDot(first + (first && second ? General.Space : "") + second);

/** The first and the second, with ", " between them, and a dot after (`templateC`) */
export const templateC = (first: string, second: string): string =>
    xsl.appendDot(first + (first && second ? General.ListSeparator : "") + second);

/** The first, the second after ", ", and the third after ": ", with a dot after (`templateE`) */
export const templateE = (first: string, second: string, third: string): string =>
    xsl.appendDot(
        first + (first && second ? General.ListSeparator : "") + second + ((first || second) && third ? General.EnumSeparator : "") + third,
    );

/** The city, and the state or province (`templateCityStateProvince`) */
export const templateCityStateProvince = (source: WordSource): string => {
    const city = fieldOf(source, "City");
    const state = fieldOf(source, "StateProvince");
    return city + (city && state ? General.ListSeparator : "") + state;
};

/** The country and the patent's number, such as "United States Patent 7,123,456." (`templateCP`) */
export const templateCP = (source: WordSource): string =>
    templateSpaceAB(fieldOf(source, "CountryRegion"), formatIf(Strings.PatentCap, fieldOf(source, "PatentNumber")));

/**
 * The items of a list, with a space before them, or nothing when the list is empty (`PrintSpaceAndList`)
 */
export const printSpaceAndList = (items: readonly TextLike[]): FormattedText => {
    const list = xsl.printList(items);
    return when(textOf(list), General.Space, list);
};

/**
 * The text a bibliography is sorted by: the authors, a periodical's title, the title, and whether the source is named
 * by its authors, editors, compilers or translators (`b:SortingString`, from `populateMain`)
 *
 * @param formatPersonsAuthor - The style's list of a source's authors
 */
const sortingStringOf = (source: WordSource, formatPersonsAuthor: (names: WordNames | undefined) => string): string => {
    const role = mainContributorOf(source);
    const author = formatPersonsAuthor(mainOf(source));
    const periodicalTitle = fieldOf(source, "PeriodicalTitle");
    const title = fieldOf(source, "Title");
    const order = role === "Editor" ? "2" : role === "Compiler" ? "3" : role === "Translator" ? "4" : "1";
    return `${author && source.type !== "Case" ? ` ${author}` : ""}${
        periodicalTitle && source.type === "ArticleInAPeriodical" ? ` ${periodicalTitle}` : ""
    }${title ? ` ${title}` : ""} ${order}`;
};

/**
 * A source of a citation, such as "(Baker 2010, 50)", with its authors, the title when another source has the same
 * authors, and the year (`b:Citation`)
 */
export const citation = (cited: CitedSource): FormattedText => {
    const { source } = cited;
    const title0 = fieldOf(source, "ShortTitle") || citationTitleOf(source);
    const yearSimple = fieldOf(source, "Year");
    const year0 = yearSimple || Strings.NoDateShortUnCap;
    const main = mainOf(source);
    const minAuthors = cited.minAuthors > 1 ? cited.minAuthors : 1;
    const patterns = cited.nonUniqueLastName ? Chicago.CitationLong : Chicago.CitationShort;
    const people = main !== undefined && "people" in main ? main.people : [];
    const cAuthors = people.length;
    const author0 =
        main !== undefined && "corporate" in main
            ? main.corporate
            : people
                  .map((person, index) => {
                      const position = index + 1;
                      const name = cAuthors > 3 && position > minAuthors ? "" : xsl.formatName(person, patterns);
                      const separator =
                          cAuthors > 3 && position === minAuthors
                              ? General.ListSeparator + Strings.AndOthersUnCap
                              : cAuthors > 3 && position > minAuthors
                                ? ""
                                : (cAuthors - 1 === position && (cAuthors === 2 || cAuthors === 3)) || (cAuthors > 3 && position === 2)
                                  ? General.Space + Strings.AndUnCap + General.Space
                                  : cAuthors > position && position < 3
                                    ? General.AuthorsSeparator
                                    : "";
                      return name + separator;
                  })
                  .join("");
    const title = cited.hideTitle ? "" : title0;
    const year = cited.hideYear ? "" : year0;
    const author = cited.hideAuthor ? "" : author0;
    const { volume, pages } = cited;
    const volVolume = formatIf(volumeFormatOf(volume, Strings.VolumeShortUnCap, Strings.VolumesShortUnCap), volume);
    const displayTitle = !author || cited.repeatedAuthor ? title : "";
    // A source with no authors, title or year is cited by its tag
    const nothing = !author0 && !title0 && !yearSimple;
    return join(
        cited.first ? General.OpenBracket : "",
        cited.prefix ?? "",
        author,
        when(displayTitle, author ? General.ListSeparator : "", displayTitle),
        nothing ? source.tag : "",
        when(year && !nothing, spaceIf(author, displayTitle), year),
        when(
            volume || pages,
            listSeparatorIf(author, displayTitle, year),
            volume && pages ? volume + General.Enum + pages : volVolume || pages,
        ),
        cited.suffix ?? "",
        cited.last ? General.CloseBracket : General.ListSeparator,
    );
};

/**
 * A bibliography: its sources sorted, each written as an entry with its authors, or with a dash for the authors of an
 * entry with the same authors as the one before it (`b:Bibliography`)
 *
 * @param formatPersonsAuthor - The style's list of a source's authors (`formatPersonsAuthor`)
 * @param bibliographyEntry - The style's entry of a source, given its authors or the dash
 */
export const bibliographyOf = (
    sources: readonly WordSource[],
    formatPersonsAuthor: (names: WordNames | undefined) => string,
    bibliographyEntry: (source: WordSource, authorMain: string) => FormattedText,
): FormattedBibliography => {
    const sorted = sortByKey(sources, (source) => sortingStringOf(source, formatPersonsAuthor));
    const mains = sorted.map((source) => formatPersonsAuthor(mainOf(source)));
    return {
        hangingIndent: true,
        paragraphs: sorted.map((source, index) =>
            bibliographyEntry(
                source,
                index > 0 && mains[index] === mains[index - 1] && mains[index].length > 0 ? Chicago.SameAuthor : mains[index],
            ),
        ),
    };
};
