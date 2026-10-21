/**
 * APA, sixth edition: Word's `APASixthEditionOfficeOnline.xsl`, written in TypeScript.
 *
 * Citations name each source's authors and year, such as "(Baker, 2010)", with the title too when another source has
 * the same first author. The bibliography lists the sources by author, each with a hanging indent.
 *
 * Each function follows the XSL template or variable named in its description, including where that doesn't do what it
 * looks like it should, so the citations and bibliography are the ones Word writes.
 *
 * @module
 */
// The names of the XSL's templates and variables, and Word's own spelling of `PagesCountinousShort`
// cspell:words Countinous ensufix JVIP MSXML PTVI PVEP PVIEP RDAFU RIDC
import { type FormattedRun, type FormattedText, type TextLike, join, textOf } from "./formatted-text";
import { type DatePatterns, LOCALS } from "./locals";
import type { CitedSource, StyleDefinition } from "./style";
import { applyItalic, sortByKey, translate, xslTemplates } from "./xsl";
import { type Field, type Role, type WordNames, type WordPerson, type WordSource, fieldOf } from "../word-source";

const general = LOCALS.General;
const strings = LOCALS.Strings;
const style = LOCALS.APA;
const xsl = xslTemplates(general);

// The most authors a citation names before "et al.", and a bibliography's entry before ". . ."
const MAX_CITATION_AUTHORS = 5;
const MAX_BIBLIOGRAPHY_AUTHORS = 7;

/**
 * Where MSXML, Word's XSLT, starts or ends a copy of a variable. Word reads a space there when it is between two
 * elements, such as two italics, or between an element and the end of the paragraph
 */
const BOUNDARY: FormattedRun = { text: "" };

/** A copy of a variable, with its boundaries (`xsl:copy-of select="$variable"`) */
const copyOf = (text: TextLike): FormattedText => join([BOUNDARY], text, [BOUNDARY]);

/** The text as `apply-templates mode="outputHtml"` writes it, which leaves out its copies' boundaries */
const withoutBoundaries = (text: TextLike): FormattedText => join(text).filter((run) => run !== BOUNDARY);

const isElement = (run: FormattedRun): boolean => !!(run.italics || run.bold || run.underline);

/** The text, with a space where Word reads one at a boundary of a copy, and the boundaries left out */
const resolveBoundaries = (text: FormattedText): FormattedText =>
    text.flatMap((run, index) => {
        if (run !== BOUNDARY) {
            return [run];
        }
        const written = (other: FormattedRun): boolean => other !== BOUNDARY && other.text.length > 0;
        const before = text.slice(0, index).filter(written).pop();
        const after = text.slice(index + 1).find(written);
        return before && isElement(before) && (!after || isElement(after)) ? [{ text: general.Space }] : [];
    });

/** Whether the text has any characters, as `string-length($text) > 0` */
const has = (text: TextLike): boolean => textOf(text).length > 0;

/** The people with a role, or the organization that has it, as Word keeps them */
const namesOf = (source: WordSource, role: Role | ""): WordNames | undefined => (role ? source.names[role] : undefined);

/** The text of the people with a role, or of the organization, as `string-length(b:Author/b:Role)` reads it */
const namesText = (names: WordNames | undefined): string =>
    !names ? "" : "corporate" in names ? names.corporate : names.people.map(({ last, first, middle }) => last + first + middle).join("");

/** How many people have a role, and none for an organization (`count(b:Author/b:Role/b:NameList/b:Person)`) */
const peopleCountOf = (source: WordSource, role: Role): number => {
    const names = source.names[role];
    return names && "people" in names ? names.people.length : 0;
};

/** How many people have a role, or 1 for an organization (`count1` of `formatManySecondary`) */
const countOf = (names: WordNames | undefined): number => (!names ? 0 : "corporate" in names ? 1 : names.people.length);

/**
 * The role whose people a source is named by: its authors, or for some types its editors, composers, writers and so on,
 * whichever it has first (`MainContributors`)
 */
const mainContributorsOf = (source: WordSource): Role | "" => {
    const roles: Readonly<Record<WordSource["type"], readonly Role[]>> = {
        Book: ["Author", "Editor"],
        BookSection: ["Author"],
        JournalArticle: ["Author", "Editor"],
        ArticleInAPeriodical: ["Author", "Editor"],
        ConferenceProceedings: ["Author", "Editor"],
        Report: ["Author"],
        SoundRecording: ["Composer", "Performer", "Conductor"],
        Performance: ["Writer", "Director", "Performer"],
        Art: ["Artist"],
        DocumentFromInternetSite: ["Author", "Editor"],
        InternetSite: ["Author", "Editor"],
        Film: ["ProducerName", "Writer", "Director"],
        Interview: ["Interviewee", "Editor", "Translator"],
        Patent: ["Inventor"],
        ElectronicSource: ["Author", "Editor"],
        Case: [],
        Misc: ["Author", "Editor"],
    };
    return roles[source.type].find((role) => namesText(source.names[role]).length > 0) ?? "";
};

/** A main author's name, such as "Dickens, C. J." (`formatMainAuthor`) */
const formatMainAuthor = (person: WordPerson): string => xsl.formatName(person, style.MainAuthors);

/** Another person's name, such as "E. Hemingway" (`formatSecondaryName`) */
const formatSecondaryName = (person: WordPerson): string => xsl.formatName(person, style.SecondaryAuthors);

/**
 * What comes after the person at a position of a list of people: ", " between them, ", & " before the last, unless the
 * list isn't the last one written, or ". . . " when there are more than seven and the rest are left out
 * (`formatPersonSeperator`)
 *
 * @param position - The person's position, from 1
 * @param isLast - Whether the list is the last of the lists written, which "&" is before the last person of
 */
const formatPersonSeperator = (position: number, count: number, isLast = true): string => {
    let separator = "";
    if (position === count - 1) {
        if (count <= MAX_BIBLIOGRAPHY_AUTHORS) {
            separator += general.AuthorsSeparator + (isLast ? style.BeforeLastAuthor + general.Space : "");
        } else {
            separator += (general.Dot + general.Space).repeat(3);
        }
    }
    if (position < count - 1 && position < MAX_BIBLIOGRAPHY_AUTHORS) {
        separator += general.AuthorsSeparator;
    }
    return separator;
};

/** Whether the person at a position is written: the first six, and the last (`position() < $maxBibAuthors or position() = last()`) */
const isWritten = (position: number, count: number): boolean => position < MAX_BIBLIOGRAPHY_AUTHORS || position === count;

/**
 * People in a list, each written by the format, or the organization (`formatPersonsAuthor`, and with the format of other
 * people `formatPersons`)
 */
const formatPersonsWith =
    (format: (person: WordPerson) => string): ((names: WordNames | undefined) => string) =>
    (names) =>
        !names
            ? ""
            : "corporate" in names
              ? names.corporate
              : names.people
                    .map(
                        (person, index) =>
                            (isWritten(index + 1, names.people.length) ? format(person) : "") +
                            formatPersonSeperator(index + 1, names.people.length),
                    )
                    .join("");

/** Main authors, such as "Smith, J., & Jones, M. A." (`formatPersonsAuthor`) */
const formatPersonsAuthor = formatPersonsWith(formatMainAuthor);

/** Other people, such as "E. Hemingway & J. Austen" (`formatPersons`) */
const formatPersons = formatPersonsWith(formatSecondaryName);

/**
 * People with a role in a list of lists, each written by the format, with "& " before a single person when they are the
 * last list after others (`formatPersons2`, and with the format of main authors `formatPersonsAuthor2`)
 */
const formatPersons2With =
    (format: (person: WordPerson) => string): ((names: WordNames, before: boolean, isLast: boolean) => string) =>
    (names, before, isLast) => {
        if ("corporate" in names) {
            return names.corporate;
        }
        const { people } = names;
        return people
            .map((person, index) => {
                const position = index + 1;
                const and = position === 1 && before && isLast && people.length === 1 ? style.BeforeLastAuthor + general.Space : "";
                return (
                    and +
                    (isWritten(position, people.length) ? format(person) : "") +
                    formatPersonSeperator(position, people.length, isLast)
                );
            })
            .join("");
    };

const formatPersons2 = formatPersons2With(formatSecondaryName);
const formatPersonsAuthor2 = formatPersons2With(formatMainAuthor);

/** One of the lists of people of `formatManySecondary` or `formatManyMain`: its role, and its suffixes for one person or more */
type ManyList = { readonly role: Role | ""; readonly single: string; readonly many: string };

// A list of no one, in place of the second or third list of people
const NO_LIST: ManyList & { readonly names?: WordNames } = { role: "", single: "", many: "" };

/**
 * Up to three lists of people, each with its suffix, such as "(E. Hemingway, Ed., & J. Austen, Trans.)", in brackets
 * (`formatManySecondary`). In place of a third list, `special` is text written after the others, after "&"
 */
const formatManySecondary = (source: WordSource, lists: readonly ManyList[], special = ""): string => {
    const [first, second = NO_LIST, third = NO_LIST] = lists.map((list) => ({ ...list, names: namesOf(source, list.role) }));
    const count1 = countOf(first.names);
    const count2 = countOf(second.names);
    const count3 = third.role ? countOf(third.names) : special ? 1 : 0;
    if (count1 + count2 + count3 === 0) {
        return "";
    }
    const suffix = (list: ManyList, count: number): string => (count === 1 ? list.single : list.many);
    let text = style.GeneralOpen;
    if (count1 > 0) {
        text += formatPersons2(first.names!, false, count2 + count3 === 0) + suffix(first, count1);
    }
    if (count2 > 0) {
        text += (count1 > 0 ? general.AuthorsSeparator : "") + formatPersons2(second.names!, count1 > 0, count3 === 0);
        text += suffix(second, count2);
    }
    if (count3 > 0 && !special) {
        text += (count1 + count2 > 0 ? general.AuthorsSeparator : "") + formatPersons2(third.names!, count1 + count2 > 0, true);
        text += suffix(third, count3);
    } else if (special) {
        text += (count1 + count2 > 0 ? general.AuthorsSeparator + style.BeforeLastAuthor + general.Space : "") + special;
    }
    return text + style.GeneralClose;
};

/** Up to three lists of main people, each with its suffix, and a dot (`formatManyMain`) */
const formatManyMain = (source: WordSource, lists: readonly ManyList[]): string => {
    const names = lists.map((list) => namesOf(source, list.role));
    const counts = names.map(countOf);
    if (counts.every((count) => count === 0)) {
        return "";
    }
    let text = "";
    lists.forEach((list, index) => {
        if (counts[index] === 0) {
            return;
        }
        const before = counts.slice(0, index).some((count) => count > 0);
        const isLast = counts.slice(index + 1).every((count) => count === 0);
        text += (before ? general.AuthorsSeparator : "") + formatPersonsAuthor2(names[index]!, before, isLast);
        text += counts[index] === 1 ? list.single : list.many;
    });
    return text + general.Dot;
};

/** The text in the style's brackets, as "(" and ")" */
const enclose = (text: string): string => style.GeneralOpen + text + style.GeneralClose;

/** The text without the brackets `formatManySecondary` put around it (`substring($text, 1 + string-length($open), ...)`) */
const withoutBrackets = (text: string): string => text.slice(style.GeneralOpen.length, text.length - style.GeneralClose.length);

/** A volume or pages written as one, such as "Vol. 3", or several, such as "Vols. 3-4" or "pp. 5, 9" */
const isSeveral = (text: string): boolean => text.includes(",") || translate(text, general.Hyphens, "").length !== text.length;

/** A date: the source's, the one it was read on, or a court case's (`formatDateCore`) */
const formatDateCore = (day: string, month: string, year: string, patterns: DatePatterns, displayNoDate: boolean): string =>
    year.length === 0 ? (displayNoDate ? strings.NoDateShortUnCap : "") : xsl.formatDatePrivate(day, month, year, patterns);

/** Two fields, with ": " between them, and a dot (`templateB`) */
const templateB = (first: string, second: string): string => xsl.appendDot(first + (first && second ? general.EnumSeparator : "") + second);

/** Two fields, with ", " between them, and a dot (`templateC`) */
const templateC = (first: string, second: string): string => xsl.appendDot(first + (first && second ? general.ListSeparator : "") + second);

/** Two fields, with ", " between them (`templateC2`) */
const templateC2 = (first: string, second: string): string => first + (first && second ? general.ListSeparator : "") + second;

/** The city, state or province, and country or region, such as "Chicago, Illinois, United States" (`templateCSC2`) */
const templateCSC2 = (source: WordSource): string =>
    templateC2(fieldOf(source, "City"), templateC2(fieldOf(source, "StateProvince"), fieldOf(source, "CountryRegion")));

/**
 * A title, a volume, an issue or an edition, and pages, of a publication, in italics but for the issue in brackets and
 * the pages, and a dot (`templateF`, and without italics for the third, `thirdNoItalic`). It is a copy of a variable
 */
const templateF = (first: string, second: string, third: string, fourth: string, fifth: string, thirdNoItalic: boolean): FormattedText => {
    const temp = join(
        first ? applyItalic(first) : "",
        second ? applyItalic((first ? general.ListSeparator : "") + second) : "",
        third ? (thirdNoItalic ? enclose(third) : applyItalic(enclose(third))) : "",
        fourth ? applyItalic((first || second || third ? general.ListSeparator : "") + fourth) : "",
        fifth ? (first || second || third || fourth ? general.ListSeparator : "") + fifth : "",
    );
    return join(copyOf(temp), xsl.needDot(textOf(temp)));
};

/** A journal's or a periodical's title and volume in italics, its issue in brackets, and pages, and a dot (`templateG`) */
const templateG = (first: string, second: string, third: string, fourth: string): FormattedText => {
    const temp = join(
        first ? applyItalic(first) : "",
        second ? applyItalic((first ? general.ListSeparator : "") + second) : "",
        third ? enclose(third) : "",
        fourth ? (first || second || third ? general.ListSeparator : "") + fourth : "",
    );
    return join(temp, xsl.needDot(textOf(temp)));
};

/** A title in italics and another field, and a dot (`templateH`, and `templateCItalic`) */
const templateH = (first: string, second: string): FormattedText => {
    const temp = join(first ? applyItalic(first) : "", first && second ? general.ListSeparator : "", second);
    return join(temp, xsl.needDot(textOf(temp)));
};

/** "Retrieved March 3, 2006, from Site: https://…", or the parts of it the source has (`templateRDAFU`) */
const templateRDAFU = (source: WordSource): string => {
    const dac = formatDateCore(
        fieldOf(source, "DayAccessed"),
        fieldOf(source, "MonthAccessed"),
        fieldOf(source, "YearAccessed"),
        style.DateAccessed,
        false,
    );
    const site = fieldOf(source, "InternetSiteTitle");
    const url = fieldOf(source, "URL");
    const siteAndUrl = (site ? (url ? site : xsl.appendDot(site)) : "") + (site && url ? general.EnumSeparator : "") + url;
    if (dac && siteAndUrl) {
        return textOf(xsl.stringFormat(strings.RetrievedFromCap, dac, siteAndUrl));
    }
    if (dac) {
        return textOf(xsl.stringFormat(strings.RetrievedCap, dac));
    }
    return siteAndUrl ? textOf(xsl.stringFormat(strings.FromCap, siteAndUrl)) : "";
};

/** The title of a source, or what a citation names it by when it has none (`populateMain`'s `b:Title`) */
const citationTitleOf = (source: WordSource): string => {
    const title = fieldOf(source, "Title");
    if (title) {
        return title;
    }
    const fallbacks: Partial<Record<WordSource["type"], Field>> = {
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
    const fallback = fallbacks[source.type];
    return fieldOf(source, "ShortTitle") || (fallback ? fieldOf(source, fallback) : "");
};

/**
 * A source of a citation, such as "(Baker, 2010, p. 50" before the next source's "; " (`xsl:when test="b:Citation"`)
 */
const citation = (cited: CitedSource): FormattedText => {
    const { source } = cited;
    const { type } = source;
    const title0 = fieldOf(source, "ShortTitle") || citationTitleOf(source);
    const year0 = fieldOf(source, "Year");
    const patentNumber = fieldOf(source, "PatentNumber");
    const countryRegion = fieldOf(source, "CountryRegion");
    const patent = patentNumber
        ? (countryRegion ? countryRegion + general.Space : "") + textOf(xsl.stringFormat(strings.PatentNumberShortCap, patentNumber))
        : "";

    const main = namesOf(source, mainContributorsOf(source));
    let author0 = "";
    if (main && "corporate" in main) {
        author0 = main.corporate;
    } else if (main) {
        const count = main.people.length;
        main.people.forEach((person, index) => {
            const position = index + 1;
            if (position === 1) {
                author0 += xsl.formatName(person, cited.nonUniqueLastName ? style.CitationLong : style.CitationShort);
            }
            if (position > 1 && count <= MAX_CITATION_AUTHORS) {
                author0 += xsl.formatName(person, style.CitationShort);
            }
            if (count > MAX_CITATION_AUTHORS && position === 1) {
                author0 += general.ListSeparator + strings.AndOthersUnCap;
            }
            if (count <= MAX_CITATION_AUTHORS && position === count - 1) {
                author0 +=
                    count === 2
                        ? general.Space + style.BeforeLastAuthor + general.Space
                        : general.AuthorsSeparator + style.BeforeLastAuthor + general.Space;
            }
            if (count <= MAX_CITATION_AUTHORS && position < count - 1) {
                author0 += general.AuthorsSeparator;
            }
        });
    }

    const title = cited.hideTitle ? "" : title0;
    const year = cited.hideYear ? "" : type === "InternetSite" ? year0 || strings.NoDateShortUnCap : year0;
    const author = cited.hideAuthor ? "" : author0;
    const { volume, pages } = cited;
    const volVolume = volume
        ? textOf(xsl.stringFormat(isSeveral(volume) ? strings.VolumesShortUnCap : strings.VolumeShortUnCap, volume))
        : "";
    const ppPages = pages ? (isSeveral(pages) ? strings.PagesCountinousShort : strings.PageShort) + general.Space + pages : "";
    const displayAuthor = type === "Patent" && patent ? patent : author;
    const displayTitle = !displayAuthor ? title : type === "Patent" && patent ? "" : cited.repeatedAuthor ? title : "";

    let text = cited.first ? general.OpenBracket : "";
    text += cited.prefix ?? "";
    text += displayAuthor;
    if (displayTitle) {
        text += (displayAuthor ? general.ListSeparator : "") + displayTitle;
    }
    if (year && (author0 || title0 || year0)) {
        text += (displayAuthor || displayTitle ? general.ListSeparator : "") + year;
    }
    if (!author0 && !title0 && !year0) {
        text += source.tag;
    }
    if (volume || pages) {
        text += displayAuthor || displayTitle || year ? general.ListSeparator : "";
        text += volume && pages ? volume + general.Enum + pages : volVolume || ppPages;
    }
    text += cited.suffix ?? "";
    text += cited.last ? general.CloseBracket : general.GroupSeparator;
    return join(text);
};

/** A source's key in the order of the bibliography: its main people, its year and its title (`b:SortingString`) */
const sortingStringOf = (source: WordSource): string => {
    const main = namesOf(source, mainContributorsOf(source));
    const author = main && "corporate" in main ? main.corporate : formatPersonsAuthor(main);
    const title =
        source.type === "Patent"
            ? (fieldOf(source, "CountryRegion") ? general.Space + fieldOf(source, "CountryRegion") : "") +
              (fieldOf(source, "PatentNumber") ? general.Space + fieldOf(source, "PatentNumber") : "")
            : fieldOf(source, "Title")
              ? general.Space + fieldOf(source, "Title")
              : "";
    const year = fieldOf(source, "Year") ? general.Space + fieldOf(source, "Year") : "";
    if (source.type === "Case") {
        return title + year;
    }
    return author ? general.Space + author + year + title : title + year;
};

/** The parts of the source's entry, joined with a space between those it has */
const spaced = (...parts: readonly TextLike[]): FormattedText =>
    join(...parts.filter(has).flatMap((part, index) => (index === 0 ? [part] : [general.Space, part])));

/** A source's entry in the bibliography (`xsl:for-each select="…/b:Bibliography/b:Source"`) */
const entryOf = (source: WordSource): FormattedText => {
    const field = (name: Field): string => fieldOf(source, name);
    const roleText = (role: Role): string => formatPersonsAuthor(source.names[role]);
    const peopleText = (role: Role): string => formatPersons(source.names[role]);
    const count = (role: Role): number => peopleCountOf(source, role);

    const title = field("Title");
    const titleDot = xsl.appendDot(title);
    const edition = field("Edition");
    const year = field("Year");
    const issue = field("Issue");
    const pages = field("Pages");
    const volume = field("Volume");
    const bookTitle = field("BookTitle");
    const conferenceName = field("ConferenceName");
    const publisher = field("Publisher");
    const court = field("Court");
    const date = formatDateCore(field("Day"), field("Month"), year, style.Date, true);
    const dateCourt = formatDateCore(field("Day"), field("Month"), year, style.DateCourt, false);
    const ppPages = pages ? (isSeveral(pages) ? strings.PagesCountinousShort : strings.PageShort) + general.Space + pages : "";
    const prefixVolumeCap = volume
        ? textOf(xsl.stringFormat(isSeveral(volume) ? strings.VolumesShortCap : strings.VolumeShortCap, volume))
        : "";
    const volumeDot = xsl.appendDot(volume);

    const tempCSCPu = templateB(templateCSC2(source), publisher);
    const producerName = peopleText("ProducerName");
    const tempCSCPr = templateB(templateCSC2(source), producerName || field("ProductionCompany"));
    const tempCP = templateB(field("City"), publisher);
    const tempID = templateC(field("Institution"), field("Department"));
    const tempRIDC = textOf(xsl.printList([field("ThesisType"), field("Institution"), field("Department"), field("City")]));
    const tempTCSC = templateC(field("Theater"), templateCSC2(source));
    const tempICSC = templateC(field("Institution"), templateCSC2(source));
    const tempCD = templateB(field("CountryRegion"), field("Distributor"));
    const tempSC = templateC(field("Station"), field("City"));
    const tempTV = templateH(title, field("Version"));
    const tempPrP = templateH(field("BroadcastTitle"), pages);
    const tempJVIP = templateG(field("JournalName"), volume, issue, pages);
    const tempPTVI = templateG(field("PeriodicalTitle"), volume, issue, ppPages);
    const tempPVEP = templateF(field("PublicationTitle"), volume, edition, "", pages, true);
    const tempPVIEP = templateF(field("PublicationTitle"), volume, issue, edition, pages, false);

    // The date is "n.d." when the source has no year, so it is never empty, and neither is this
    const enclosedDateDot = enclose(date) + general.Dot;
    const author = roleText("Author");
    const authorDot = xsl.appendDot(author);
    const editorLF = roleText("Editor");
    const translator = peopleText("Translator");
    const cEditors = count("Editor");
    const ensufixEditorLF = editorLF
        ? editorLF + general.Space + (cEditors > 1 ? enclose(strings.EditorsShortCap) : enclose(strings.EditorShortCap))
        : "";
    const ensufixEditorLFDot = ensufixEditorLF ? ensufixEditorLF + general.Dot : "";
    const ensufixWithRole = (role: Role, single: string, many: string): string => {
        const people = roleText(role);
        return people ? people + general.Space + (count(role) > 1 ? enclose(many) : enclose(single)) + general.Dot : "";
    };
    const theAuthor = author || ensufixEditorLF;
    const theAuthorDot = xsl.appendDot(theAuthor);
    const writeEditor: Role | "" = author ? "Editor" : "";

    const titleEditionVolumeDot = title
        ? join(
              applyItalic(edition || prefixVolumeCap ? title : titleDot),
              edition || prefixVolumeCap
                  ? general.Space +
                        style.GeneralOpen +
                        (edition ? textOf(xsl.stringFormat(strings.EditionShortUnCap, edition)) : "") +
                        (edition && prefixVolumeCap ? general.ListSeparator : "") +
                        prefixVolumeCap +
                        style.GeneralClose +
                        general.Dot
                  : "",
          )
        : [];

    const theEditorAndTranslatorDot = formatManySecondary(source, [
        {
            role: writeEditor,
            single: general.ListSeparator + strings.EditorShortCap,
            many: general.ListSeparator + strings.EditorsShortCap,
        },
        {
            role: "Translator",
            single: general.ListSeparator + strings.TranslatorShortCap,
            many: general.ListSeparator + strings.TranslatorsShortCap,
        },
    ]);
    const editorSuffix = general.Space + enclose(strings.EditorShortCap);
    const theEditorEnc = withoutBrackets(formatManySecondary(source, [{ role: writeEditor, single: editorSuffix, many: editorSuffix }]));
    const theBookAuthorAndEditor = formatManySecondary(source, [
        { role: "BookAuthor", single: "", many: "" },
        { role: "Editor", single: editorSuffix, many: general.Space + enclose(strings.EditorsShortCap) },
    ]);
    const theBookAuthorAndEditor2 = theBookAuthorAndEditor ? withoutBrackets(theBookAuthorAndEditor) : "";
    const theBookAuthorAndEditorDot = theBookAuthorAndEditor ? theBookAuthorAndEditor2 + general.Dot : "";

    const bookTitlePagesDot = bookTitle
        ? volume || pages || translator || edition
            ? join(
                  applyItalic(bookTitle),
                  general.Space +
                      style.GeneralOpen +
                      (translator
                          ? translator +
                            general.ListSeparator +
                            (count("Translator") > 1 ? strings.TranslatorsShortCap : strings.TranslatorShortCap)
                          : "") +
                      (edition
                          ? (translator ? general.ListSeparator : "") + textOf(xsl.stringFormat(strings.EditionShortUnCap, edition))
                          : "") +
                      (volume
                          ? (translator || edition ? general.ListSeparator : "") +
                            textOf(xsl.stringFormat(isSeveral(volume) ? strings.VolumesShortCap : strings.VolumeShortCap, volume))
                          : "") +
                      (pages ? (translator || edition || volume ? general.ListSeparator : "") + ppPages : "") +
                      style.GeneralClose +
                      general.Dot,
              )
            : applyItalic(xsl.appendDot(bookTitle))
        : [];

    const composerLF = roleText("Composer");
    const performerLF = roleText("Performer");
    const conductorLF = roleText("Conductor");
    const theAuthorSoundRecordingDot = composerLF || performerLF || conductorLF;
    const composer = peopleText("Composer");
    const performer = peopleText("Performer");
    const conductor = peopleText("Conductor");
    const secondarySoundRecordingName = composer ? performer || conductor : performer ? conductor : "";
    const thePerformerAndConductorDot = secondarySoundRecordingName
        ? style.SecondaryOpen +
          textOf(xsl.stringFormat(strings.RecordedByCap, secondarySoundRecordingName)) +
          style.SecondaryClose +
          general.Dot
        : "";

    const writer = peopleText("Writer");
    const director = peopleText("Director");
    const theAuthorPerformanceDot =
        xsl.appendDot(roleText("Writer")) ||
        ensufixWithRole("Director", strings.DirectorCap, strings.DirectorsCap) ||
        ensufixWithRole("Performer", strings.PerformerCap, strings.PerformersCap);
    const thePerformanceDirectorAndPerformerDot = formatManySecondary(source, [
        {
            role: writer ? "Director" : "",
            single: general.ListSeparator + strings.DirectorCap,
            many: general.ListSeparator + strings.DirectorsCap,
        },
        {
            role: writer || director ? "Performer" : "",
            single: general.ListSeparator + strings.PerformerCap,
            many: general.ListSeparator + strings.PerformersCap,
        },
    ]);

    const theMiscAuthorDot = authorDot || ensufixEditorLFDot;
    const theMiscEditorAndTranslatorAndCompilerDot = formatManySecondary(source, [
        {
            role: authorDot ? "Editor" : "",
            single: general.ListSeparator + strings.EditorShortCap,
            many: general.ListSeparator + strings.EditorsShortCap,
        },
        {
            role: "Translator",
            single: general.ListSeparator + strings.TranslatorShortCap,
            many: general.ListSeparator + strings.TranslatorsShortCap,
        },
        { role: "Compiler", single: general.ListSeparator + strings.CompilerCap, many: general.ListSeparator + strings.CompilersCap },
    ]);
    const filmSuffix = (word: string): string => general.Space + enclose(word);
    const theFilmProducerAndWriterAndDirectorDot = formatManyMain(source, [
        { role: "ProducerName", single: filmSuffix(strings.ProducerCap), many: filmSuffix(strings.ProducersCap) },
        { role: "Writer", single: filmSuffix(strings.WriterCap), many: filmSuffix(strings.WritersCap) },
        { role: "Director", single: filmSuffix(strings.DirectorCap), many: filmSuffix(strings.DirectorsCap) },
    ]);
    const interviewer: ManyList = {
        role: "Interviewer",
        single: general.ListSeparator + strings.InterviewerCap,
        many: general.ListSeparator + strings.InterviewersCap,
    };
    const theInterviewInterviewerAndEditorAndTranslator = formatManySecondary(source, [
        interviewer,
        { role: "Editor", single: general.ListSeparator + strings.EditorCap, many: general.ListSeparator + strings.EditorsCap },
        { role: "Translator", single: general.ListSeparator + strings.TranslatorCap, many: general.ListSeparator + strings.TranslatorsCap },
    ]);
    const theInterviewInterviewer = formatManySecondary(source, [interviewer]);
    const theInternetSiteEditorAndProducerDot = formatManySecondary(
        source,
        [
            { role: writeEditor, single: general.ListSeparator + strings.EditorCap, many: general.ListSeparator + strings.EditorsCap },
            {
                role: "ProducerName",
                single: general.ListSeparator + strings.ProducerCap,
                many: general.ListSeparator + strings.ProducersCap,
            },
        ],
        field("ProductionCompany"),
    );

    const albumTitle = field("AlbumTitle");
    const medium = field("Medium");
    const albumTitleMedium = join(
        albumTitle ? xsl.stringFormat(strings.OnAlbumTitleCap, applyItalic(albumTitle)) : "",
        albumTitle && medium ? general.Space : "",
        medium ? style.SecondaryOpen + medium + style.SecondaryClose : "",
    );
    const albumTitleMediumDot = textOf(albumTitleMedium).trim()
        ? join(copyOf(albumTitleMedium), xsl.needDot(textOf(albumTitleMedium)))
        : [];

    const conferenceNameItalic = (): FormattedText =>
        applyItalic((!volume && pages) || (!publisher && (volume || pages)) ? conferenceName : xsl.appendDot(conferenceName));
    const conferenceVolumeAndPages: readonly TextLike[] =
        volumeDot || pages
            ? [
                  publisher ? "" : general.ListSeparator,
                  volumeDot && !pages ? join(general.Space, applyItalic(volumeDot)) : "",
                  volume && pages ? join(general.Space, applyItalic(volume), general.ListSeparator, xsl.appendDot(ppPages)) : "",
                  !volume && pages ? general.Space + enclose(ppPages) + general.Dot : "",
              ]
            : [];

    const before = (...parts: readonly TextLike[]): boolean => parts.some(has);

    switch (source.type) {
        case "Book":
            return theAuthorDot
                ? spaced(theAuthorDot, enclosedDateDot, titleEditionVolumeDot, theEditorAndTranslatorDot, tempCSCPu)
                : spaced(titleEditionVolumeDot, enclosedDateDot, theEditorAndTranslatorDot, tempCSCPu);
        case "BookSection": {
            const opening = authorDot ? spaced(authorDot, enclosedDateDot, titleDot) : spaced(titleDot, enclosedDateDot);
            const bookAuthors = theBookAuthorAndEditor
                ? join(
                      general.Space,
                      xsl.stringFormat(strings.InNameCap, has(bookTitlePagesDot) ? theBookAuthorAndEditor2 : theBookAuthorAndEditorDot),
                  )
                : [];
            const book = has(bookTitlePagesDot)
                ? join(
                      theBookAuthorAndEditor ? general.ListSeparator : general.Space,
                      theBookAuthorAndEditor ? bookTitlePagesDot : xsl.stringFormat(strings.InNameCap, bookTitlePagesDot),
                  )
                : [];
            const place = tempCSCPu ? general.Space + tempCSCPu : "";
            return join(opening, bookAuthors, book, place);
        }
        case "JournalArticle":
            return theAuthorDot
                ? spaced(theAuthorDot, enclosedDateDot, titleDot, theEditorAndTranslatorDot, tempJVIP)
                : spaced(titleDot, enclosedDateDot, theEditorAndTranslatorDot, tempJVIP);
        case "ArticleInAPeriodical":
            return theAuthorDot
                ? spaced(theAuthorDot, enclosedDateDot, titleDot, theEditorAndTranslatorDot, tempPTVI)
                : spaced(titleDot, enclosedDateDot, theEditorAndTranslatorDot, tempPTVI);
        case "ConferenceProceedings": {
            if (theAuthorDot) {
                const conference = theEditorEnc
                    ? join(
                          general.Space,
                          xsl.stringFormat(
                              strings.InNameCap,
                              conferenceName
                                  ? join(theEditorEnc, general.ListSeparator, conferenceNameItalic())
                                  : theEditorEnc + general.Dot,
                          ),
                      )
                    : conferenceName
                      ? join(general.Space, conferenceNameItalic())
                      : [];
                return join(
                    spaced(theAuthorDot, enclosedDateDot, titleDot),
                    conference,
                    ...conferenceVolumeAndPages,
                    tempCP ? general.Space + tempCP : "",
                );
            }
            return join(
                titleDot,
                (title ? general.Space : "") + enclosedDateDot,
                conferenceName ? join(general.Space, conferenceNameItalic()) : "",
                ...conferenceVolumeAndPages,
                tempCP ? general.Space + tempCP : "",
            );
        }
        case "SoundRecording":
            return theAuthorSoundRecordingDot
                ? spaced(
                      theAuthorSoundRecordingDot,
                      enclosedDateDot,
                      thePerformerAndConductorDot ? title + general.Space + thePerformerAndConductorDot : titleDot,
                      albumTitleMediumDot,
                      tempCSCPr,
                  )
                : spaced(titleDot, enclosedDateDot, thePerformerAndConductorDot, albumTitleMediumDot, tempCSCPr);
        case "Performance":
            return theAuthorPerformanceDot
                ? spaced(
                      theAuthorPerformanceDot,
                      enclosedDateDot,
                      titleDot ? applyItalic(titleDot) : "",
                      thePerformanceDirectorAndPerformerDot,
                      tempTCSC,
                  )
                : spaced(titleDot ? applyItalic(titleDot) : "", enclosedDateDot, tempTCSC);
        case "DocumentFromInternetSite":
            return theAuthorDot
                ? spaced(theAuthorDot, enclosedDateDot, titleDot ? applyItalic(titleDot) : "", theEditorAndTranslatorDot)
                : spaced(titleDot ? applyItalic(titleDot) : "", enclosedDateDot, theEditorAndTranslatorDot);
        case "InternetSite":
            return theAuthorDot
                ? spaced(theAuthorDot, enclosedDateDot, tempTV, theInternetSiteEditorAndProducerDot)
                : spaced(tempTV, enclosedDateDot, theInternetSiteEditorAndProducerDot);
        case "Case": {
            const courtAndDate = court || dateCourt ? enclose(court + (court && dateCourt ? general.Space : "") + dateCourt) : "";
            return join(
                title,
                field("CaseNumber") ? (title ? general.ListSeparator : "") + field("CaseNumber") : "",
                courtAndDate ? (title || field("CaseNumber") ? general.Space : "") + courtAndDate : "",
                title || field("CaseNumber") || court || dateCourt ? general.Dot : "",
            );
        }
        case "Patent": {
            const inventorLFDot = xsl.appendDot(roleText("Inventor"));
            const patentNumber = field("PatentNumber");
            return join(
                spaced(inventorLFDot, enclosedDateDot),
                patentNumber
                    ? applyItalic(
                          join(
                              general.Space,
                              field("CountryRegion") ? field("CountryRegion") + general.Space : "",
                              xsl.stringFormatDot(strings.PatentNumberShortCap, patentNumber),
                          ),
                      )
                    : "",
            );
        }
        case "Misc":
            return theMiscAuthorDot
                ? spaced(
                      theMiscAuthorDot,
                      enclosedDateDot,
                      titleDot,
                      withoutBoundaries(tempPVIEP),
                      theMiscEditorAndTranslatorAndCompilerDot,
                      tempCSCPu,
                  )
                : spaced(titleDot, enclosedDateDot, withoutBoundaries(tempPVIEP), theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu);
        case "ElectronicSource":
            return theMiscAuthorDot
                ? spaced(
                      theMiscAuthorDot,
                      enclosedDateDot,
                      titleDot,
                      has(tempPVEP) ? copyOf(tempPVEP) : "",
                      theMiscEditorAndTranslatorAndCompilerDot,
                      tempCSCPu,
                  )
                : spaced(titleDot, enclosedDateDot, withoutBoundaries(tempPVEP), theMiscEditorAndTranslatorAndCompilerDot, tempCSCPu);
        case "Art": {
            const artistLFDot = xsl.appendDot(roleText("Artist"));
            const publicationTitleDot = xsl.appendDot(field("PublicationTitle"));
            return join(
                artistLFDot,
                general.Space + enclosedDateDot,
                titleDot ? join(artistLFDot ? general.Space : "", publicationTitleDot ? titleDot : applyItalic(titleDot)) : "",
                publicationTitleDot ? join(before(artistLFDot, titleDot) ? general.Space : "", applyItalic(publicationTitleDot)) : "",
                tempICSC ? (before(artistLFDot, titleDot, publicationTitleDot) ? general.Space : "") + tempICSC : "",
            );
        }
        case "Report":
            return spaced(
                authorDot,
                enclosedDateDot,
                titleDot ? applyItalic(titleDot) : "",
                ...(publisher ? [tempID, tempCP] : [tempRIDC]),
            );
        case "Film":
            return join(
                theFilmProducerAndWriterAndDirectorDot
                    ? join(spaced(theFilmProducerAndWriterAndDirectorDot, enclosedDateDot, title ? applyItalic(title) : ""))
                    : join(title ? applyItalic(title) : "", (title ? general.Space : "") + enclosedDateDot),
                general.Space + style.SecondaryOpen + strings.MotionPictureCap + style.SecondaryClose + general.Dot,
                tempCD ? general.Space + tempCD : "",
            );
        // An interview, the last of the types of source
        default: {
            const intervieweeLFDot = xsl.appendDot(roleText("Interviewee"));
            const interviewTitleDot = xsl.appendDot(title);
            const broadcasterDot = xsl.appendDot(field("Broadcaster"));
            return field("Broadcaster")
                ? spaced(
                      intervieweeLFDot,
                      enclosedDateDot,
                      interviewTitleDot,
                      xsl.appendDot(field("BroadcastTitle")) ? applyItalic(xsl.appendDot(field("BroadcastTitle"))) : "",
                      theInterviewInterviewer,
                      broadcasterDot,
                      tempSC,
                  )
                : spaced(
                      intervieweeLFDot,
                      enclosedDateDot,
                      interviewTitleDot,
                      tempPrP,
                      theInterviewInterviewerAndEditorAndTranslator,
                      tempCSCPu,
                  );
        }
    }
};

/**
 * A source's entry: its parts, as a copy of a variable, then where it was read online, as the paragraph of the
 * bibliography is written (`xsl:element name="p"`)
 */
const paragraphOf = (source: WordSource): FormattedText => {
    const entry = entryOf(source);
    const retrieved = templateRDAFU(source);
    return resolveBoundaries(join(has(entry) ? join(copyOf(entry), retrieved ? general.Space : "") : "", retrieved));
};

/** APA, sixth edition: Word's `APASixthEditionOfficeOnline.xsl` */
export const apa: StyleDefinition = {
    name: "APA",
    file: "APASixthEditionOfficeOnline.xsl",
    version: "6",
    citation,
    bibliography: (sources) => ({
        paragraphs: sortByKey(sources, sortingStringOf).map(paragraphOf),
        hangingIndent: true,
    }),
};
